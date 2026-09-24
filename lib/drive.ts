import { google } from "googleapis";

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
  try {
    const fileBuffer = await file.arrayBuffer();

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: Buffer.from(fileBuffer),
      },
      fields: "id, webViewLink",
    });

    // Make file publicly readable (optional, based on your needs)
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${file.name}`);
  }
}

export async function getFolderLink(folderId: string): Promise<string> {
  return `https://drive.google.com/drive/folders/${folderId}`;
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

    // Create or get date folder
    const dateFolderId = await findOrCreateFolder(userFolderId, date);

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
