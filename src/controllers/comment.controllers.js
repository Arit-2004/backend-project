import mongoose ,{isValidObjectId} from "mongoose";
import { Comment } from "../models/comment.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import ApiResponse from "../utils/apiResponse.js";

const addComment = asyncHandler(async(req , res)=>{
    const { videoId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video Id");
    }

    if(!content || content.trim()=== ""){
        throw new ApiError(400 , "content is required");
    }

    const comment = await Comment.create({
        owner : req.user._id,
        video : videoId,
        content
    })

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment added successfully"
        )
    )
})

const updateComment = asyncHandler(async(req , res) => {
    const { commentId} = req.params;
    const { newComment } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    if(!newComment || newComment.trim() === ""){
        throw new ApiError(400 , "New comment content is required");
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404 , "Comment not found");
    }

    if (Comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    comment.content = newComment || comment.content;;
    await comment.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            comment,
            "Comment updated successfully"
        )
    )

})

const deleteComment = asyncHandler(async(req , res)=>{
    const { commentId} = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "Invalid comment Id");
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404 , "Comment not found");
    }

    if(comment.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403 , "You are not authorized to delete this comment");
    }

    await Comment.deleteOne({
        _id: commentId
    })

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Comment deleted successfully"
        )
    )
})

const getVideoComments = asyncHandler(async(req , res)=>{
    const { videoId} = req.params;
    const { page = 1 , limit = 10} = req.query;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video Id");
    }

    const comments = await Comment.find({ video : videoId})
        .populate("owner" , "username avatar")
        .sort({ createdAt: -1})
        .skip((page - 1)*limit)
        .limit(Number(limit));

    const totalComments = await Comment.countDocuments({ video: videoId});
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                comments,
                currentPage : Number(page),
                totalPages : Math.ceil(totalComments / limit),
                totalComments
            },
            "Comments retrieved successfully"
        )
    )

})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}