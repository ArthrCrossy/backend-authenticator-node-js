import type {NextFunction, Request, RequestHandler, Response} from "express";

export function requireRole(role: "admin" | "user"): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }

        if (user.role !== role) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        next();
    };
}