"use server";

import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { prisma } from "./db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
} from "./session";

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

export async function requireAdmin() {
  const session = await getSession();
  if (session?.role !== "ADMIN") throw new Error("No autorizado");
}

export async function loginAdmin(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { success: false, error: "ADMIN_PASSWORD no está configurado en el servidor" };
  }

  const a = Buffer.from(password);
  const b = Buffer.from(adminPassword);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { success: false, error: "Clave incorrecta" };
  }

  await setSessionCookie(await signSession({ role: "ADMIN" }));
  return { success: true };
}

export async function loginUser(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await compare(password, user.password))) {
    return { success: false, error: "Clave incorrecta" };
  }

  await setSessionCookie(await signSession({ role: "USER", userId: user.id }));
  return { success: true, user: { id: user.id, name: user.name } };
}

export async function getCurrentUser() {
  const session = await getSession();
  if (session?.role !== "USER") return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true },
  });
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
}

export async function setUserPassword(userId: string, newPassword: string) {
  await requireAdmin();

  if (newPassword.length < 4) {
    return { success: false, error: "La clave debe tener al menos 4 caracteres" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: await hash(newPassword, 10) },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error: "No se pudo cambiar la clave" };
  }
}
