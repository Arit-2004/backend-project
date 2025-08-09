import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js";
import { ApiError } from "../utils/apiErrors.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js"; // Fixed capitalization
import jwt from "jsonwebtoken";

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
      $set : {
        refreshToken : undefined ,
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
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

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

    const { accessToken, newrefreshToken } = await generateAccessTokenAndRefreshToken(user?._id);

    const options = {
      httpOnly: true,
      secure: true
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newrefreshToken
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
  if (isPasswordCorrect) {
    throw new ApiError (400 , "Inavlid Password");
  }

  user.password = newPassword 
  user.save = ({validateBeforeSave : false})

  return res
  .status(200)
  .json(new ApiResponse(
    200 , {} , "User fetched Sucessfully"
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

const updateUserDetails = asyncHandler(async(req , res)=>{
  const {fullname , email} = req.body
  if(!fullname || !email){
    throw new ApiError(400 , "Both credentails required")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {$set : fullname,
      email : email
    },
    {new : true}
  ).select("-password")
  return res 
  .status(200)
  .json(
    new ApiResponse(
      200 ,
      user,
      "Account updated successfully"
    )
  )
})

const updateUserAvatar = asyncHandler(async(req ,res)=>{
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400 , "avatar local path missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400 , "avatar is missing")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {$set :{
      avatar : avatar.url
    }},
    {new : true}
  ).select("-password")
  
  return res
  .status(200)
  .json(
    new ApiResponse(
      200 , 
      user,
      "Avatar updated sucessfully"
    )
  )

})

const updateUserCoverImage = asyncHandler(async(req , res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400 , "cover image local path missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!coverImage.url){
    throw new ApiError(400 , "Cover image is missing");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {$set : {
    coverImage : coverImage.url
    }},
    {new : true}
  ).select("-password")

  return res 
  .status(200)
  .json(
    200 , 
    user,
    "Cover Image update sucessfully"
  )
})


export { 
   userRegister,
   loginUser , 
   logoutUser , 
   refreshAccessToken ,
   changeCurrentPassword , 
   getCurrentUser,
   updateUserDetails,
   updateUserAvatar,
   updateUserCoverImage
};
