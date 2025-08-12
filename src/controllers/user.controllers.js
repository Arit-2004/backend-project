import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js";
import { ApiError } from "../utils/apiErrors.js";
import {uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js"; // Fixed capitalization
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.createAccessToken(); // ✅ CALL the function
    const refreshToken = user.createRefreshToken(); // ✅ CALL the function
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while creating the access token and refresh token"
    );
  }
};


const userRegister = asyncHandler(async (req, res) => {
  const { userName, email, fullname, password } = req.body;

  if (!userName || !email || !fullname || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  const avatarPathLocal = req.files?.avatar?.[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarPathLocal) {
    throw new ApiError(400, "Avatar Image is required");
  }

  const avatar = await uploadOnCloudinary(avatarPathLocal);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar");
  }

  const newUser = await User.create({
    fullname,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    userName: userName.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User is not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async(req , res)=>{
  await User.findByIdAndUpdate(
    req.user._id,{
      $unset : {
        refreshToken : 1, // better than setting it to null and undefined it removes the field from the database
      }
    },{
      new : true
    }
  )
 const options = {
    httpOnly: true,
    secure: true,
  };

return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged out successfully"));

})

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Invalid incoming refresh Token");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or invalid");
    }

    // Corrected variable name: destructure as refreshToken
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user?._id);

    const options = {
      httpOnly: true,
      secure: true
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});


const changeCurrentPassword = asyncHandler(async(req , res)=>{
  const {oldPassword , newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError (400 , "Inavlid Password");
  }

  user.password = newPassword 
  await user.save ({validateBeforeSave : false})

  return res
  .status(200)
  .json(new ApiResponse(
    200 , {} , "Password Change Sucessfully"
  ))

})

const getCurrentUser = asyncHandler(async(req , res) => {
  return res 
  .status(200)
  .json(new ApiResponse(
    200 , 
    req.user,
    "Current user get SuccesFully"
  ))
})

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  // 1. Check if both fields are present
  if (!fullname || !email) {
    throw new ApiError(400, "Full name and email are required");
  }

  // 2. Check if email already exists for another user
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "Email already in use by another account");
  }

  // 3. Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fullname, email } },
    { new: true, runValidators: true } // runValidators ensures schema rules are applied
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  // 4. Send response
  return res.status(200).json(
    new ApiResponse(
      200,
      updatedUser,
      "Account updated successfully"
    )
  );
});




const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar local path missing");
  }

  // Get existing user to know the old image public_id
  const existingUser = await User.findById(req.user?._id);

  // Upload new avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // Delete old avatar from Cloudinary
  if (existingUser?.avatarPublicId) {
    await deleteFromCloudinary(existingUser.avatarPublicId);
  }

  // Save new avatar info
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url, avatarPublicId: avatar.public_id } },
    { new: true }
  ).select("-password");

  res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image local path missing");
  }

  // Find the existing user to get old cover image public_id
  const existingUser = await User.findById(req.user?._id);

  // Upload the new cover image
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiError(400, "Cover image upload failed");
  }

  // Delete old cover image from Cloudinary if it exists
  if (existingUser?.coverImagePublicId) {
    await deleteFromCloudinary(existingUser.coverImagePublicId);
  }

  // Update user with new cover image info
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
        coverImagePublicId: coverImage.public_id
      }
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(200, user, "Cover image updated successfully")
  );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: { $regex: `^${username}$`, $options: "i" } // case-insensitive
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriber"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscriber" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscriber.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res.status(200).json(
    new ApiResponse(200, channel[0], "User account fetched successfully")
  );
});



const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      user[0]?.watchHistory || [],
      "Watch history fetched successfully"
    )
  );
});



export { 
   userRegister,
   loginUser , 
   logoutUser , 
   refreshAccessToken ,
   changeCurrentPassword , 
   getCurrentUser,
   updateUserDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory 
};
