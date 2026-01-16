import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import requireAuthUser from "../middlewares/requireAuthUser";
import FoodEntryController from "../controllers/foodEntryController";

const router = Router();

router.get("/", authMiddleware, requireAuthUser, FoodEntryController.listDay);
router.post("/", authMiddleware, requireAuthUser, FoodEntryController.create);
router.delete("/:id", authMiddleware, requireAuthUser, FoodEntryController.remove);

export default router;
