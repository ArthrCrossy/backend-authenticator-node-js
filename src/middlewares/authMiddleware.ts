import jwt, { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import "dotenv/config";

type AuthTokenPayload = JwtPayload & {
    id?: number | string;
    userId?: number | string;
    email?: string;
};

declare global {
    namespace Express {
        interface Request {
            userId?: number | string;
            userEmail?: string;
        }
    }
}

export default function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token não fornecido",
            });
        }

        const parts = authHeader.split(" ");
        if (parts.length !== 2) {
            return res.status(401).json({
                success: false,
                message: "Erro no formato do token",
            });
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({
                success: false,
                message: "Token mal formatado",
            });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                success: false,
                message: "JWT_SECRET não configurado no .env",
            });
        }

        const decoded = jwt.verify(token, secret) as AuthTokenPayload;

        req.userId = decoded.userId ?? decoded.id;
        req.userEmail = decoded.email;

        return next();
    } catch (error: any) {
        return res.status(401).json({
            success: false,
            message: "Token inválido ou expirado",
            error: error?.message,
        });
    }
}
