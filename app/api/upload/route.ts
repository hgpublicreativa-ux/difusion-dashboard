import { NextRequest, NextResponse } from "next/server";
import { createUserFolderStructure, uploadFileToFolder } from "@/lib/drive";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { TEAMS, LinkKey, MetricKey } from "@/lib/teams";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const userId = formData.get("userId") as string;
    const userName = formData.get("userName") as string;
    const campaignName = formData.get("campaignName") as string;
    const date = formData.get("date") as string;

    if (!userId || !userName || !date) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Members can only submit activity for themselves
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (session?.role !== "USER" || session.userId !== userId) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a ingresar con tu clave." },
        { status: 401 }
      );
    }

    // The member's team decides which evidence sections exist
    const member = await prisma.user.findUnique({
      where: { id: userId },
      select: { team: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const evidenceSections = TEAMS[member.team].evidence;

    // Metrics and links this team's form sends; anything else is ignored
    const teamConfig = TEAMS[member.team];

    const links: Partial<Record<LinkKey, string[]>> = {};
    for (const list of teamConfig.linkLists) {
      links[list.key] = (formData.getAll(list.key) as string[])
        .map((l) => l.trim())
        .filter((l) => l !== "");
    }

    const metrics: Partial<Record<MetricKey, number>> = {};
    for (const metric of teamConfig.metrics) {
      if (metric.derivedFromLinks) {
        // e.g. "cuentas comentadas" = number of links sent
        metrics[metric.key] = links[metric.derivedFromLinks]?.length ?? 0;
      } else {
        const value = parseInt((formData.get(metric.key) as string) || "0");
        metrics[metric.key] = Number.isFinite(value) && value > 0 ? value : 0;
      }
    }

    const newObservations = ((formData.get("observations") as string) || "").trim();

    // Create folder structure in Drive
    const { drive, folderUrl, userFolderUrl, evidenceFolderIds } =
      await createUserFolderStructure(
        userName,
        date,
        evidenceSections.map((s) => s.driveFolder)
      );

    // Upload each section's files to its own evidence folder
    let uploadedCount = 0;
    for (const section of evidenceSections) {
      const sectionFiles = formData.getAll(section.field) as File[];
      for (const file of sectionFiles) {
        if (file.size > 0) {
          await uploadFileToFolder(drive, evidenceFolderIds[section.driveFolder], file);
          uploadedCount++;
        }
      }
    }

    // Generic "files" field (backward compatibility): first section's folder
    for (const file of formData.getAll("files") as File[]) {
      if (file.size > 0) {
        await uploadFileToFolder(
          drive,
          evidenceFolderIds[evidenceSections[0].driveFolder],
          file
        );
        uploadedCount++;
      }
    }

    // Normalize to midnight so multiple submits on the same calendar day
    // always match the same row (date input is already YYYY-MM-DD).
    const normalizedDate = new Date(`${date}T00:00:00.000Z`);

    // If this user already reported today, merge the new note into the
    // existing one instead of overwriting it.
    const existingLog = await prisma.activityLog.findUnique({
      where: { userId_date: { userId, date: normalizedDate } },
      select: { observations: true },
    });
    const mergedObservations = newObservations
      ? existingLog?.observations
        ? `${existingLog.observations}\n${newObservations}`
        : newObservations
      : existingLog?.observations || null;

    // Upsert: if this user already reported something today, accumulate
    // into that row instead of creating a duplicate for the same day.
    const incrementData: Prisma.ActivityLogUpdateInput = {};
    const createData: Record<string, number | string[]> = {};
    for (const [key, value] of Object.entries(metrics)) {
      (incrementData as Record<string, unknown>)[key] = { increment: value };
      createData[key] = value;
    }
    for (const [key, list] of Object.entries(links)) {
      (incrementData as Record<string, unknown>)[key] = { push: list };
      createData[key] = list;
    }

    const activityLog = await prisma.activityLog.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: {
        ...incrementData,
        driveEvidenceFolderUrl: folderUrl,
        observations: mergedObservations,
      },
      create: {
        ...createData,
        userId,
        campaignName,
        date: normalizedDate,
        driveEvidenceFolderUrl: folderUrl,
        observations: newObservations || null,
      },
    });

    // Keep the user's root Drive folder link up to date
    await prisma.user.update({
      where: { id: userId },
      data: { driveFolderUrl: userFolderUrl },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Se subieron ${uploadedCount} archivo(s)`,
        folderUrl,
        activityLog,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo procesar el envío",
      },
      { status: 500 }
    );
  }
}
