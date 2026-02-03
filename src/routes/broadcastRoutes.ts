import { Router } from "express";
import requireAuthUser from "../middlewares/requireAuthUser";
import {requireRole} from "../middlewares/requireRole";
import {
    createBroadcastReplyController,
    listBroadcastRepliesController,
} from "../controllers/broadcastRepliesController";

const router = Router();

router.get("/:id/replies", requireAuthUser, listBroadcastRepliesController);

router.post(
    "/:id/replies",
    requireAuthUser,
    requireRole("user"),
    createBroadcastReplyController
);



export default router;
