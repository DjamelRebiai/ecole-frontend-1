import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const SESSION_COOKIE = "ecole_session";
const LEGACY_REFRESH_COOKIE = "ecole_refresh_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
} as const;

function setSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(SESSION_COOKIE, sessionId, SESSION_COOKIE_OPTS);
}

function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTS, maxAge: 0 });
}

function setLegacyRefreshCookie(res: NextResponse, token: string) {
  res.cookies.set(LEGACY_REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

function clearLegacyRefreshCookie(res: NextResponse) {
  res.cookies.set(LEGACY_REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (path[0] === "auth" && path[1] === "session") {
    return handleSession(req);
  }

  return proxyRequest(req, path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path, "POST");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path, "PUT");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path, "DELETE");
}

async function handleSession(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const legacyRefreshToken = !sessionId ? req.cookies.get(LEGACY_REFRESH_COOKIE)?.value : undefined;

  if (!sessionId && !legacyRefreshToken) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(
        sessionId
          ? { session_id: sessionId }
          : { legacy_refresh_token: legacyRefreshToken }
      ),
    });

    if (!response.ok) {
      const res = NextResponse.json(null, { status: 401 });
      clearSessionCookie(res);
      clearLegacyRefreshCookie(res);
      return res;
    }

    const data = await response.json();

    const profileResponse = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const user = profileResponse.ok ? await profileResponse.json() : null;

    const res = NextResponse.json({
      access_token: data.access_token,
      user,
    });

    if (data.session_id) {
      setSessionCookie(res, data.session_id);
    }
    clearLegacyRefreshCookie(res);

    return res;
  } catch {
    const res = NextResponse.json(null, { status: 503 });
    clearSessionCookie(res);
    clearLegacyRefreshCookie(res);
    return res;
  }
}

async function proxyRequest(
  req: NextRequest,
  path: string[],
  method: string
) {
  const queryString = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/${path.join("/")}${queryString}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const xRequestedWith = req.headers.get("x-requested-with");
  if (xRequestedWith) {
    headers["X-Requested-With"] = xRequestedWith;
  }

  const body = method === "GET" || method === "DELETE" ? undefined : await req.text();

  if (body && body.length > 5_242_880) {
    return NextResponse.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" } },
      { status: 413 }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const data = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = data;
    }

    const isLogin = method === "POST" && path[0] === "auth" && path[1] === "login";
    const isLogout = method === "POST" && path[0] === "auth" && path[1] === "logout";

    if (isLogin && typeof parsed === "object" && parsed && "session_id" in (parsed as any)) {
      const parsedObj = parsed as Record<string, unknown>;
      const sessionId = parsedObj.session_id as string;

      const { session_id: _sid, refresh_token: _rt, ...safeBody } = parsedObj;

      const res = NextResponse.json(safeBody, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });

      setSessionCookie(res, sessionId);
      return res;
    }

    if (isLogout) {
      const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
      const legacyRefreshToken = req.cookies.get(LEGACY_REFRESH_COOKIE)?.value;

      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          session_id: sessionId,
          refresh_token: legacyRefreshToken,
        }),
      });

      const res = NextResponse.json({ message: "Logged out" }, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });

      clearSessionCookie(res);
      clearLegacyRefreshCookie(res);
      return res;
    }

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message: "Backend unavailable" } },
      { status: 503 }
    );
  }
}
