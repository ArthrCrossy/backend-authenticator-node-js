import { pool } from "../config/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type FoodEntryRow = RowDataPacket & {
    id: number;
    user_id: number;
    food_id: number;
    day: string; // YYYY-MM-DD
    quantity_g: number;
    calories: number;
    created_at: Date;
};

export type FoodEntryWithFoodRow = FoodEntryRow & {
    food_name: string;
    calories_per_100g: number;
    protein_per_100g: number | null;
    carbs_per_100g: number | null;
    fat_per_100g: number | null;
};

export default class FoodEntryModel {
    static async listByUserAndDay(userId: number, day: string): Promise<FoodEntryWithFoodRow[]> {
        const query = `
      SELECT
        fe.*,
        f.name AS food_name,
        f.calories_per_100g,
        f.protein_per_100g,
        f.carbs_per_100g,
        f.fat_per_100g
      FROM food_entries fe
      JOIN foods f ON f.id = fe.food_id
      WHERE fe.user_id = ? AND fe.day = ?
      ORDER BY fe.created_at DESC
    `;
        const [rows] = await pool.execute<FoodEntryWithFoodRow[]>(query, [userId, day]);
        return rows;
    }

    static async create(params: {
        userId: number;
        foodId: number;
        day: string;
        quantityG: number;
    }): Promise<FoodEntryRow> {
        // pega kcal/100g do food
        const [foodRows] = await pool.execute<(RowDataPacket & { calories_per_100g: number })[]>(
            `SELECT calories_per_100g FROM foods WHERE id = ? LIMIT 1`,
            [params.foodId]
        );
        const food = foodRows[0];
        if (!food) throw new Error("Food não encontrado");

        const calories = Math.round((food.calories_per_100g * params.quantityG) / 100);

        const query = `
      INSERT INTO food_entries (user_id, food_id, day, quantity_g, calories)
      VALUES (?, ?, ?, ?, ?)
    `;
        const [result] = await pool.execute<ResultSetHeader>(query, [
            params.userId,
            params.foodId,
            params.day,
            params.quantityG,
            calories,
        ]);

        const [rows] = await pool.execute<FoodEntryRow[]>(
            `SELECT * FROM food_entries WHERE id = ? LIMIT 1`,
            [result.insertId]
        );
        const created = rows[0];
        if (!created) throw new Error("Falha ao criar food_entry");
        return created;
    }

    static async deleteOwned(userId: number, entryId: number): Promise<boolean> {
        const query = `DELETE FROM food_entries WHERE id = ? AND user_id = ?`;
        const [result] = await pool.execute<ResultSetHeader>(query, [entryId, userId]);
        return result.affectedRows > 0;
    }
}
