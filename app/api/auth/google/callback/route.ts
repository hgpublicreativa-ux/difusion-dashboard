import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.json({ error: `Google returned: ${error}` }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          error:
            "No refresh token returned. Revoke access at https://myaccount.google.com/permissions and try again (Google only sends a refresh token on first consent).",
        },
        { status: 400 }
      );
    }

    oauth2Client.setCredentials(tokens);

    // Decode the email out of the id_token's payload locally instead of
    // making a separate userinfo API call (which was failing with a 401).
    let accountEmail = "unknown";
    if (tokens.id_token) {
      try {
        const payloadBase64 = tokens.id_token.split(".")[1];
        const payload = JSON.parse(
          Buffer.from(payloadBase64, "base64url").toString("utf-8")
        );
        accountEmail = payload.email || "unknown";
      } catch (decodeError) {
        console.warn("Could not decode id_token payload:", decodeError);
      }
    }

    await prisma.googleAuthToken.upsert({
      where: { accountEmail },
      update: {
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token || null,
        expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
      },
      create: {
        accountEmail,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token || null,
        expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
      },
    });

    return new NextResponse(
      `<html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h1 style="color:#16a34a">✅ Google Drive conectado</h1>
        <p>Cuenta autorizada: <strong>${accountEmail}</strong></p>
        <p>Ya puedes cerrar esta ventana y volver a usar la app.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OAuth callback failed" },
      { status: 500 }
    );
  }
}
