import type { Request } from "express";

export function logRequest(req: Request, ...args: unknown[]) {
    let userIdentifier = "";
    if (req.method === "POST" && req.body && typeof req.body.userIdentifier === "string") {
        userIdentifier = req.body.userIdentifier;
    } else if (req.query && typeof req.query.userIdentifier === "string") {
        userIdentifier = req.query.userIdentifier;
    }
    const userPart = userIdentifier ? ` - user: ${userIdentifier}` : "";
    console.info(`[${new Date().toISOString()}] ${req.method} ${req.path}${userPart}`, ...args);
}
