const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2) {
            return res.status(401).json({
                success: false,
                message: 'Erro no formato do token'
            });
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({
                success: false,
                message: 'Token mal formatado'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido ou expirado'
                });
            }

            req.userId = decoded.id;
            req.userEmail = decoded.email;

            return next();
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro na autenticação',
            error: error.message
        });
    }
};

module.exports = authMiddleware;