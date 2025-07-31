import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js";
import { ApiError } from "../utils/apiErrors.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";

const userRegister = asyncHandler(async (req, res) => {
  const { userName, email, fullname, password } = req.body;
  console.log("email:", email);

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

export default userRegister;
