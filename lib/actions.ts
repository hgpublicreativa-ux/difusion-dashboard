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

    // Get user details
    const userIds = aggregated.map((a) => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = aggregated.map((agg) => ({
      user: userMap.get(agg.userId)!,
      totals: {
        whatsappGroupsReached: agg._sum.whatsappGroupsReached || 0,
        whatsappMessagesPerGroup: agg._sum.whatsappMessagesPerGroup || 0,
        fbOwnPostsCreated: agg._sum.fbOwnPostsCreated || 0,
        fbCommentsMade: agg._sum.fbCommentsMade || 0,
        fbGroupsShared: agg._sum.fbGroupsShared || 0,
        fbNewGroupsJoined: agg._sum.fbNewGroupsJoined || 0,
      },
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error aggregating by user:", error);
    return { success: false, error: "Failed to aggregate data" };
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
