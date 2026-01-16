import type { Request, Response } from "express";
import UserProfileModel, { ActivityLevel, Goal, Sex } from "../models/userProfileModel";
import DailyCalorieTargetsModel from "../models/dailyCalorieTargetsModel";

function toISODateOnly(d: Date): string {
    // YYYY-MM-DD (local)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function ageFromBirthdate(birthdate: string): number {
    const b = new Date(birthdate + "T00:00:00");
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return Math.max(age, 0);
}

function activityFactor(level: ActivityLevel): number {
    switch (level) {
        case "sedentary": return 1.2;
        case "light": return 1.375;
        case "moderate": return 1.55;
        case "active": return 1.725;
        case "very_active": return 1.9;
    }
}

function mifflinStJeor(params: {
    sex: Sex;
    weightKg: number;
    heightCm: number;
    age: number;
}): number {
    const { sex, weightKg, heightCm, age } = params;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === "male" ? base + 5 : base - 161;
}

function applyGoal(tdee: number, goal: Goal): number {
    // simples e prático
    if (goal === "lose") return tdee - 500;
    if (goal === "gain") return tdee + 300;
    return tdee;
}

export default class UserProfileController {
    static async getMyProfile(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const profile = await UserProfileModel.findByUserId(userId);

            return res.json({ success: true, profile });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar profile",
                error: error?.message,
            });
        }
    }

    static async upsertMyProfile(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const { sex, birthdate, height_cm, weight_kg, activity_level, goal } = req.body ?? {};

            if (!sex || !birthdate || !height_cm || !weight_kg || !activity_level || !goal) {
                return res.status(400).json({
                    success: false,
                    message: "Campos obrigatórios: sex, birthdate, height_cm, weight_kg, activity_level, goal",
                });
            }

            const saved = await UserProfileModel.upsert({
                user_id: userId,
                sex,
                birthdate,
                height_cm: Number(height_cm),
                weight_kg: Number(weight_kg),
                activity_level,
                goal,
            });

            // opcional (recomendado): criar/atualizar meta do dia atual automaticamente
            const age = ageFromBirthdate(saved.birthdate);
            const bmr = mifflinStJeor({
                sex: saved.sex,
                weightKg: Number(saved.weight_kg),
                heightCm: saved.height_cm,
                age,
            });
            const tdee = bmr * activityFactor(saved.activity_level);
            const target = Math.max(1200, Math.round(applyGoal(tdee, saved.goal)));

            const today = toISODateOnly(new Date());
            const targetRow = await DailyCalorieTargetsModel.upsertForDay({
                userId,
                day: today,
                targetCalories: target,
                profileUpdatedAt: saved.updated_at,
            });

            return res.status(200).json({
                success: true,
                message: "Profile salvo com sucesso",
                profile: saved,
                today_target: targetRow,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Erro ao salvar profile",
                error: error?.message,
            });
        }
    }

    static async getMyTargetForDay(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const day = String(req.query.day || "");

            if (!day) {
                return res.status(400).json({ success: false, message: "Informe ?day=YYYY-MM-DD" });
            }

            const row = await DailyCalorieTargetsModel.findByUserAndDay(userId, day);
            return res.json({ success: true, target: row });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar meta diária",
                error: error?.message,
            });
        }
    }

    static async listMyTargets(req: Request, res: Response) {
        try {
            const userId = req.authUserId!;
            const start = String(req.query.start || "");
            const end = String(req.query.end || "");

            if (!start || !end) {
                return res.status(400).json({ success: false, message: "Informe ?start=YYYY-MM-DD&end=YYYY-MM-DD" });
            }

            const rows = await DailyCalorieTargetsModel.listRange(userId, start, end);
            return res.json({ success: true, targets: rows });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Erro ao listar metas",
                error: error?.message,
            });
        }
    }
}
