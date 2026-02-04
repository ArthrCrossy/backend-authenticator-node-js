import { Router } from "express";
import {
    likeBroadcastController,
    unlikeBroadcastController,
    listBroadcastLikesController,
    myBroadcastLikeStatusController,
} from "../controllers/broadcastLikesController";
import requireAuthUser from "../middlewares/requireAuthUser";

const router = Router();

router.get("/broadcast/:id/likes", listBroadcastLikesController);

router.get("/broadcast/:id/likes/me", requireAuthUser, myBroadcastLikeStatusController);

router.post("/broadcast/:id/like", requireAuthUser, likeBroadcastController);
router.delete("/broadcast/:id/like", requireAuthUser, unlikeBroadcastController);

export default router;
