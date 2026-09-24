import { google } from "googleapis";
import { Readable } from "stream";

// Initialize Google Drive client
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

export async function findOrCreateFolder(
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

    // Try to make the file publicly readable. Some Google Workspace
    // organizations block external sharing via policy — if that happens,
    // the file is still uploaded successfully, so don't fail the whole
    // upload over it.
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (permissionError) {
      console.warn(
        `Could not make file publicly readable (org policy may block this): ${file.name}`,
        permissionError
      );
    }

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
  folderUrl: string;
  whatsappFolderId: string;
  facebookFolderId: string;
}> {
  try {
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!mainFolderId) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID not configured");
    }

    // Create or get user folder
    const userFolderId = await findOrCreateFolder(mainFolderId, userName);

    // Create or get date folder (formatted as DD-MM-YYYY)
    const folderDateName = formatDateForFolder(date);
    const dateFolderId = await findOrCreateFolder(userFolderId, folderDateName);

    // Create or get WhatsApp evidence folder
    const whatsappFolderId = await findOrCreateFolder(dateFolderId, "EVIDENCIA_WHATSAPP");

    // Create or get Facebook evidence folder
    const facebookFolderId = await findOrCreateFolder(dateFolderId, "EVIDENCIA_FACEBOOK");

    const folderUrl = await getFolderLink(dateFolderId);

    return { folderUrl, whatsappFolderId, facebookFolderId };
  } catch (error) {
    console.error("Error creating user folder structure:", error);
    throw error;
  }
}
