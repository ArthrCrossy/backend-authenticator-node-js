import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            authUserId?: number;
        }
    }
}

export type AuthUser = {
    id: number;
    email: string;
    role: "user" | "admin";
};

export default function requireAuthUser(
    req: Request,
    res: Response,
    next: NextFunction
) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token não enviado" });
    }

    const token = authHeader.slice("Bearer ".length);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

        (req as any).user = decoded as AuthUser;

        return next();
    } catch (e: any) {
        console.log("[AUTH] JWT VERIFICAÇÃO FALHA:", e?.message);
        return res.status(401).json({ error: "Token inválido" });
    }
}

     function requireAuthMiddleware(req: any, res: any, next: any) {

        const auth = req.headers.authorization;

        if (!auth || !auth.startsWith("Bearer ")) {
            return res.status(401).json({error: "unauthorized"});
        }

        const token = auth.slice("Bearer ".length);

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET as string);
            req.user = payload;

            return next();
        } catch (e: any) {
            console.log("JWT VERIFY FAIL:", e?.message);
            return res.status(401).json({error: "unauthorized"});
        }
    }



