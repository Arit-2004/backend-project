import { Like } from "../models/likes.models.js";
import mongoose,{isValidObjectId} from "mongoose";
import asyncHandler from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/apiResponse.js"
import { ApiError } from "../utils/apiErrors.js";

const toggleLikeVideos = asyncHandler(async(req , res)=>{
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Video does not exist");
    }

    const existingLike = await Like.findOne(videoId)

    if(!existingLike){
        await existingLike.deleteOne(videoId);
        return res
        .status(200)
        .json(
            new ApiResponse(
                200 , 
                {video : videoId,
                 owner : req.user._id
                },
                "Like removed successfully"
            )
        )
    }
const like =  await Like.create(
        {
            video : videoId ,
            owner : req.user._id
        }
    )

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200 ,
            like,
            "Like Added Successfully"
        )
    )
})

const toggleLikeComment = asyncHandler(async(req , res)=>{
    const {commentId} = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "comment does not exist");
    }

    const existingLike = await Like.findOne(commentId);
    if(!existingLike){
       await Like.deleteOne(commentId)
       return res 
       .status(200)
       .json(
        new ApiResponse(
            200, 
            {
                comment : commentId,
                owner : req.user._id
            },
            "Like removed successfully from the comment"
        )
       )
    }
  const like =  await Like.create({
        comment : commentId ,
        owner : req.user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200 , 
            like,
            "Like Added to comment succesfully"
        )
    )
})

const toggleLikeTweet = asyncHandler(async(req , res)=>{
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400 , "Tweet cannot found");
    }

    const existingLike = await Like.findOne(tweetId);
    if(!existingLike){
        await Like.deleteOne(tweetId);
        return res
        .status(200)
        .json(
            200, 
            {
                tweet : tweetId,
                owner : req.user._id
            },
            "Like removed from tweet succesfully"

        )
    }

   const like =  await Like.create({
        tweet : tweetId,
        owner : req.user._id
    })

    return res
    .status(200)
    .json(
        200,
        like,
        "Like added to tweet sucessfully"
    ) 
})

const getAllLikeVideos = asyncHandler(async(req , res)=>{
    const likes = await Like.find(
        {
        owner : req.user._id,
        video : {$ne : null}
        }
    ).populate("video")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likes,
            "All liked videos fetched succesfully"
        )
    )
})

export {
    toggleLikeVideos,
    toggleLikeComment,
    toggleLikeTweet,
    getAllLikeVideos
}