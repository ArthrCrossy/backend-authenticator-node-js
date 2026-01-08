const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
require('dotenv').config();

class AuthController {

    static async register(req, res) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Por favor, preencha todos os campos: name, email e password'
                });
            }

            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Este email já está cadastrado'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = await UserModel.create(name, email, hashedPassword);

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(201).json({
                success: true,
                message: 'Usuário cadastrado com sucesso!',
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validação dos campos
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Por favor, preencha email e password'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(200).json({
                success: true,
                message: 'Login realizado com sucesso!',
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    },
                    token
                }
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const user = await UserModel.findById(req.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Erro ao obter perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    static async getAllUsers(req, res) {
        try {
            const users = await UserModel.findAll();
            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;