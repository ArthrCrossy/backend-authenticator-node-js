import { Router } from "express";
import {
    createBroadcast,
    listMyBroadcast,
    markBroadcastRead,
    unreadCount,
} from "./broadcast.service";
import { addClient, emitToAll } from "./sseHub";



export const broadcastRouter = Router();


type AuthedReq = any;

function requireAuth(req: AuthedReq, res: any, next: any) {
    if (!req.user?.id) return res.status(401).json({ error: "unauthorized" });
    next();
}

function requireAdmin(req: AuthedReq, res: any, next: any) {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "forbidden" });
    next();
}

broadcastRouter.post("/admin/broadcast", requireAuth, requireAdmin, async (req: AuthedReq, res) => {
    const { title, body } = req.body ?? {};
    if (!title || !body) return res.status(400).json({ error: "title and body are required" });

    const { messageId } = await createBroadcast({
        title: String(title),
        body: String(body),
        createdByUserId: req.user.id,
    });

    res.status(201).json({ id: messageId });
});

broadcastRouter.get("/me/broadcast", requireAuth, async (req: AuthedReq, res) => {
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const items = await listMyBroadcast(req.user.id, limit, offset);
    res.json({ items, limit, offset });
});

broadcastRouter.get("/me/broadcast/unread-count", requireAuth, async (req: AuthedReq, res) => {
    const count = await unreadCount(req.user.id);
    res.json({ count });
});

broadcastRouter.post("/me/broadcast/:id/read", requireAuth, async (req: AuthedReq, res) => {
    const messageId = Number(req.params.id);
    if (!Number.isFinite(messageId)) return res.status(400).json({ error: "invalid id" });

    const ok = await markBroadcastRead(req.user.id, messageId);
    res.json({ ok });
});

broadcastRouter.get("/me/broadcast/stream", requireAuth, (req: AuthedReq, res) => {
    addClient(req.user.id, res);
});
