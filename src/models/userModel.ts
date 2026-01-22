import { pool } from "../config/database";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type UserRow = RowDataPacket & {
    id: number;
    name: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date | null;
};

export type PublicUser = {
    id: number;
    name: string;
    email: string;
    created_at: Date;
    role: String;
};

export type UserNameRow = RowDataPacket & {
    name: string;
    created_at: Date;
};

export default class    userModel {
    static async create(
        name: string,
        email: string,
        passwordHash: string
    ): Promise<PublicUser> {
        const query = `
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `;

        const [result] = await pool.execute<ResultSetHeader>(query, [
            name,
            email,
            passwordHash,
        ]);

        return {
            id: result.insertId,
            name,
            email,
            created_at: new Date()
        };
    }

    static async findByEmail(email: string): Promise<UserRow | null> {
        if (!email) return null;

        const query = "SELECT * FROM users WHERE email = ? LIMIT 1";
        const [rows] = await pool.execute<UserRow[]>(query, [email]);
        return rows[0] ?? null;
    }

    static async findById(id: number): Promise<PublicUser | null> {
        const query = "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1";
        const [rows] = await pool.execute<(RowDataPacket & PublicUser)[]>(query, [id]);
        return rows[0] ?? null;
    }

    static async findAll(): Promise<PublicUser[]> {
        const query = "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC";
        const [rows] = await pool.execute<(RowDataPacket & PublicUser)[]>(query);
        return rows as PublicUser[];
    }

    static async findAllNames(): Promise<UserNameRow[]> {
        const query = "SELECT name, created_at FROM users ORDER BY created_at DESC";
        const [rows] = await pool.execute<UserNameRow[]>(query);
        return rows;
    }

    static async update(
        id: number,
        name: string,
        email: string
    ): Promise<PublicUser | null> {
        const query = `
      UPDATE users
      SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

        const [result] = await pool.execute<ResultSetHeader>(query, [name, email, id]);
        if (result.affectedRows === 0) return null;

        return await userModel.findById(id);
    }

    static async delete(id: number): Promise<{ id: number } | null> {
        const query = "DELETE FROM users WHERE id = ?";
        const [result] = await pool.execute<ResultSetHeader>(query, [id]);
        if (result.affectedRows === 0) return null;
        return { id };
    }
}
