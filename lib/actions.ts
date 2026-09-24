"use server";

import { prisma } from "./db";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: Role = "USER"
) {
  try {
    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function getActivityLogsByDateRange(
  startDate?: Date,
  endDate?: Date
) {
  try {
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
    return { success: false, error: "Failed to fetch activity logs" };
  }
}

export async function getAggregatedByUser(
  startDate?: Date,
  endDate?: Date
) {
  try {
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
        fbOwnPostsCreated: true,
        fbCommentsMade: true,
        fbGroupsShared: true,
        fbNewGroupsJoined: true,
      },
    });

    // Also aggregate just today's entries, regardless of the date filter
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAggregated = await prisma.activityLog.groupBy({
      by: ["userId"],
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
      _sum: {
        whatsappGroupsReached: true,
        whatsappMessagesPerGroup: true,
        fbOwnPostsCreated: true,
        fbCommentsMade: true,
        fbGroupsShared: true,
        fbNewGroupsJoined: true,
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
          fbOwnPostsCreated: agg._sum.fbOwnPostsCreated || 0,
          fbCommentsMade: agg._sum.fbCommentsMade || 0,
          fbGroupsShared: agg._sum.fbGroupsShared || 0,
          fbNewGroupsJoined: agg._sum.fbNewGroupsJoined || 0,
        },
        todayTotals: {
          whatsappGroupsReached: today?._sum.whatsappGroupsReached || 0,
          whatsappMessagesPerGroup: today?._sum.whatsappMessagesPerGroup || 0,
          fbOwnPostsCreated: today?._sum.fbOwnPostsCreated || 0,
          fbCommentsMade: today?._sum.fbCommentsMade || 0,
          fbGroupsShared: today?._sum.fbGroupsShared || 0,
          fbNewGroupsJoined: today?._sum.fbNewGroupsJoined || 0,
        },
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error aggregating by user:", error);
    return { success: false, error: "Failed to aggregate data" };
  }
}

export async function getObservationsByUser(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
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
    return { success: false, error: "Failed to fetch observations" };
  }
}

export async function updateActivityLog(
  id: string,
  data: {
    whatsappGroupsReached: number;
    whatsappMessagesPerGroup: number;
    fbOwnPostsCreated: number;
    fbCommentsMade: number;
    fbGroupsShared: number;
    fbNewGroupsJoined: number;
    observations?: string | null;
    newPostLinks?: string[];
  }
) {
  try {
    const { newPostLinks, ...rest } = data;
    const cleanLinks = (newPostLinks || []).filter((l) => l.trim() !== "");

    const updated = await prisma.activityLog.update({
      where: { id },
      data: {
        ...rest,
        ...(cleanLinks.length > 0 && {
          fbOwnPostsLinks: { push: cleanLinks },
        }),
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating activity log:", error);
    return { success: false, error: "Failed to update activity log" };
  }
}

export async function getFacebookLinksByDateRange(
  startDate?: Date,
  endDate?: Date
) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
        fbOwnPostsLinks: { isEmpty: false },
      },
      include: {
        user: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    const result = logs.flatMap((log) =>
      log.fbOwnPostsLinks.map((link) => ({
        userId: log.userId,
        userName: log.user.name,
        date: log.date,
        link,
      }))
    );

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching Facebook links:", error);
    return { success: false, error: "Failed to fetch Facebook links" };
  }
}

export async function getUserForActivityLog(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}
