/**
 * Builds the payload `play` renders on its error screen. The shape must match
 * `isErrorApiErrorData` (libs/messages ErrorApiData), otherwise pusher falls back to a
 * generic "Invalid server response".
 */
export function buildErrorPayload(code: string, title: string, details: string) {
    return {
        status: "error",
        type: "error",
        code,
        title,
        subtitle: "",
        details,
        image: "",
    };
}
