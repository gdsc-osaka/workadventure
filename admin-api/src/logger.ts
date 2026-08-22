import type { Request } from "express";

/** Longest identifier we are willing to put in a log line. */
const MAX_LOGGED_IDENTIFIER_LENGTH = 128;

/**
 * `userIdentifier` is request-controlled, so it must never reach the log verbatim:
 * a carriage return or line feed inside it would let a caller forge log entries
 * (CWE-117). Drop every control character and cap the length.
 */
function sanitizeForLog(value: string): string {
    const cleaned = Array.from(value)
        .filter((char) => {
            const code = char.codePointAt(0) ?? 0;
            return code > 31 && code !== 127;
        })
        .join("");
    return cleaned.length > MAX_LOGGED_IDENTIFIER_LENGTH
        ? cleaned.slice(0, MAX_LOGGED_IDENTIFIER_LENGTH) + "..."
        : cleaned;
}

/**
 * Logs one line per request. This includes the user identifier (the OIDC `sub`, or
 * the e-mail address depending on the provider) because it is what makes a sync
 * problem debuggable — see "ログに残る情報" in the README before shipping these logs
 * to a shared log aggregator.
 */
export function logRequest(req: Request, ...args: unknown[]) {
    let userIdentifier = "";
    if (req.method === "POST" && req.body && typeof req.body.userIdentifier === "string") {
        userIdentifier = req.body.userIdentifier;
    } else if (req.query && typeof req.query.userIdentifier === "string") {
        userIdentifier = req.query.userIdentifier;
    }
    const userPart = userIdentifier ? ` - user: ${sanitizeForLog(userIdentifier)}` : "";
    console.info(`[${new Date().toISOString()}] ${req.method} ${req.path}${userPart}`, ...args);
}
