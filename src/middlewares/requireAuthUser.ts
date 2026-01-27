import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
    console.log(raw)

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

export function requireAuthMiddleware(req: any, res: any, next: any) {

    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ error: "unauthorized" });
    }

    const token = auth.slice("Bearer ".length);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = payload;

        return next();
    } catch (e: any) {
        console.log("JWT VERIFY FAIL:", e?.message);
        return res.status(401).json({ error: "unauthorized" });
    }
}

