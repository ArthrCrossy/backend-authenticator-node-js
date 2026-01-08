const { pool } = require('../config/database');

class UserModel {

    static async create(name, email, password) {
        const query = `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
                RETURNING id, name, email, created_at
        `;
        const values = [name, email, password];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT id, name, email, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findAll() {
        const query = 'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }

    static async update(id, name, email) {
        const query = `
            UPDATE users
            SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
                RETURNING id, name, email, updated_at
        `;
        const result = await pool.query(query, [name, email, id]);
        return result.rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = UserModel;