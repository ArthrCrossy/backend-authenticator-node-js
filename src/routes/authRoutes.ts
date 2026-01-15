import { Router, Request, Response } from "express";
import AuthController from "../controllers/authController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/newPassword", AuthController.getEmail);

router.get("/profile", authMiddleware, AuthController.getProfile);
router.get("/users", authMiddleware, AuthController.getAllUsers);

router.get("/test", (_req: Request, res: Response) =>
    res.json({ message: "teste!" })
);

router.get("/names", AuthController.getAllNames);

export default router;
