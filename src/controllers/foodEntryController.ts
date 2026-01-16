import type { Request, Response } from "express";
import FoodEntryModel from "../models/foodEntryModel";

export default class FoodEntryController {
    static async listDay(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const day = String(req.query.day || "");
            if (!day) return res.status(400).json({ success: false, message: "Informe ?day=YYYY-MM-DD" });

            const entries = await FoodEntryModel.listByUserAndDay(userId, day);
            const totalCalories = entries.reduce((sum, e) => sum + (e.calories ?? 0), 0);

            return res.json({ success: true, day, totalCalories, entries });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Erro ao listar entradas", error: error?.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const { food_id, day, quantity_g } = req.body ?? {};

            if (!food_id || !day || !quantity_g) {
                return res.status(400).json({
                    success: false,
                    message: "Campos: food_id, day (YYYY-MM-DD), quantity_g",
                });
            }

            const entry = await FoodEntryModel.create({
                userId,
                foodId: Number(food_id),
                day: String(day),
                quantityG: Number(quantity_g),
            });

            return res.status(201).json({ success: true, entry });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Erro ao criar entrada", error: error?.message });
        }
    }

    static async remove(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const id = Number(req.params.id);
            if (!id || Number.isNaN(id)) return res.status(400).json({ success: false, message: "id inválido" });

            const ok = await FoodEntryModel.deleteOwned(userId, id);
            if (!ok) return res.status(404).json({ success: false, message: "Entrada não encontrada" });

            return res.json({ success: true, message: "Entrada removida" });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Erro ao remover entrada", error: error?.message });
        }
    }
}
