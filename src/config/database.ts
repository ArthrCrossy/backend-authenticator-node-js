import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import "dotenv/config";

export const pool: Pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export async function createUsersTable(): Promise<void> {
    const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

    try {
        await pool.execute(query);
        console.log("Tabela de usuários verificada/criada com sucesso!");
    } catch (error) {
        console.error("Erro ao criar tabela de usuários:", error);
    }
}
