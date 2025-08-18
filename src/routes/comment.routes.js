import { Router } from "express";
import {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
} from "../controllers/comment.controllers.js"

import {verifyJWT} from "../middilewares/auth.middileware.js"

const router = Router();

router.use(verifyJWT);

router.route("/:videoId")
.get(getVideoComments)
.post(addComment)

router.route("/c/:commentId")
.patch(updateComment)
.delete(deleteComment)

export default router ;