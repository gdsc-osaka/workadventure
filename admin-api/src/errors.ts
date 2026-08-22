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
