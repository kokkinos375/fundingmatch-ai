export function isAdminToolRequestAllowed(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const adminSecret = process.env.ADMIN_SECRET?.trim();

  if (!adminSecret) {
    return false;
  }

  return request.headers.get("x-admin-secret") === adminSecret;
}

export function adminToolForbiddenResponse() {
  return Response.json(
    {
      error:
        "Admin import/export tools are disabled in production unless ADMIN_SECRET is configured and supplied.",
    },
    { status: 403 },
  );
}
