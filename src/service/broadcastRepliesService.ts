import {pool} from "../config/database";

export async function createBroadcastReply(input: {
    messageId: number;
    repliedByUserId: number;
    body: string;
}) {
    const sql = `
        INSERT INTO broadcast_replies (message_id, replied_by_user_id, body)
        VALUES (?, ?, ?)
    `;

    const [result]: any = await pool.execute(sql, [
        input.messageId,
        input.repliedByUserId,
        input.body,
    ]);

    return Number(result.insertId);
}

export async function listBroadcastReplies(input: {
    messageId: number;
    limit?: number;
    offset?: number;
}) {
    const messageId = Number(input.messageId);
    const limit = Number.isInteger(input.limit) ? Number(input.limit) : 50;
    const offset = Number.isInteger(input.offset) ? Number(input.offset) : 0;

    if (!Number.isInteger(messageId) || messageId <= 0) throw new Error("Invalid messageId");

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const sql = `
    SELECT
      br.id,
      br.message_id,
      br.body,
      br.created_at,
      u.id   AS replied_by_user_id,
      u.name AS replied_by_name,
      u.role AS replied_by_role
    FROM broadcast_replies br
    JOIN users u
      ON u.id = br.replied_by_user_id
    WHERE br.message_id = ?
    ORDER BY br.created_at ASC
    LIMIT ${safeLimit} OFFSET ${safeOffset};
  `;

    const [rows] = await pool.execute(sql, [messageId]);
    return rows;
}


