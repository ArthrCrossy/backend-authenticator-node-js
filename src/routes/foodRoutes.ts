import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import requireAuthUser from "../middlewares/requireAuthUser";
import FoodController from "../controllers/foodController";

const router = Router();

router.get("/", authMiddleware, requireAuthUser, FoodController.list);
router.get("/search", authMiddleware, requireAuthUser, FoodController.search);

router.post("/", authMiddleware, requireAuthUser, FoodController.create);
router.put("/:id", authMiddleware, requireAuthUser, FoodController.update);
router.delete("/:id", authMiddleware, requireAuthUser, FoodController.remove);

export default router;
