"use server";

import { prisma } from "./db";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { requireAdmin } from "./auth";
import { ecuadorTodayRange } from "./dates";

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: Role = "USER",
  phone?: string
) {
  try {
    await requireAdmin();
    const hashedPassword = await hash(password, 10);
    const cleanPhone = phone?.trim() || null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: cleanPhone,
        // Record the initial assignment so the history starts at creation
        ...(cleanPhone && {
          phoneChanges: { create: { oldPhone: null, newPhone: cleanPhone } },
        }),
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "No se pudo crear el usuario (¿el email ya está registrado?)" };
  }
}

export async function getActivityLogsByDateRange(
  startDate?: Date,
  endDate?: Date
) {
  try {
    await requireAdmin();
    const logs = await prisma.activityLog.findMany({
      where: {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: logs };
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return { success: false, error: "No se pudieron cargar los registros de actividad" };
  }
}

export async function getAggregatedByUser(
  startDate?: Date,
  endDate?: Date
) {
  try {
    await requireAdmin();
    const aggregated = await prisma.activityLog.groupBy({
      by: ["userId"],
      where: {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
      _sum: {
        whatsappGroupsReached: true,
        whatsappMessagesPerGroup: true,
        whatsappPeopleReached: true,
        fbOwnPostsCreated: true,
        fbCommentsMade: true,
        fbGroupsShared: true,
        fbNewGroupsJoined: true,
        fbPeopleMessaged: true,
      },
    });

    // Also aggregate just today's entries, regardless of the date filter
    const { start: todayStart, end: todayEnd } = ecuadorTodayRange();

    const todayAggregated = await prisma.activityLog.groupBy({
      by: ["userId"],
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
      _sum: {
        whatsappGroupsReached: true,
        whatsappMessagesPerGroup: true,
        whatsappPeopleReached: true,
        fbOwnPostsCreated: true,
        fbCommentsMade: true,
        fbGroupsShared: true,
        fbNewGroupsJoined: true,
        fbPeopleMessaged: true,
      },
    });
    const todayMap = new Map(todayAggregated.map((a) => [a.userId, a]));

    // Get user details
    const userIds = aggregated.map((a) => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Which users have at least one non-empty observation in this range
    const withObservations = await prisma.activityLog.findMany({
      where: {
        userId: { in: userIds },
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
        observations: { not: null },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    const observationUserIds = new Set(withObservations.map((o) => o.userId));

    const result = aggregated.map((agg) => {
      const today = todayMap.get(agg.userId);

      return {
        user: userMap.get(agg.userId)!,
        hasObservations: observationUserIds.has(agg.userId),
        totals: {
          whatsappGroupsReached: agg._sum.whatsappGroupsReached || 0,
          whatsappMessagesPerGroup: agg._sum.whatsappMessagesPerGroup || 0,
          whatsappPeopleReached: agg._sum.whatsappPeopleReached || 0,
          fbOwnPostsCreated: agg._sum.fbOwnPostsCreated || 0,
          fbCommentsMade: agg._sum.fbCommentsMade || 0,
          fbGroupsShared: agg._sum.fbGroupsShared || 0,
          fbNewGroupsJoined: agg._sum.fbNewGroupsJoined || 0,
          fbPeopleMessaged: agg._sum.fbPeopleMessaged || 0,
        },
        todayTotals: {
          whatsappGroupsReached: today?._sum.whatsappGroupsReached || 0,
          whatsappMessagesPerGroup: today?._sum.whatsappMessagesPerGroup || 0,
          whatsappPeopleReached: today?._sum.whatsappPeopleReached || 0,
          fbOwnPostsCreated: today?._sum.fbOwnPostsCreated || 0,
          fbCommentsMade: today?._sum.fbCommentsMade || 0,
          fbGroupsShared: today?._sum.fbGroupsShared || 0,
          fbNewGroupsJoined: today?._sum.fbNewGroupsJoined || 0,
          fbPeopleMessaged: today?._sum.fbPeopleMessaged || 0,
        },
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error aggregating by user:", error);
    return { success: false, error: "No se pudieron calcular los totales" };
  }
}

export async function getObservationsByUser(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    await requireAdmin();
    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
        observations: { not: null },
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
      orderBy: { date: "desc" },
      select: { id: true, date: true, observations: true },
    });

    return { success: true, data: logs };
  } catch (error) {
    console.error("Error fetching observations:", error);
    return { success: false, error: "No se pudieron cargar las observaciones" };
  }
}

export async function updateActivityLog(
  id: string,
  data: {
    whatsappGroupsReached: number;
    whatsappMessagesPerGroup: number;
    whatsappPeopleReached: number;
    fbOwnPostsCreated: number;
    fbCommentsMade: number;
    fbGroupsShared: number;
    fbNewGroupsJoined: number;
    fbPeopleMessaged: number;
    observations?: string | null;
    newPostLinks?: string[];
    newCommentLinks?: string[];
  }
) {
  try {
    const { newPostLinks, newCommentLinks, ...rest } = data;
    const cleanLinks = (newPostLinks || []).filter((l) => l.trim() !== "");
    const cleanCommentLinks = (newCommentLinks || []).filter((l) => l.trim() !== "");

    const updated = await prisma.activityLog.update({
      where: { id },
      data: {
        ...rest,
        ...(cleanLinks.length > 0 && {
          fbOwnPostsLinks: { push: cleanLinks },
        }),
        ...(cleanCommentLinks.length > 0 && {
          fbCommentLinks: { push: cleanCommentLinks },
        }),
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating activity log:", error);
    return { success: false, error: "No se pudo actualizar el registro" };
  }
}

export async function getFacebookLinksByDateRange(
  startDate?: Date,
  endDate?: Date
) {
  try {
    await requireAdmin();
    const logs = await prisma.activityLog.findMany({
      where: {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
        OR: [
          { fbOwnPostsLinks: { isEmpty: false } },
          { fbCommentLinks: { isEmpty: false } },
        ],
      },
      include: {
        user: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    const result = logs.flatMap((log) => [
      ...log.fbOwnPostsLinks.map((link) => ({
        userId: log.userId,
        userName: log.user.name,
        date: log.date,
        link,
        kind: "post" as const,
      })),
      ...log.fbCommentLinks.map((link) => ({
        userId: log.userId,
        userName: log.user.name,
        date: log.date,
        link,
        kind: "comment" as const,
      })),
    ]);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching Facebook links:", error);
    return { success: false, error: "No se pudieron cargar los enlaces de Facebook" };
  }
}

export async function getUserForActivityLog(userId: string) {
  try {
    await requireAdmin();
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "No se pudo cargar el usuario" };
  }
}

export async function getAllUsers() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        driveFolderUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "No se pudieron cargar los usuarios" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await requireAdmin();
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "No se pudo eliminar el usuario" };
  }
}

export async function updateUserPhone(userId: string, newPhone: string) {
  try {
    await requireAdmin();
    const cleanPhone = newPhone.trim();
    if (!cleanPhone) {
      return { success: false, error: "El número no puede estar vacío" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }
    if (user.phone === cleanPhone) {
      return { success: false, error: "Es el mismo número actual" };
    }

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { phone: cleanPhone },
      }),
      prisma.phoneChange.create({
        data: { userId, oldPhone: user.phone, newPhone: cleanPhone },
      }),
    ]);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating phone:", error);
    return { success: false, error: "No se pudo actualizar el número" };
  }
}

export async function getPhoneHistory(userId: string) {
  try {
    await requireAdmin();
    const history = await prisma.phoneChange.findMany({
      where: { userId },
      orderBy: { changedAt: "desc" },
    });

    return { success: true, data: history };
  } catch (error) {
    console.error("Error fetching phone history:", error);
    return { success: false, error: "No se pudo cargar el historial de números" };
  }
}

// Public list shown on the member login screen: only id and name
export async function getUserDirectory() {
  try {
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching user directory:", error);
    return { success: false, error: "No se pudieron cargar los usuarios" };
  }
}
