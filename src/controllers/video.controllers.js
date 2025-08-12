import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiErrors.js";
import ApiResponse from "../utils/apiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";

/**
 * Get all videos
 */
const getAllVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find()
        .populate("owner", "userName email")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

/**
 * Publish a new video
 */
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    // Validate uploads
    if (!req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    // Upload to Cloudinary
    const videoUpload = await uploadOnCloudinary(req.files.videoFile[0].path, "video");
    const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path, "image");

    if (!videoUpload?.secure_url || !thumbnailUpload?.secure_url) {
        throw new ApiError(500, "Failed to upload video or thumbnail");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.secure_url, // match schema
        thumbnail: thumbnailUpload.secure_url,
        duration: Math.round(videoUpload.duration) || 0, // avoid schema error
        views: 0, // start at zero
        owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});

/**
 * Update video details (title/description/thumbnail)
 */
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const { title, description } = req.body;

    if (title) video.title = title;
    if (description) video.description = description;

    // If thumbnail is updated
    if (req.file) {
        await deleteFromCloudinary(video.thumbnail); // delete old thumbnail from Cloudinary
        const thumbnailUpload = await uploadOnCloudinary(req.file.path, "image");
        if (thumbnailUpload?.secure_url) {
            video.thumbnail = thumbnailUpload.secure_url;
        }
    }

    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

/**
 * Delete video
 */
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(video.videoFile, "video");
    await deleteFromCloudinary(video.thumbnail, "image");

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

/**
 * Toggle video publish status
 */
const toggleVideoPublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            video.isPublished
                ? "Video published successfully"
                : "Video unpublished successfully"
        )
    );
});

export {
    getAllVideos,
    publishAVideo,
    updateVideo,
    deleteVideo,
    toggleVideoPublishStatus
};
