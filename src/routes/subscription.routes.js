import { Router } from "express";
import { verifyJWT } from "../middilewares/auth.middileware.js";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controllers.js";

const router = Router();
router.use(verifyJWT);

// Subscribe/unsubscribe to a channel
router.post("/c/:channelId", toggleSubscription);

// Get all subscribers of a channel
router.get("/c/:channelId/subscribers", getUserChannelSubscribers);

// Get all channels that a user is subscribed to
router.get("/u/:subscriberId/subscriptions", getSubscribedChannels);

export default router;
