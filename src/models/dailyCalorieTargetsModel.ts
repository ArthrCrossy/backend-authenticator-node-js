import { pool } from "../config/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type DailyCalorieTargetRow = RowDataPacket & {
    id: number;
    user_id: number;
    day: string; // YYYY-MM-DD
    target_calories: number;
    profile_updated_at: Date;
    created_at: Date;
};

export default class DailyCalorieTargetsModel {
    static async findByUserAndDay(userId: number, day: string): Promise<DailyCalorieTargetRow | null> {
        const query = `
      SELECT * FROM daily_calorie_targets
      WHERE user_id = ? AND day = ?
      LIMIT 1
    `;
        const [rows] = await pool.execute<DailyCalorieTargetRow[]>(query, [userId, day]);
        return rows[0] ?? null;
    }

    static async upsertForDay(params: {
        userId: number;
        day: string;
        targetCalories: number;
        profileUpdatedAt: Date;
    }): Promise<DailyCalorieTargetRow> {
        const query = `
      INSERT INTO daily_calorie_targets
        (user_id, day, target_calories, profile_updated_at)
      VALUES
        (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        target_calories = VALUES(target_calories),
        profile_updated_at = VALUES(profile_updated_at)
    `;

        await pool.execute<ResultSetHeader>(query, [
            params.userId,
            params.day,
            params.targetCalories,
            params.profileUpdatedAt,
        ]);

        const row = await this.findByUserAndDay(params.userId, params.day);
        if (!row) throw new Error("Falha ao salvar meta diária");
        return row;
    }

    static async listRange(userId: number, start: string, end: string): Promise<DailyCalorieTargetRow[]> {
        const query = `
      SELECT * FROM daily_calorie_targets
      WHERE user_id = ? AND day BETWEEN ? AND ?
      ORDER BY day ASC
    `;
        const [rows] = await pool.execute<DailyCalorieTargetRow[]>(query, [userId, start, end]);
        return rows;
    }
}
