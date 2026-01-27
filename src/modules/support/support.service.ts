import {pool} from "../../config/database";

export type CreateSupportMessageInput = {
    senderUserId: number;
    receiverAdminId?: number | null;
    title?: string | null;
    body: string;
};

export async function createSupportMessage(input: CreateSupportMessageInput) {
    const senderUserId = Number(input.senderUserId);
    const receiverAdminId =
        input.receiverAdminId === undefined ? null : input.receiverAdminId;
    const title = input.title?.trim() || null;
    const body = (input.body ?? "").trim();

    if (!senderUserId || senderUserId <= 0) throw new Error("Invalid sender user id");
    if (!body) throw new Error("Body is required");
    if (body.length > 5000) throw new Error("Body too long");

    const sql = `
    INSERT INTO user_admin_messages (sender_user_id, receiver_admin_id, title, body)
    VALUES (?, ?, ?, ?)
  `;

    const [result]: any = await pool.execute(sql, [
        senderUserId,
        receiverAdminId,
        title,
        body,
    ]);

    return { id: Number(result.insertId) };
}

export async function listAdminInbox(params: {
    adminId: number;
    onlyUnread?: boolean;
    limit?: number;
    offset?: number;
}) {
    const adminId = Number(params.adminId);
    const onlyUnread = !!params.onlyUnread;
    const limit = Math.min(Math.max(Number(params.limit ?? 50), 1), 100);
    const offset = Math.max(Number(params.offset ?? 0), 0);

    const sql = `
    SELECT
      uam.id,
      uam.title,
      uam.body,
      uam.is_read,
      uam.read_at,
      uam.created_at,
      u.id   AS sender_id,
      u.name AS sender_name,
      u.email AS sender_email
    FROM user_admin_messages uam
    JOIN users u ON u.id = uam.sender_user_id
    WHERE (uam.receiver_admin_id IS NULL OR uam.receiver_admin_id = ?)
      ${onlyUnread ? "AND uam.is_read = 0" : ""}
    ORDER BY uam.created_at DESC
    LIMIT ? OFFSET ?;
  `;

    const [rows] = await pool.execute(sql, [adminId, limit, offset]);
    return rows;
}

export async function markSupportMessageRead(params: {
    messageId: number;
}) {
    const messageId = Number(params.messageId);
    if (!messageId || messageId <= 0) throw new Error("Invalid message id");

    const sql = `
    UPDATE user_admin_messages
    SET is_read = 1,
        read_at = NOW()
    WHERE id = ?;
  `;

    const [result]: any = await pool.execute(sql, [messageId]);
    if (Number(result.affectedRows ?? 0) === 0) {
        throw new Error("Message not found");
    }

    return { ok: true };
}
