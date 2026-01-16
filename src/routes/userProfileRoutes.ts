import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import requireAuthUser from "../middlewares/requireAuthUser";
import UserProfileController from "../controllers/userProfileController";

const router = Router();

router.get("/me", authMiddleware, requireAuthUser, UserProfileController.getMyProfile);
router.put("/me", authMiddleware, requireAuthUser, UserProfileController.upsertMyProfile);

router.get("/targets/day", authMiddleware, requireAuthUser, UserProfileController.getMyTargetForDay);
router.get("/targets/range", authMiddleware, requireAuthUser, UserProfileController.listMyTargets);

export default router;
