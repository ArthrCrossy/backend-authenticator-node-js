import { pool } from "../config/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export type UserProfileRow = RowDataPacket & {
    user_id: number;
    sex: Sex;
    birthdate: string; // YYYY-MM-DD
    height_cm: number;
    weight_kg: number; // DECIMAL
    activity_level: ActivityLevel;
    goal: Goal;
    updated_at: Date;
};

export type UpsertUserProfileInput = {
    user_id: number;
    sex: Sex;
    birthdate: string;
    height_cm: number;
    weight_kg: number;
    activity_level: ActivityLevel;
    goal: Goal;
};

export default class UserProfileModel {
    static async findByUserId(userId: number): Promise<UserProfileRow | null> {
        const query = `SELECT * FROM user_profile WHERE user_id = ? LIMIT 1`;
        const [rows] = await pool.execute<UserProfileRow[]>(query, [userId]);
        return rows[0] ?? null;
    }

    static async upsert(input: UpsertUserProfileInput): Promise<UserProfileRow> {
        const query = `
      INSERT INTO user_profile
        (user_id, sex, birthdate, height_cm, weight_kg, activity_level, goal)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sex = VALUES(sex),
        birthdate = VALUES(birthdate),
        height_cm = VALUES(height_cm),
        weight_kg = VALUES(weight_kg),
        activity_level = VALUES(activity_level),
        goal = VALUES(goal),
        updated_at = CURRENT_TIMESTAMP
    `;

        await pool.execute<ResultSetHeader>(query, [
            input.user_id,
            input.sex,
            input.birthdate,
            input.height_cm,
            input.weight_kg,
            input.activity_level,
            input.goal,
        ]);

        const updated = await this.findByUserId(input.user_id);
        if (!updated) throw new Error("Falha ao salvar profile");
        return updated;
    }

    static async deleteByUserId(userId: number): Promise<boolean> {
        const query = `DELETE FROM user_profile WHERE user_id = ?`;
        const [result] = await pool.execute<ResultSetHeader>(query, [userId]);
        return result.affectedRows > 0;
    }
}
