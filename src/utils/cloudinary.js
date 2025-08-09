import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});  

// Upload file to Cloudinary
const uploadOnCloudinary = async (localFile) => {
  try {
    if (!localFile) return null;

    const response = await cloudinary.uploader.upload(localFile, {
      resource_type: "auto"
    });

    fs.unlinkSync(localFile); // delete temp file
    return {
      url: response.secure_url,
      public_id: response.public_id
    };
  } catch (error) {
    if (fs.existsSync(localFile)) fs.unlinkSync(localFile);
    console.error("File upload failed:", error);
    return null;
  }
};

// Delete file from Cloudinary by public_id
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
