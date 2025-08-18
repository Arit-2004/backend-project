import { Router } from "express";
import{
    createPlaylist ,
    getUserPlaylists,
    getPlaylistsById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controllers.js"
import { verifyJWT } from "../middilewares/auth.middileware.js";

const router = Router();

router.use(verifyJWT); // Ensure all routes are protected

router.route("/").post(createPlaylist);

router.route("/:playlistId")
    .get(getPlaylistsById)
    .delete(deletePlaylist)
    .patch(updatePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);    
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router;