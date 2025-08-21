import { Router } from "express";
import {
    getChannelStats,
    getAllTheVideosUploadedByChannel
} from "../controllers/dashboard.controllers.js"

import { verifyJWT } from "../middilewares/auth.middileware.js";

const router = Router();

router.use(verifyJWT);

router.route("/stats/c/:channelId").get(getChannelStats);
router.route("/videos/v/:channelId").get(getAllTheVideosUploadedByChannel);


export default router;