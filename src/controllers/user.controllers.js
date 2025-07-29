import asyncHandler from "../utils/asyncHandler.js";

const userRegister = asyncHandler(async (req, res) => {
   const {userName , email , fullname , password}=req.body 
   console.log("email :", email)

   if (!userName || !email || !fullname || !password) {
       return res.status(400).json({message:"All fields are required"}); 
}
})
export default userRegister;