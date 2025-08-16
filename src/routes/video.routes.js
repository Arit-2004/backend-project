import { Router } from "express";
import {
    getAllVideos,
    getVideoById,
    publishAVideo,
    updateVideo,
    deleteVideo,
    toggleVideoPublishStatus
} from "../controllers/video.controllers.js";
import { verifyJWT } from "../middilewares/auth.middileware.js";
import { upload } from "../middilewares/multer.middileware.js";

const router = Router();

router.use(verifyJWT);

// Fetch all videos
router.get("/", getAllVideos);

// Publish a video
router.post(
    "/",
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

// Toggle publish status (placed before /:videoId to avoid conflict)
router.patch("/toggle/publish/:videoId", toggleVideoPublishStatus);

// Single video routes
router.route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

export default router;
