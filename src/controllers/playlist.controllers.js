import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import ApiResponse from "../utils/apiResponse.js";
import { Playlist } from "../models/playlist.models.js"; 

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    if (!isValidObjectId(req.user._id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId });

    return res.status(200).json(
        new ApiResponse(
            200,
            playlists,
            "User playlists retrieved successfully"
        )
    );
});

const getPlaylistsById = asyncHandler(async (req , res)=> {
     const {playlistId , userId} = req.params;

     if (!isValidObjectId(playlistId) || !isValidObjectId(userId)) {
        throw new ApiError(400 , "Invalid playlist ID and User Id")
     }

     const playlist = await Playlist.findOne({
        _id : playlistId,
        owner : userId
     })

     if (!playlist){
        throw new ApiError(404 , "Playlist not found")
     } 
        

     return res.status(200)
     .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist retrieved successfully by ID"

        )
     )

    
     
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist ID or video ID");
    }

    // Find playlist and check ownership
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    // Prevent duplicates (safe check for ObjectId arrays)
    if (playlist.videos.some(v => v.toString() === videoId)) {
        throw new ApiError(400, "Video already exists in playlist");
    }

    // Add video and save
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Video added to playlist successfully"
        )
    );
});

const removeVideoFromPlaylist = asyncHandler(async(req , res) => {
    const { playlistId , videoId} = req.params;

    //validate IDs

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid playlist ID or video ID");
    }

    // check if playlist exists
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404 , "Playlist not found");
    }
    
    //check ownership
    if( playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403 , "You are not authorized to modify this playlist");
    }

    //check if video exists in playlist
    const video = playlist.videos.find(v => v.toString() === videoId);
    if(!video){
        throw new ApiError(404 , "Video not found in playlist");
    }

    // remove video 

   await Playlist.videos.pull(videoId);
    await playlist.save();

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video removed from playlist successfully"
        )
    )
})

const deletePlaylist = asyncHandler(async(req ,  res)=>{
    const {playlistId} = req.params;

    // validate playlist ID

    if (isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }

    // check if playlist exists

    const playlist = await Playlist.findById(playlistId);
    if (!playlist){
        throw new ApiError(404 , "playlist not found");
    }

    // chech ownership
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403 , "You are not authorized to delete this playlist");
    }

    // delete playlist

    await Playlist.findByIdAndDelete(playlistId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req , res) => {
    const {playlistId} = req.params;
    const { name , description} = req.body;

    // validate request body

    if (!name || !description){
        throw new ApiError(400, "Name and description are required")
    }

    // validate playlist ID

    if (!isValidObjectId(playlistId)){
        throw new ApiError(400 , "Invalid playlist ID")
    }

    // check if playlist exists

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404 , "Playlist not found");
    }

    // check ownership

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this playlist");
    }

    // update playlist

    if(name) playlist.name = name;
    if(description) playlist.description = description
    await playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlist,
            "Playlist updated successfully"
        )
    )
})


export { createPlaylist ,
    getUserPlaylists,
    getPlaylistsById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
 };
