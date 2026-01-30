import { Router } from "express";
import {
    createBroadcast, deleteId,
    listMyBroadcast,
    markBroadcastRead,
    unreadCount,
} from "./broadcast.service";
import { addClient, emitToAll } from "./sseHub";
import router from "../../routes/authRoutes";
import authMiddleware from "../../middlewares/authMiddleware";
import {pool} from "../../config/database";
import jwt from "jsonwebtoken";
import requireAuthUser from "../../middlewares/requireAuthUser";



export const broadcastRouter = Router();


type AuthedReq = any;


function requireAuth(req: AuthedReq, res: any, next: any) {
    const auth = req.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "unauthorized" });
    }

    const token = auth.slice("Bearer ".length);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        req.user = payload;
        return next();
    } catch {
        return res.status(401).json({ error: "unauthorized" });
    }
}

export function requireAdminBroadcast(req: any, res: any, next: any) {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });

    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "forbidden" });
    }
    return next();
}

broadcastRouter.post("/admin/broadcast", requireAuthUser, requireAdminBroadcast, async (req: AuthedReq, res) => {
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

broadcastRouter.delete("/me/broadcast/:id", requireAuth, async (req: AuthedReq, res) => {

    const broadcastId = Number(req.params.id);
    if (!Number.isFinite(broadcastId)) return res.status(400).json({ error: "invalid id" });

    const broadcastDeleted = await deleteId(broadcastId);

    res.json(broadcastDeleted)

})

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

router.post(
    "/broadcast",
    authMiddleware,
    requireAdminBroadcast,
    async (req, res) => {
        console.log("broadcast")
        const { title, body } = req.body;
        const adminId = req.body.id;

        const [result]: any = await pool.execute(
            `
      INSERT INTO broadcast_messages (title, body, created_by_user_id)
      VALUES (?, ?, ?)
      `,
            [title, body, adminId]
        );

        const messageId = result.insertId;

        await pool.execute(`
      INSERT INTO user_broadcast_status (user_id, message_id)
      SELECT id, ?
      FROM users
    `, [messageId]);

        res.json({ success: true });
    }
);

