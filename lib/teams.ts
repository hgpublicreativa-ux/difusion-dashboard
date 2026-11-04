// Team configuration shared by pages, components, middleware and API.
// Keep this file free of server-only imports: it runs on the client and
// in the edge middleware too.

export type TeamId = "TEAM1" | "TEAM2";

export interface EvidenceSection {
  field: string; // form field name sent to /api/upload
  label: string;
  driveFolder: string; // subfolder created inside the user's date folder
  icon: string;
  // Full Tailwind class strings (kept literal so Tailwind picks them up)
  boxClass: string;
  labelClass: string;
  hintClass: string;
  badgeClass: string;
}

export interface TeamConfig {
  id: TeamId;
  label: string;
  tagline: string;
  memberPath: string;
  adminPath: string;
  adminLoginPath: string;
  adminUsersPath: string;
  evidence: EvidenceSection[];
}

export const TEAMS: Record<TeamId, TeamConfig> = {
  TEAM1: {
    id: "TEAM1",
    label: "Equipo 1",
    tagline: "WhatsApp y Facebook",
    memberPath: "/user",
    adminPath: "/admin",
    adminLoginPath: "/admin/login",
    adminUsersPath: "/admin/users",
    evidence: [
      {
        field: "whatsappFiles",
        label: "Evidencias WhatsApp (Capturas/Videos)",
        driveFolder: "EVIDENCIA_WHATSAPP",
        icon: "💬",
        boxClass:
          "bg-gradient-to-br from-green-50 to-teal-50 border-green-300 hover:border-green-500",
        labelClass: "text-green-900",
        hintClass: "text-green-800",
        badgeClass: "bg-green-100 text-green-900",
      },
      {
        field: "facebookFiles",
        label: "Evidencias Facebook (Capturas/Videos)",
        driveFolder: "EVIDENCIA_FACEBOOK",
        icon: "👍",
        boxClass:
          "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-500",
        labelClass: "text-blue-900",
        hintClass: "text-blue-800",
        badgeClass: "bg-blue-100 text-blue-900",
      },
    ],
  },
  TEAM2: {
    id: "TEAM2",
    label: "Equipo 2",
    tagline: "TikTok",
    memberPath: "/equipo-2",
    adminPath: "/equipo-2/admin",
    adminLoginPath: "/equipo-2/admin/login",
    adminUsersPath: "/equipo-2/admin/users",
    evidence: [
      {
        field: "tiktokFiles",
        label: "Evidencias TikTok (Capturas/Videos)",
        driveFolder: "EVIDENCIA_TIKTOK",
        icon: "🎵",
        boxClass:
          "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-300 hover:border-pink-500",
        labelClass: "text-pink-900",
        hintClass: "text-pink-800",
        badgeClass: "bg-pink-100 text-pink-900",
      },
    ],
  },
};

export function isTeamId(value: unknown): value is TeamId {
  return value === "TEAM1" || value === "TEAM2";
}
