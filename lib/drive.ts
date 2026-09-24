import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";
import { prisma } from "./db";

async function getDriveClient(): Promise<drive_v3.Drive> {
  const tokenRecord = await prisma.googleAuthToken.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!tokenRecord) {
    throw new Error(
      "Google Drive not authorized yet. Visit /api/auth/google to connect a Google account."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: tokenRecord.refreshToken,
  });

  // Keep the stored access token fresh so we don't re-request one on every call.
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.googleAuthToken.update({
        where: { id: tokenRecord.id },
        data: {
          accessToken: tokens.access_token,
          expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
        },
      }).catch((err) => console.error("Failed to persist refreshed token:", err));
    }
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function findOrCreateFolder(
  drive: drive_v3.Drive,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  try {
    // Search for existing folder
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
      spaces: "drive",
      pageSize: 1,
      fields: "files(id, name)",
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create folder if it doesn't exist
    const createResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      },
      fields: "id",
    });

    return createResponse.data.id!;
  } catch (error) {
    console.error("Error in findOrCreateFolder:", error);
    throw new Error(`Failed to find or create folder: ${folderName}`);
  }
}

export async function uploadFileToFolder(
  drive: drive_v3.Drive,
  folderId: string,
  file: File
): Promise<string> {
  let fileId: string | undefined;

  try {
    const fileBuffer = await file.arrayBuffer();
    const fileStream = Readable.from(Buffer.from(fileBuffer));

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: fileStream,
      },
      fields: "id, webViewLink",
    });

    fileId = response.data.id!;

    return response.data.webViewLink || `https://drive.google.com/file/d/${fileId}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${file.name}`);
  }
}

export async function getFolderLink(folderId: string): Promise<string> {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

function formatDateForFolder(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

export async function createUserFolderStructure(
  userName: string,
  date: string
): Promise<{
  drive: drive_v3.Drive;
  folderUrl: string;
  whatsappFolderId: string;
  facebookFolderId: string;
}> {
  try {
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!mainFolderId) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID not configured");
    }

    const drive = await getDriveClient();

    // Create or get user folder
    const userFolderId = await findOrCreateFolder(drive, mainFolderId, userName);

    // Create or get date folder (formatted as DD-MM-YYYY)
    const folderDateName = formatDateForFolder(date);
    const dateFolderId = await findOrCreateFolder(drive, userFolderId, folderDateName);

    // Create or get WhatsApp evidence folder
    const whatsappFolderId = await findOrCreateFolder(drive, dateFolderId, "EVIDENCIA_WHATSAPP");

    // Create or get Facebook evidence folder
    const facebookFolderId = await findOrCreateFolder(drive, dateFolderId, "EVIDENCIA_FACEBOOK");

    const folderUrl = await getFolderLink(dateFolderId);

    return { drive, folderUrl, whatsappFolderId, facebookFolderId };
  } catch (error) {
    console.error("Error creating user folder structure:", error);
    throw error;
  }
}
