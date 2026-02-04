import { run } from "../config/database";

export async function likeBroadcast(messageId: number, userId: number) {
    const [result]: any = await run(
        `
    INSERT INTO broadcast_likes (message_id, user_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE id = id
  `,
        [messageId, userId]
    );

    const inserted = Number(result?.affectedRows) === 1;
    return { inserted };
}

export async function unlikeBroadcast(messageId: number, userId: number) {
    const [result]: any = await run(
        `
    DELETE FROM broadcast_likes
    WHERE message_id = ? AND user_id = ?
  `,
        [messageId, userId]
    );

    const deleted = Number(result?.affectedRows) > 0;
    return { deleted };
}

export async function hasUserLiked(messageId: number, userId: number) {
    const [rows]: any = await run(
        `
    SELECT 1 AS ok
    FROM broadcast_likes
    WHERE message_id = ? AND user_id = ?
    LIMIT 1
  `,
        [messageId, userId]
    );

    return Boolean(rows?.length);
}

export async function countLikes(messageId: number) {
    const [rows]: any = await run(
        `
    SELECT COUNT(*) AS likes
    FROM broadcast_likes
    WHERE message_id = ?
  `,
        [messageId]
    );

    return Number(rows?.[0]?.likes ?? 0);
}

export async function listLikes(messageId: number, limit = 50, offset = 0) {
    const [rows]: any = await run(
        `
    SELECT
      u.id,
      u.name,
      bl.created_at
    FROM broadcast_likes bl
    JOIN users u ON u.id = bl.user_id
    WHERE bl.message_id = ?
    ORDER BY bl.created_at DESC
    LIMIT ? OFFSET ?
  `,
        [messageId, limit, offset]
    );

    return rows as Array<{ id: number; name: string; created_at: string }>;
}
