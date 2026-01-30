import type { ResultSetHeader } from "mysql2";
import { pool } from "../../config/database";

export async function createBroadcast(params: {
    title: string;
    body: string;
    createdByUserId?: number | null;
}) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.execute<ResultSetHeader>(
            `INSERT INTO broadcast_messages (title, body, created_by_user_id)
             VALUES (?, ?, ?)`,
            [params.title, params.body, params.createdByUserId ?? null]
        );

        const messageId = result.insertId;

        await conn.execute(
            `INSERT INTO user_broadcast_status (user_id, message_id)
             SELECT u.id, ?
             FROM users u`,
            [messageId]
        );

        await conn.commit();
        return { messageId };
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}


export async function listMyBroadcast(userId: number, limit = 20, offset = 0) {
    const [rows] = await pool.execute(
                `
                    SELECT
                        bm.id,
                        bm.title,
                        bm.body,
                        bm.created_at,
                        ubs.is_read,
                        ubs.read_at
                    FROM user_broadcast_status ubs
                             JOIN broadcast_messages bm ON bm.id = ubs.message_id
                    WHERE ubs.user_id = ${userId}
                    ORDER BY bm.created_at DESC
                        LIMIT ${limit} OFFSET ${offset}
`);
    return rows;

}

export async function markBroadcastRead(userId: number, messageId: number) {
    const [result] = await pool.execute(
        `UPDATE user_broadcast_status
     SET is_read = 1, read_at = NOW()
     WHERE user_id = ? AND message_id = ? AND is_read = 0`,
        [userId, messageId]
    );

    const affected = (result as any).affectedRows as number;
    return affected > 0;
}

export async function unreadCount(userId: number) {
    const [rows] = await pool.execute(
        `SELECT COUNT(*) as cnt
     FROM user_broadcast_status
     WHERE user_id = ? AND is_read = 0`,
        [userId]
    );
    return (rows as any[])[0]?.cnt ?? 0;
}

export async function deleteId(broadcastId: number) {

    const [row]: any = await pool.execute(
        `DELETE FROM broadcast_messages WHERE id = ?`,
        [broadcastId]
    );
    return row.affectedRows as number;

}
