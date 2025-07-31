import { v2 as cloudinary} from "cloudinary";
import fs from "fs";

  // Configuration
    cloudinary.config({ 
        cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });  

const uploadOnCloudinary = async (localFile) =>{
     try {
        if (!localFile) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localFile,{
            resource_type: "auto"
        })
        //console.log("file uploaded sucessfully" , response);
        fs.unlinkSync(localFile)
        return response;
     } catch (error) {
        fs.unlinkSync(localFile); // delete the file if upload fails
        console.log("file upload failed" , error)
        return null;
     }
}    

export default  uploadOnCloudinary;