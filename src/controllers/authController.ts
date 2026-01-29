import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import UserModel, { PublicUser } from "../models/userModel";
import "dotenv/config";

type RegisterBody = {
    name: string;
    email: string;
    password: string;
};

type LoginBody = {
    email: string;
    password: string;
};

type NewPasswordBody = {
    email: string;
    password: string;
};

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET não configurado no .env");
    return secret;
}

export default class AuthController {
    static async register(req: Request<{}, {}, RegisterBody>, res: Response) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Por favor, preencha todos os campos: name, email e password",
                });
            }

            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Este email já está em uso",
                });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const user = await UserModel.create(name, email, passwordHash);

            const token = jwt.sign(
                { id: user.id, email: user.email },
                getJwtSecret(),
                { expiresIn: "7d" }
            );

            return res.status(201).json({
                success: true,
                message: "Usuário registrado com sucesso",
                user,
                token,
            });
        } catch (error: any) {
            console.error("Erro no registro:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao registrar usuário",
                error: error?.message,
            });
        }
    }

    static async login(req: Request<{}, {}, LoginBody>, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Por favor, informe email e password",
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Credenciais inválidas",
                });
            }

            const ok = await bcrypt.compare(password, user.password);
            if (!ok) {
                return res.status(401).json({
                    success: false,
                    message: "Credenciais inválidas",
                });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                getJwtSecret(),
                { expiresIn: "7d" }
            );

            const publicUser: PublicUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at,
                role: user.role,
            };

            return res.json({
                success: true,
                role:user.role,
                message: "Login realizado com sucesso",
                user: publicUser,
                token,
            });
        } catch (error: any) {
            console.error("Erro no login:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao fazer login",
                error: error?.message,
            });
        }
    }

    static async getProfile(req: Request, res: Response) {
        try {
              const userIdRaw = req.body.id;
            const userId = typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

            if (!userId || Number.isNaN(userId)) {
                return res.status(401).json({
                    success: false,
                    message: "Não autenticado",
                });
            }

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado",
                });
            }

            return res.json({
                success: true,
                user,
            });
        } catch (error: any) {
            console.error("Erro ao buscar perfil:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar perfil",
                error: error?.message,
            });
        }
    }

    static async getAllUsers(_req: Request, res: Response) {
        try {
            const users = await UserModel.findAll();
            return res.json({
                success: true,
                users,
            });
        } catch (error: any) {
            console.error("Erro ao buscar usuários:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar usuários",
                error: error?.message,
            });
        }
    }

    static async getAllNames(_req: Request, res: Response) {
        try {
            const names = await UserModel.findAllNames();
            return res.json({
                success: true,
                names,
            });
        } catch (error: any) {
            console.error("Erro ao buscar nomes:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar nomes",
                error: error?.message,
            });
        }
    }

    static async getEmail(req: Request<{}, {}, NewPasswordBody>, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Informe email e nova password",
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado",
                });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const query = "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            const { pool } = await import("../config/database");
            await pool.execute(query, [passwordHash, user.id]);

            return res.json({
                success: true,
                message: "Senha atualizada com sucesso",
            });
        } catch (error: any) {
            console.error("Erro ao atualizar senha:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao atualizar senha",
                error: error?.message,
            });
        }
    }
}
