import mongoose , {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/apiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { Subscription } from "../models/subscription.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (req.user._id.toString() === channelId.toString()) {
        throw new ApiError(401, "You cannot subscribe to yourself");
    }

    // Check if already subscribed
    const existingSubscriber = await Subscription.findOne({
        subscriber: req.user._id,   
        channel: channelId
    });

    if (existingSubscriber) {
        // Unsubscribe
        await Subscription.findOneAndDelete({
            subscriber: req.user._id,
            channel: channelId
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Unsubscribed successfully"
            )
        );
    }

    // Subscribe
    const newSubscription = await Subscription.create({
        subscriber: req.user._id,  // 👈 make sure consistent with schema
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            newSubscription,
            "Channel subscribed successfully"
        )
    );
});


const getUserChannelSubscribers = asyncHandler(async(req , res)=>{
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400 , "Subscribed Channel first");
    }

    const subscription = await Subscription.find({
        channel : channelId
    })
    .populate("subscriber" , "userName  email  fullname  avatar")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200 ,
            subscription,
            "All subscribers fetched sucessfully"
        )
    )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscribeChannels = await Subscription.find({
        subscriber: subscriberId
    }).populate("channel", "userName email fullname avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribeChannels,
            "Subscribed channels fetched successfully"
        )
    );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}