const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { createUsersTable } = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'API de Autenticação funcionando!',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'GET /api/auth/profile (requer token)',
            users: 'GET /api/auth/users (requer token)',
            test: 'GET /api/test',
            names: 'GET /names',
            newPassword: ' /api/auth/newPassword'

        }
    });
});

const startServer = async () => {
    try {
        // Criar tabela de usuários se não existir
        await createUsersTable();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📍 Acesse: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

startServer();