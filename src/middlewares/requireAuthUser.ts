import type { Request, Response, NextFunction } from "express";

declare global {
    namespace Express {
        interface Request {
            authUserId?: number;
        }
    }
}

export default function requireAuthUser(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const raw = req.userId;

    if (raw === undefined || raw === null) {
        return res.status(401).json({ success: false, message: "Não autenticado" });
    }

    const userId = typeof raw === "string" ? Number(raw) : raw;
    if (!userId || Number.isNaN(userId)) {
        return res.status(401).json({ success: false, message: "Token inválido (userId)" });
    }

    req.authUserId = userId;
    return next();
}
