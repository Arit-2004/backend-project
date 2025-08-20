import { Router } from "express";
import {
    createTweet,
     getUserTweets, 
     updateTweet, 
     deleteTweet
} from "../controllers/tweet.controllers.js"

import { verifyJWT } from "../middilewares/auth.middileware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId")
.patch(updateTweet)
.delete(deleteTweet)


export default router;