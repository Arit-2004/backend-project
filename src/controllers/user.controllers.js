import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js";
import { ApiError } from "../utils/apiErrors.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import { use } from "react";

const generateAccessTokenAndRefreshToken = async (userId) =>{
  try {
    const user = await User.findById(userId);
    const accessToken = user.createAccessToken;
    const refreshToken = user.createRefreshToken;
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave : false})
    return {
      accessToken,
      refreshToken
    }
  } catch (error) {
    throw new ApiError (500 , "something went wrong while creating the access token and refresh token");
  }
}

const userRegister = asyncHandler(async (req, res) => {
  const { userName, email, fullname, password } = req.body;
  // console.log("email:", email);

  // 1. Check for all required fields
  if (!userName || !email || !fullname || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // 2. Check for existing user by username or email
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  // 3. Check if avatar image is provided
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

  // 4. Upload images to Cloudinary
  const avatar = await uploadOnCloudinary(avatarPathLocal);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar");
  }

  // 5. Create user
  const newUser = await User.create({
    fullname,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    userName: userName.toLowerCase(),
    password,
  });

  // 6. Retrieve the created user properly
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User is not created");
  }

  // 7. Return response
  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User created successfully"));
});
 
const loginUser = asyncHandler(async(req , res)=>{
  const {email , userName , password}=req.body;

  if(!email && !userName){
    throw new ApiError(400 , "Username and email is required");
    
  }
  
 const user = await User.findOne(
  {
    $or : [{ userName },{ email }]
  }
 )

 if (!user) {
   throw new ApiError(404 , "User not found");
 }

 const isPasswordValid = await user.isPasswordCorrect(password);

 if (!isPasswordValid) {
    throw new ApiError(401 , "invalid user credentials");
}

const {accessToken , refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
const loggedInUser = await User.findById(user._id);
const options ={
  httpOnly : true ,
  secure : true
}

return res
.status(200)
.cookie("accessToken" , accessToken , options)
.cookie("refreshToken", refreshToken , options)
.json(
  new apiResponse(
    200,
    {
      user : loggedInUser , accessToken , refreshToken
    },
    "loggedin user sucessfully"
  )
)

})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  )
   
  const options ={
  httpOnly : true ,
  secure : true
}

return res
.status(200)
.cookie("accessToken" , options)
.cookie("refreshToken", options)
.json(new apiResponse(200 , {} , "User logged out succesfully"))

});

export {
  userRegister,
  loginUser,
  logoutUser
}
