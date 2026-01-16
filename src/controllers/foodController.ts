import type { Request, Response } from "express";
import FoodModel from "../models/foodModel";

export default class FoodController {
    static async list(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const foods = await FoodModel.listForUser(userId);
            return res.json({ success: true, foods });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Erro ao listar foods", error: error?.message });
        }
    }

    static async search(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const q = String(req.query.q || "");
            if (!q) return res.status(400).json({ success: false, message: "Informe ?q=" });

            const foods = await FoodModel.searchForUser(userId, q);
            return res.json({ success: true, foods });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Erro ao buscar foods", error: error?.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const { name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g } = req.body ?? {};

            if (!name || calories_per_100g === undefined) {
                return res.status(400).json({ success: false, message: "Campos: name, calories_per_100g" });
            }

            const food = await FoodModel.create({
                userId,
                name,
                calories_per_100g: Number(calories_per_100g),
                protein_per_100g: protein_per_100g ?? null,
                carbs_per_100g: carbs_per_100g ?? null,
                fat_per_100g: fat_per_100g ?? null,
            });

            return res.status(201).json({ success: true, food });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Erro ao criar food", error: error?.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const id = Number(req.params.id);
            if (!id || Number.isNaN(id)) return res.status(400).json({ success: false, message: "id inválido" });

            const updated = await FoodModel.updateOwned({ userId, id, ...req.body });
            if (!updated) {
                return res.status(404).json({ success: false, message: "Food não encontrado ou você não é dono" });
            }

            return res.json({ success: true, food: updated });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Erro ao atualizar food", error: error?.message });
        }
    }

    static async remove(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const id = Number(req.params.id);
            if (!id || Number.isNaN(id)) return res.status(400).json({ success: false, message: "id inválido" });

            const ok = await FoodModel.deleteOwned(userId, id);
            if (!ok) return res.status(404).json({ success: false, message: "Food não encontrado ou você não é dono" });

            return res.json({ success: true, message: "Food removido" });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Erro ao remover food", error: error?.message });
        }
    }
}
