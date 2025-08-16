import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/videos.models.js";
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
 * Get video by ID
 */
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)
        .populate("owner", "userName email");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

/**
 * Publish a new video
 */
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoUpload = await uploadOnCloudinary(req.files.videoFile[0].path);
    const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path,);

    if (!videoUpload?.url || !thumbnailUpload?.url) {
        throw new ApiError(500, "Failed to upload video or thumbnail");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        views: 0,
         duration: Math.round(videoUpload.duration) || 0,
        owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});

/**
 * Update video details
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

    if (req.file) {
        await deleteFromCloudinary(video.thumbnail, "image");
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

    await deleteFromCloudinary(video.videoFile, "video");
    await deleteFromCloudinary(video.thumbnail, "image");

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

/**
 * Toggle publish status
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
    getVideoById,
    publishAVideo,
    updateVideo,
    deleteVideo,
    toggleVideoPublishStatus
};
