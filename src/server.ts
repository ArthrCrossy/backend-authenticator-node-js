import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

import { createTables } from "./config/database";
import process = require("process");
import authRoutes from "./routes/authRoutes";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.get("/", (_req: Request, res: Response) => {
    res.json({
        message: "API de Autenticação funcionando!",
        endpoints: {
            register: "POST /api/auth/register",
            login: "POST /api/auth/login",
            profile: "GET /api/auth/profile (requer token)",
            users: "GET /api/auth/users (requer token)",
            test: "GET /api/test",
            names: "GET /names",
            newPassword: "/api/auth/newPassword",
        },
    });
});

async function startServer() {
    try {
        await createTables();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📍 Acesse: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Erro ao iniciar servidor:", error);
        process.exit(1);
    }
}

startServer();
