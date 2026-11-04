"use server";

import { prisma } from "./db";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { cleanName, cleanPhone, nameKey } from "./importUsers";
import { Role } from "@prisma/client";
import { requireAdmin } from "./auth";
import { ecuadorTodayRange } from "./dates";
import { Prisma } from "@prisma/client";
import {
  ALL_METRIC_KEYS,
  LinkKey,
  MetricKey,
  TEAMS,
  TeamId,
  inputMetrics,
  isTeamId,
} from "./teams";

// _sum selector covering every numeric metric column
const SUM_ALL = Object.fromEntries(ALL_METRIC_KEYS.map((k) => [k, true])) as Record<
  MetricKey,
  true
>;

function toTotals(sum: Partial<Record<MetricKey, number | null>> | undefined) {
  return Object.fromEntries(
    ALL_METRIC_KEYS.map((k) => [k, sum?.[k] ?? 0])
  ) as Record<MetricKey, number>;
}

export async function createUser(
  name: string,
  email: string | null,
  password: string,
  role: Role = "USER",
  phone?: string
) {
  try {
    const team = await requireAdmin();
    const hashedPassword = await hash(password, 10);
    const cleanPhone = phone?.trim() || null;

    const user = await prisma.user.create({
      data: {
        name,
        email: email?.trim() || null,
        password: hashedPassword,
        role,
        team,
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
    const team = await requireAdmin();
    const logs = await prisma.activityLog.findMany({
      where: {
        user: { team },
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
    const team = await requireAdmin();
    const aggregated = await prisma.activityLog.groupBy({
      by: ["userId"],
      where: {
        user: { team },
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
      _sum: SUM_ALL,
    });

    // Also aggregate just today's entries, regardless of the date filter
    const { start: todayStart, end: todayEnd } = ecuadorTodayRange();

    const todayAggregated = await prisma.activityLog.groupBy({
      by: ["userId"],
      where: {
        user: { team },
        date: { gte: todayStart, lte: todayEnd },
      },
      _sum: SUM_ALL,
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
        totals: toTotals(agg._sum),
        todayTotals: toTotals(today?._sum),
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
    const team = await requireAdmin();
    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
        user: { team },
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
    metrics: Partial<Record<MetricKey, number>>;
    observations?: string | null;
    newLinks?: Partial<Record<LinkKey, string[]>>;
  }
) {
  try {
    const team = await requireAdmin();
    const log = await prisma.activityLog.findFirst({
      where: { id, user: { team } },
    });
    if (!log) {
      return { success: false, error: "Registro no encontrado" };
    }

    const config = TEAMS[team];
    const update: Record<string, unknown> = {
      observations: data.observations ?? null,
    };

    // Only this team's typed-in metrics can be edited
    for (const metric of inputMetrics(team)) {
      const value = data.metrics[metric.key];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        update[metric.key] = Math.floor(value);
      }
    }

    // New links are appended, never replacing the ones already saved
    const added: Partial<Record<LinkKey, number>> = {};
    for (const list of config.linkLists) {
      const clean = (data.newLinks?.[list.key] || [])
        .map((l) => l.trim())
        .filter((l) => l !== "");
      if (clean.length > 0) {
        update[list.key] = { push: clean };
        added[list.key] = clean.length;
      }
    }

    // Derived metrics (e.g. cuentas comentadas) follow their link count
    for (const metric of config.metrics) {
      if (metric.derivedFromLinks) {
        update[metric.key] =
          log[metric.derivedFromLinks].length + (added[metric.derivedFromLinks] ?? 0);
      }
    }

    const updated = await prisma.activityLog.update({
      where: { id },
      data: update as Prisma.ActivityLogUpdateInput,
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating activity log:", error);
    return { success: false, error: "No se pudo actualizar el registro" };
  }
}

// Every link saved by this admin's team in the range, one row per link
export async function getLinksByDateRange(startDate?: Date, endDate?: Date) {
  try {
    const team = await requireAdmin();
    const lists = TEAMS[team].linkLists;
    const logs = await prisma.activityLog.findMany({
      where: {
        user: { team },
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
        OR: lists.map((list) => ({ [list.key]: { isEmpty: false } })),
      },
      include: {
        user: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    const result = logs.flatMap((log) =>
      lists.flatMap((list) =>
        log[list.key].map((link) => ({
          userId: log.userId,
          userName: log.user.name,
          date: log.date,
          link,
          kind: list.key,
        }))
      )
    );

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching links:", error);
    return { success: false, error: "No se pudieron cargar los enlaces" };
  }
}

export async function getUserForActivityLog(userId: string) {
  try {
    const team = await requireAdmin();
    const user = await prisma.user.findFirst({
      where: { id: userId, team },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "No se pudo cargar el usuario" };
  }
}

export async function getAllUsers() {
  try {
    const team = await requireAdmin();
    const users = await prisma.user.findMany({
      where: { team },
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
    const team = await requireAdmin();
    const { count } = await prisma.user.deleteMany({
      where: { id: userId, team },
    });
    if (count === 0) {
      return { success: false, error: "Usuario no encontrado" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "No se pudo eliminar el usuario" };
  }
}

export async function updateUserPhone(userId: string, newPhone: string) {
  try {
    const team = await requireAdmin();
    const cleanPhone = newPhone.trim();
    if (!cleanPhone) {
      return { success: false, error: "El número no puede estar vacío" };
    }

    const user = await prisma.user.findFirst({ where: { id: userId, team } });
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
    const team = await requireAdmin();
    const history = await prisma.phoneChange.findMany({
      where: { userId, user: { team } },
      orderBy: { changedAt: "desc" },
    });

    return { success: true, data: history };
  } catch (error) {
    console.error("Error fetching phone history:", error);
    return { success: false, error: "No se pudo cargar el historial de números" };
  }
}

// Public list shown on the member login screen: only id and name
export async function getUserDirectory(team: TeamId = "TEAM1") {
  try {
    if (!isTeamId(team)) return { success: false, error: "Equipo no válido" };
    const users = await prisma.user.findMany({
      where: { role: "USER", team },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching user directory:", error);
    return { success: false, error: "No se pudieron cargar los usuarios" };
  }
}

// Bulk-creates members of the admin's team from a pasted list. Each gets a
// random password nobody knows until "Enviar accesos" (or the admin) sets
// one. Names already used by anyone (in any team) are skipped so two people
// never share a Drive folder.
export async function importUsers(rows: { name: string; phone: string }[]) {
  try {
    const team = await requireAdmin();
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: "La lista está vacía" };
    }
    if (rows.length > 1000) {
      return { success: false, error: "Máximo 1000 personas por importación" };
    }

    const existing = await prisma.user.findMany({ select: { name: true } });
    const taken = new Set(existing.map((u) => nameKey(u.name)));

    const created: string[] = [];
    const skipped: { name: string; reason: string }[] = [];

    for (const row of rows) {
      const name = cleanName(String(row.name || ""));
      const phone = cleanPhone(String(row.phone || ""));
      if (!name) {
        skipped.push({ name: "(sin nombre)", reason: "Sin nombre" });
        continue;
      }
      if (taken.has(nameKey(name))) {
        skipped.push({ name, reason: "Ya existe un usuario con ese nombre" });
        continue;
      }

      await prisma.user.create({
        data: {
          name,
          email: null,
          password: await hash(randomBytes(24).toString("hex"), 10),
          role: "USER",
          team,
          phone: phone || null,
          ...(phone && {
            phoneChanges: { create: { oldPhone: null, newPhone: phone } },
          }),
        },
      });
      taken.add(nameKey(name));
      created.push(name);
    }

    return { success: true, created, skipped };
  } catch (error) {
    console.error("Error importing users:", error);
    return { success: false, error: "No se pudo completar la importación" };
  }
}
