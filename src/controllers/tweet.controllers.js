import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import ApiResponse from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "content is required");
  }

  const tweet = await Tweet.create({
    owner: req.user._id,
    content,
  });

  return res.status(200).json(
    new ApiResponse(200, tweet, "Tweet created successfully ...")
  );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const tweets = await Tweet.find({ owner: userId })
    .populate("owner", "username email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, tweets, "User tweets retrieved successfully")
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { newTweet } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet Id is required");
  }

  if (!newTweet || newTweet.trim() === "") {
    throw new ApiError(400, "New Tweet is required");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "No tweet found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  tweet.content = newTweet;
  await tweet.save();

  return res.status(200).json(
    new ApiResponse(200, tweet, "Tweet updated successfully")
  );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete the tweet");
  }

  await Tweet.deleteOne({ _id: tweetId });

  return res.status(200).json(
    new ApiResponse(200, null, "Tweet deleted successfully")
  );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
