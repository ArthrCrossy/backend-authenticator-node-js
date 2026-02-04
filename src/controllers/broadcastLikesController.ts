import { Request, Response } from "express";
import {
    likeBroadcast,
    unlikeBroadcast,
    listLikes,
    countLikes,
    hasUserLiked,
} from "../models/broadcastLikesModel";

function toPosInt(value: any) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export async function likeBroadcastController(req: Request, res: Response) {
    try {
        const messageId = toPosInt(req.params.id);
        const userId = toPosInt((req as any).user?.id);

        if (!messageId) return res.status(400).json({ error: "Invalid message id" });
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        const { inserted } = await likeBroadcast(messageId, userId);
        const likes = await countLikes(messageId);

        return res.status(200).json({
            success: true,
            liked: true,
            inserted,
            likes,
        });
    } catch (e: any) {
        return res.status(500).json({ error: "Internal error", detail: String(e?.message ?? e) });
    }
}

export async function unlikeBroadcastController(req: Request, res: Response) {
    try {
        const messageId = toPosInt(req.params.id);
        const userId = toPosInt((req as any).user?.id);

        if (!messageId) return res.status(400).json({ error: "Invalid message id" });
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        const { deleted } = await unlikeBroadcast(messageId, userId);
        const likes = await countLikes(messageId);

        return res.status(200).json({
            success: true,
            liked: false,
            deleted,
            likes,
        });
    } catch (e: any) {
        return res.status(500).json({ error: "Internal error", detail: String(e?.message ?? e) });
    }
}

export async function listBroadcastLikesController(req: Request, res: Response) {
    try {
        const messageId = toPosInt(req.params.id);
        if (!messageId) return res.status(400).json({ error: "Invalid message id" });

        const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
        const offset = Math.max(Number(req.query.offset ?? 0), 0);

        const [likes, total] = await Promise.all([
            listLikes(messageId, limit, offset),
            countLikes(messageId),
        ]);

        return res.status(200).json({
            success: true,
            total,
            items: likes,
            limit,
            offset,
        });
    } catch (e: any) {
        return res.status(500).json({ error: "Internal error", detail: String(e?.message ?? e) });
    }
}

export async function myBroadcastLikeStatusController(req: Request, res: Response) {
    try {
        const messageId = toPosInt(req.params.id);
        const userId = toPosInt((req as any).user?.id);

        if (!messageId) return res.status(400).json({ error: "Invalid message id" });
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        const [liked, likes] = await Promise.all([
            hasUserLiked(messageId, userId),
            countLikes(messageId),
        ]);

        return res.status(200).json({ success: true, liked, likes });
    } catch (e: any) {
        return res.status(500).json({ error: "Internal error", detail: String(e?.message ?? e) });
    }
}
