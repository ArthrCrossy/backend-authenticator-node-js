// src/types/assessment.ts

export type AssessmentSource = "user" | "admin";

export type GoalPrimary =
    | "lose_fat"
    | "gain_muscle"
    | "maintain_health"
    | "recomp"
    | "performance";

export type ActivityLevel =
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "very_active"
    | "athlete";

export type CurrentlyTraining = "yes" | "no" | "stopped_recently";

export type AlcoholIntake = "none" | "rare" | "weekends" | "weekly" | "daily";

export type StressLevel = "low" | "moderate" | "high" | "very_high";

export type CreateAssessmentBody = {
    notes?: string;

    personal?: {
        full_name?: string;
        email?: string;
        phone?: string;
        sex?: "male" | "female";
        birthdate?: string;
        height_cm?: number;
        weight_kg?: number;
    };

    measurements?: {
        waist_cm?: number;
        hip_cm?: number;
        arm_cm?: number;
        thigh_cm?: number;
        calf_cm?: number;
        neck_cm?: number;
    };

    goals: {
        primary_goal: GoalPrimary;
        target_weight_kg?: number;
        deadline_weeks?: number;
        deadline_date?: string;
    };

    activity: {
        activity_level: ActivityLevel;
        currently_training: CurrentlyTraining;
        training_frequency_per_week?: number;
        training_type_codes?: string[];
        notes?: string;
    };

    nutrition?: {
        restriction_codes?: string[];
        allergies_text?: string;
        intolerances_text?: string;
        preferences_aversions_text?: string;
        meals_per_day?: number;
        water_intake_liters?: number;
        alcohol_intake?: AlcoholIntake;
        past_diets_text?: string;
    };

    health?: {
        conditions_text?: string;
        medications_text?: string;
        surgeries_text?: string;
        supplements_text?: string;
    };

    routine?: {
        wake_time?: string;
        sleep_time?: string;
        sleep_hours?: number;
        occupation?: string;
        work_schedule_text?: string;
        stress_level?: StressLevel;
        additional_notes?: string;
    };
};
