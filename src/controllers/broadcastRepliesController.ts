import { Request, Response } from "express";
import { createBroadcastReply, listBroadcastReplies } from "../service/broadcastRepliesService";

export async function createBroadcastReplyController(req: Request, res: Response) {
    try {
        const messageId = Number(req.params.id);
        const userId = Number((req as any).user?.id);
        const body = String(req.body?.body ?? "").trim();

        if (!Number.isFinite(messageId) || messageId <= 0) {
            return res.status(400).json({ error: "Invalid message id" });
        }
        if (!userId || userId <= 0) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        if (!body) {
            return res.status(400).json({ error: "Body is required" });
        }
        if (body.length > 5000) {
            return res.status(400).json({ error: "Body too long" });
        }

        const replyId = await createBroadcastReply({ messageId, repliedByUserId: userId, body });
        return res.status(201).json({ success: true, id: replyId });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal error" });
    }
}

export async function listBroadcastRepliesController(req: Request, res: Response) {
    try {
        const messageId = Number(req.params.id);
        const limit = Math.min(Number(req.query.limit ?? 50), 200);
        const offset = Math.max(Number(req.query.offset ?? 0), 0);

        if (!Number.isFinite(messageId) || messageId <= 0) {
            return res.status(400).json({ error: "Invalid message id" });
        }

        const items = await listBroadcastReplies({ messageId, limit, offset });
        return res.json({ success: true, items, limit, offset });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal error" });
    }
}
