import mongoose , {isValidObjectId} from "mongoose";
import asyncHandler from "../utils/asyncHandler.js"
import { Video } from "../models/videos.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/likes.models.js";
import { ApiError } from "../utils/apiErrors.js";
import ApiResponse from "../utils/apiResponse.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel id");
    }

    const stats = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $facet: {
                videoStats: [
                    {
                        $group: {
                            _id: null,
                            totalVideos: { $sum: 1 },
                            totalViews: { $sum: "$views" }
                        }
                    }
                ],
                likeStats: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes"
                        }
                    },
                    {
                        $unwind: {
                            path: "$likes",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalLikes: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ]);

    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    const videoStats = stats[0]?.videoStats[0] || { totalVideos: 0, totalViews: 0 };
    const likeStats = stats[0]?.likeStats[0] || { totalLikes: 0 };

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos: videoStats.totalVideos,
                totalViews: videoStats.totalViews,
                totalLikes: likeStats.totalLikes,
                totalSubscribers
            },
            "Channel stats fetched successfully"
        )
    );
});

const getAllTheVideosUploadedByChannel = asyncHandler(async(req , res)=>{
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400 , "inavlid channel id");
    }

    const videos = await Video.aggregate([
        {
            $match : {owner : new mongoose.Types.ObjectId(channelId)}
        },
        {
            $sort : {createdAt : -1}
        },
        {
            $project : {
                title : 1,
                description : 1,
                thumbnail : 1,
                views : 1,
                createdAt : 1
            }
        }
    ])

    if(!videos || videos.length === 0){
        throw new ApiError(400 , "No videos found from this channel");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200 ,
            videos,
            "Channel videos fetched succesfully"
        )
    )

})


export {
    getChannelStats,
    getAllTheVideosUploadedByChannel
}



