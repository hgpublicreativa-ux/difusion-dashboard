import { NextRequest, NextResponse } from "next/server";
import { createUserFolderStructure, uploadFileToFolder } from "@/lib/drive";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const userId = formData.get("userId") as string;
    const userName = formData.get("userName") as string;
    const campaignName = formData.get("campaignName") as string;
    const date = formData.get("date") as string;

    if (!userId || !userName || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse form fields for metrics
    const whatsappGroupsReached = parseInt(
      formData.get("whatsappGroupsReached") as string || "0"
    );
    const whatsappMessagesPerGroup = parseInt(
      formData.get("whatsappMessagesPerGroup") as string || "0"
    );
    const fbOwnPostsCreated = parseInt(
      formData.get("fbOwnPostsCreated") as string || "0"
    );
    const fbCommentsMade = parseInt(
      formData.get("fbCommentsMade") as string || "0"
    );
    const fbGroupsShared = parseInt(
      formData.get("fbGroupsShared") as string || "0"
    );
    const fbNewGroupsJoined = parseInt(
      formData.get("fbNewGroupsJoined") as string || "0"
    );

    // Parse Facebook post links
    const fbPostLinks = formData.getAll("fbOwnPostsLinks").filter(
      (link) => link !== ""
    ) as string[];

    const newObservations = ((formData.get("observations") as string) || "").trim();

    // Create folder structure in Drive
    const { drive, folderUrl, userFolderUrl, whatsappFolderId, facebookFolderId } =
      await createUserFolderStructure(userName, date);

    // Get all files from the form
    const files = formData.getAll("files") as File[];
    const whatsappFiles = formData.getAll("whatsappFiles") as File[];
    const facebookFiles = formData.getAll("facebookFiles") as File[];

    // Upload files to respective folders
    let uploadedCount = 0;

    // Upload WhatsApp files
    for (const file of whatsappFiles) {
      if (file.size > 0) {
        await uploadFileToFolder(drive, whatsappFolderId, file);
        uploadedCount++;
      }
    }

    // Upload Facebook files
    for (const file of facebookFiles) {
      if (file.size > 0) {
        await uploadFileToFolder(drive, facebookFolderId, file);
        uploadedCount++;
      }
    }

    // Upload generic files (for backward compatibility)
    for (const file of files) {
      if (file.size > 0 && !whatsappFiles.includes(file) && !facebookFiles.includes(file)) {
        // Determine folder based on file name or upload to whatsapp by default
        await uploadFileToFolder(drive, whatsappFolderId, file);
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
    const activityLog = await prisma.activityLog.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: {
        whatsappGroupsReached: { increment: whatsappGroupsReached },
        whatsappMessagesPerGroup: { increment: whatsappMessagesPerGroup },
        fbOwnPostsCreated: { increment: fbOwnPostsCreated },
        fbOwnPostsLinks: { push: fbPostLinks },
        fbCommentsMade: { increment: fbCommentsMade },
        fbGroupsShared: { increment: fbGroupsShared },
        fbNewGroupsJoined: { increment: fbNewGroupsJoined },
        driveEvidenceFolderUrl: folderUrl,
        observations: mergedObservations,
      },
      create: {
        userId,
        campaignName,
        date: normalizedDate,
        whatsappGroupsReached,
        whatsappMessagesPerGroup,
        fbOwnPostsCreated,
        fbOwnPostsLinks: fbPostLinks,
        fbCommentsMade,
        fbGroupsShared,
        fbNewGroupsJoined,
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
        message: `Activity logged successfully. ${uploadedCount} files uploaded.`,
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
          error instanceof Error ? error.message : "Failed to process upload",
      },
      { status: 500 }
    );
  }
}
