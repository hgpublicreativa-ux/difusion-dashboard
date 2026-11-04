"use server";

import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { prisma } from "./db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  adminTeam,
  signSession,
  verifySession,
} from "./session";
import { TeamId, isTeamId } from "./teams";

// Each team's coordinator has their own password
const ADMIN_PASSWORD_ENV: Record<TeamId, string> = {
  TEAM1: "ADMIN_PASSWORD",
  TEAM2: "ADMIN_PASSWORD_TEAM2",
};

async function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession() {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

// Returns the team the logged-in admin manages; every admin query is
// limited to that team
export async function requireAdmin(): Promise<TeamId> {
  const team = adminTeam(await getSession());
  if (!team) throw new Error("No autorizado");
  return team;
}

export async function loginAdmin(password: string, team: TeamId = "TEAM1") {
  if (!isTeamId(team)) return { success: false, error: "Equipo no válido" };

  const envName = ADMIN_PASSWORD_ENV[team];
  const adminPassword = process.env[envName];
  if (!adminPassword) {
    return { success: false, error: `${envName} no está configurado en el servidor` };
  }

  const a = Buffer.from(password);
  const b = Buffer.from(adminPassword);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { success: false, error: "Clave incorrecta" };
  }

  await setSessionCookie(await signSession({ role: "ADMIN", team }));
  return { success: true };
}

export async function loginUser(userId: string, password: string, team: TeamId = "TEAM1") {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.team !== team || !(await compare(password, user.password))) {
    return { success: false, error: "Clave incorrecta" };
  }

  await setSessionCookie(await signSession({ role: "USER", userId: user.id }));
  return { success: true, user: { id: user.id, name: user.name } };
}

// The logged-in member, only if they belong to the given team
export async function getCurrentUser(team: TeamId = "TEAM1") {
  const session = await getSession();
  if (session?.role !== "USER") return null;

  return prisma.user.findFirst({
    where: { id: session.userId, team },
    select: { id: true, name: true },
  });
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
}

export async function setUserPassword(userId: string, newPassword: string) {
  const team = await requireAdmin();

  if (newPassword.length < 4) {
    return { success: false, error: "La clave debe tener al menos 4 caracteres" };
  }

  try {
    const { count } = await prisma.user.updateMany({
      where: { id: userId, team },
      data: { password: await hash(newPassword, 10) },
    });
    if (count === 0) return { success: false, error: "Usuario no encontrado" };
    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error: "No se pudo cambiar la clave" };
  }
}
