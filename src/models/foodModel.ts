import { pool } from "../config/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type FoodRow = RowDataPacket & {
    id: number;
    name: string;
    calories_per_100g: number;
    protein_per_100g: number | null;
    carbs_per_100g: number | null;
    fat_per_100g: number | null;
    created_by_user_id: number | null;
    created_at: Date;
};

export default class FoodModel {
    static async findById(id: number): Promise<FoodRow | null> {
        const query = `SELECT * FROM foods WHERE id = ? LIMIT 1`;
        const [rows] = await pool.execute<FoodRow[]>(query, [id]);
        return rows[0] ?? null;
    }

    static async listForUser(userId: number): Promise<FoodRow[]> {
        // global (NULL) + do usuário
        const query = `
      SELECT * FROM foods
      WHERE created_by_user_id IS NULL OR created_by_user_id = ?
      ORDER BY created_at DESC
    `;
        const [rows] = await pool.execute<FoodRow[]>(query, [userId]);
        return rows;
    }

    static async searchForUser(userId: number, q: string): Promise<FoodRow[]> {
        const query = `
      SELECT * FROM foods
      WHERE (created_by_user_id IS NULL OR created_by_user_id = ?)
        AND name LIKE ?
      ORDER BY name ASC
      LIMIT 50
    `;
        const [rows] = await pool.execute<FoodRow[]>(query, [userId, `%${q}%`]);
        return rows;
    }

    static async create(params: {
        userId: number;
        name: string;
        calories_per_100g: number;
        protein_per_100g?: number | null;
        carbs_per_100g?: number | null;
        fat_per_100g?: number | null;
    }): Promise<FoodRow> {
        const query = `
      INSERT INTO foods
        (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, created_by_user_id)
      VALUES
        (?, ?, ?, ?, ?, ?)
    `;
        const [result] = await pool.execute<ResultSetHeader>(query, [
            params.name,
            params.calories_per_100g,
            params.protein_per_100g ?? null,
            params.carbs_per_100g ?? null,
            params.fat_per_100g ?? null,
            params.userId,
        ]);

        const row = await this.findById(result.insertId);
        if (!row) throw new Error("Falha ao criar alimento");
        return row;
    }

    static async updateOwned(params: {
        userId: number;
        id: number;
        name?: string;
        calories_per_100g?: number;
        protein_per_100g?: number | null;
        carbs_per_100g?: number | null;
        fat_per_100g?: number | null;
    }): Promise<FoodRow | null> {
        // só edita se for dono
        const existing = await this.findById(params.id);
        if (!existing) return null;
        if (existing.created_by_user_id !== params.userId) return null;

        const next = {
            name: params.name ?? existing.name,
            calories_per_100g: params.calories_per_100g ?? existing.calories_per_100g,
            protein_per_100g: params.protein_per_100g ?? existing.protein_per_100g,
            carbs_per_100g: params.carbs_per_100g ?? existing.carbs_per_100g,
            fat_per_100g: params.fat_per_100g ?? existing.fat_per_100g,
        };

        const query = `
      UPDATE foods
      SET name = ?, calories_per_100g = ?, protein_per_100g = ?, carbs_per_100g = ?, fat_per_100g = ?
      WHERE id = ? AND created_by_user_id = ?
    `;
        const [result] = await pool.execute<ResultSetHeader>(query, [
            next.name,
            next.calories_per_100g,
            next.protein_per_100g,
            next.carbs_per_100g,
            next.fat_per_100g,
            params.id,
            params.userId,
        ]);

        if (result.affectedRows === 0) return null;
        return await this.findById(params.id);
    }

    static async deleteOwned(userId: number, id: number): Promise<boolean> {
        const query = `DELETE FROM foods WHERE id = ? AND created_by_user_id = ?`;
        const [result] = await pool.execute<ResultSetHeader>(query, [id, userId]);
        return result.affectedRows > 0;
    }
}
