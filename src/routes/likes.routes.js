import { Router } from "express";
import {
    toggleLikeVideos,
    toggleLikeComment,
    toggleLikeTweet,
    getAllLikeVideos
} from "../controllers/likes.controllers.js"
import {verifyJWT} from "../middilewares/auth.middileware.js"

const router = Router();

router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleLikeVideos);
router.route("/toggle/c/commentId").post(toggleLikeComment);
router.route("/toggle/t/tweetId").post(toggleLikeTweet);
router.route("/videos").get(getAllLikeVideos);