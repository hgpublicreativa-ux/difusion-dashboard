import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, adminTeam, verifySession } from "@/lib/session";
import { TEAMS, TeamId } from "@/lib/teams";

// Each team's admin pages require an admin session for that same team
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const team: TeamId = pathname.startsWith("/equipo-2/") ? "TEAM2" : "TEAM1";
  const loginPath = TEAMS[team].adminLoginPath;

  if (pathname === loginPath) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (adminTeam(session) !== team) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/equipo-2/admin/:path*"],
};
