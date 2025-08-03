import { Router } from "express";
import userRegister, { loginUser, logoutUser } from "../controllers/user.controllers.js";
import { upload } from "../middilewares/multer.middileware.js";
import verifyJWT from "../middilewares/auth.middileware.js";

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

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT , logoutUser)    

export default router;