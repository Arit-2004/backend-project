import asyncHandler from "../utils/asyncHandler.js";
import {User} from "../models/users.models.js"
import { ApiError } from "../utils/apiErrors.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";

const userRegister = asyncHandler(async (req, res) => {
   const {userName , email , fullname , password}=req.body 
   console.log("email :", email)

   if (!userName || !email || !fullname || !password) {
       return res.status(400).json({message:"All fields are required"}); 
}


const existedUser = User.findOne({
    $or : [{email} , {userNanme}]
})

if (existedUser) {
   throw new ApiError(409 , "User with username and email already exist");
}

const avatarPathLocal = req.files?.avatar[0]?.path;
const coverImagePathLocal = req.files?.coverImage[0].path;

if (!avatarPathLocal) {
    throw new ApiError (400 , "Avatar Image is required");
}

 const avatar = await uploadOnCloudinary(avatarPathLocal);
 const coverImage = await uploadOnCloudinary(coverImagePathLocal);

 // if incase avatar is not existed then multi check it , otherwise the database may altered ....

 if(!avatar){
    throw new ApiError (400 , "Avatar Image is required");
 }

 User.create({
    fullname,
    email,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    userName : userName.toLowerCase(),
    password

 })

 const createdUser = User.findById(User._id).select(
    "-password -refreshToken"
 )

 if(!createdUser){
    throw new ApiError(500 , "User is not created");
 }

 return res.status(201).json(
     new apiResponse(200 , createdUser , "user is created sucessfully")
 )

})
export default userRegister;