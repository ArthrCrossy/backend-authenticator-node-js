import { Router } from "express";
import requireAuthUser from "../../middlewares/requireAuthUser"; // ajuste path/nome
import {
    createSupportMessage,
    listAdminInbox,
    markSupportMessageRead,
} from "./support.service";

const router = Router();


router.post("/api/support/messages", requireAuthUser, async (req, res) => {
    try {console.log("oi")
        const auth = (req as any).user;

        if (auth?.role !== "user") {
            return res.status(403).json({ error: "Only users can send messages" });
        }

        const { title, body, receiverAdminId } = req.body ?? {};

        const result = await createSupportMessage({
            senderUserId: auth.id,
            receiverAdminId: receiverAdminId ?? null,
            title: title ?? null,
            body: String(body ?? ""),
        });

        return res.status(201).json(result);
    } catch (e: any) {
        return res.status(400).json({ error: e.message ?? "Error" });
    }
});

router.get("/api/admin/support/messages", requireAuthUser, async (req, res) => {
    try {
        const auth = (req as any).user;

        if (auth?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can view inbox" });
        }

        const onlyUnread = req.query.onlyUnread === "1" || req.query.onlyUnread === "true";

        const rows = await listAdminInbox({
            adminId: auth.id,
            onlyUnread,
            limit: Number(req.query.limit ?? 50),
            offset: Number(req.query.offset ?? 0),
        });

        return res.json(rows);
    } catch (e: any) {
        return res.status(400).json({ error: e.message ?? "Error" });
    }
});

router.patch("/api/admin/support/messages/:id/read", requireAuthUser, async (req, res) => {
    try {
        const auth = (req as any).user;

        if (auth?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can mark read" });
        }

        const messageId = Number(req.params.id);
        const result = await markSupportMessageRead({ messageId });

        return res.json(result);
    } catch (e: any) {
        return res.status(400).json({ error: e.message ?? "Error" });
    }
});

export default router;
