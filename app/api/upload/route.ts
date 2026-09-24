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

    // Create folder structure in Drive
    const { folderUrl, folderId } = await createUserFolderStructure(
      userName,
      date
    );

    // Get all files from the form
    const files = formData.getAll("files") as File[];

    // Upload files
    let uploadedCount = 0;
    for (const file of files) {
      if (file.size > 0) {
        await uploadFileToFolder(folderId, file);
        uploadedCount++;
      }
    }

    // Save activity log to database
    const activityLog = await prisma.activityLog.create({
      data: {
        userId,
        campaignName,
        date: new Date(date),
        whatsappGroupsReached,
        whatsappMessagesPerGroup,
        fbOwnPostsCreated,
        fbOwnPostsLinks: fbPostLinks,
        fbCommentsMade,
        fbGroupsShared,
        fbNewGroupsJoined,
        driveEvidenceFolderUrl: folderUrl,
      },
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
