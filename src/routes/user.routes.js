import { Router } from "express";
import  {userRegister, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword,
    getCurrentUser, 
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory } from "../controllers/user.controllers.js";
import { upload } from "../middilewares/multer.middileware.js";
import { verifyJWT } from "../middilewares/auth.middileware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
           name: "avatar",
           maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    userRegister)

router.route("/login").post(loginUser)

// secured routes

router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT , changeCurrentPassword)
router.route("/current-user").get(verifyJWT , getCurrentUser)
router.route("/update-account").patch(verifyJWT , updateUserDetails)
router.route("/avatar").patch(verifyJWT , upload.single("avatar") , updateUserAvatar)
router.route("/coverImage").patch(verifyJWT , upload.single("coverImage") , updateUserCoverImage)
router.route("/c/:username").get(verifyJWT , getUserChannelProfile)
router.route("/history").get(verifyJWT , getWatchHistory)


export default router;