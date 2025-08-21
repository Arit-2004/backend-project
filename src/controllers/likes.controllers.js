import { Like } from "../models/likes.models.js";
import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiErrors.js";


// Toggle like on a video
const toggleLikeVideos = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  // Check if like already exists
  const existingLike = await Like.findOne({
    video: videoId,
    owner: req.user._id,
  });

  if (existingLike) {
    // Unlike (remove like)
    await existingLike.deleteOne();
    return res.status(200).json(
      new ApiResponse(
        200,
        { video: videoId, owner: req.user._id },
        "Like removed successfully"
      )
    );
  }

  // Add like
  const like = await Like.create({
    video: videoId,
    owner: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, like, "Like added successfully")
  );
});


// Toggle like on a comment
const toggleLikeComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    owner: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res.status(200).json(
      new ApiResponse(
        200,
        { comment: commentId, owner: req.user._id },
        "Like removed successfully from the comment"
      )
    );
  }

  const like = await Like.create({
    comment: commentId,
    owner: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, like, "Like added to comment successfully")
  );
});


// Toggle like on a tweet
const toggleLikeTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    owner: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res.status(200).json(
      new ApiResponse(
        200,
        { tweet: tweetId, owner: req.user._id },
        "Like removed from tweet successfully"
      )
    );
  }

  const like = await Like.create({
    tweet: tweetId,
    owner: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, like, "Like added to tweet successfully"),
    console.log("The function export to the routes file correctly")
  );
});


// Get all liked videos of a user
const getAllLikeVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({
    owner: req.user._id,
    video: { $ne: null },
  }).populate("video");

  return res.status(200).json(
    new ApiResponse(200, likes, "All liked videos fetched successfully")
  );
});


export {
  toggleLikeVideos,
  toggleLikeComment,
  toggleLikeTweet,
  getAllLikeVideos,
};
