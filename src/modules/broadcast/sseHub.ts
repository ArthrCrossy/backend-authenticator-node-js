import type { Response } from "express";

const clients = new Map<number, Set<Response>>();

export function addClient(userId: number, res: Response) {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    res.write("\n");

    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId)!.add(res);

    res.on("close", () => {
        clients.get(userId)?.delete(res);
        if (clients.get(userId)?.size === 0) clients.delete(userId);
    });
}

export function emitToAll(event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const set of clients.values()) {
        for (const res of set) res.write(payload);
    }
}
