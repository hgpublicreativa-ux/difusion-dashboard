// Team configuration shared by pages, components, middleware and API.
// Keep this file free of server-only imports: it runs on the client and
// in the edge middleware too.

import { METRIC_LABELS, COMMENT_LINKS_LABEL } from "./labels";

export type TeamId = "TEAM1" | "TEAM2";

// Numeric ActivityLog columns that can be summed in the dashboard
export const ALL_METRIC_KEYS = [
  "whatsappGroupsReached",
  "whatsappMessagesPerGroup",
  "whatsappPeopleReached",
  "fbOwnPostsCreated",
  "fbCommentsMade",
  "fbGroupsShared",
  "fbNewGroupsJoined",
  "fbPeopleMessaged",
  "tiktokCommentsMade",
  "tiktokAccountsCommented",
] as const;
export type MetricKey = (typeof ALL_METRIC_KEYS)[number];

// String[] ActivityLog columns holding links
export const ALL_LINK_KEYS = ["fbOwnPostsLinks", "fbCommentLinks", "tiktokCommentLinks"] as const;
export type LinkKey = (typeof ALL_LINK_KEYS)[number];

export type MetricColor = "blue" | "green" | "teal" | "indigo" | "purple" | "pink" | "amber";

export interface MetricDef {
  key: MetricKey;
  label: string; // form field, table column and PDF label
  cardLabel: string; // summary card title
  unit: string; // small text under the card number
  icon: string;
  color: MetricColor;
  highlight?: boolean; // green number in the per-user table
  // Not typed by the member: always equals the number of links in this list
  derivedFromLinks?: LinkKey;
}

export interface LinkListDef {
  key: LinkKey;
  title: string; // heading in the links viewer
  icon: string;
  summaryLabel: string; // "3 post(s) comentado(s)"
  pdfLabel: string; // "Tipo" column in the PDF
  placeholder: string;
  badgeClass: string;
  // Metric whose increase (in the admin edit modal) asks for extra links
  countMetric?: MetricKey;
}

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
  metrics: MetricDef[];
  linkLists: LinkListDef[];
  linksTitle: string; // dashboard section showing this team's links
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
    metrics: [
      { key: "whatsappGroupsReached", label: METRIC_LABELS.whatsappGroupsReached, cardLabel: "Total de grupos a los que se enviaron mensajes", unit: "grupos de WhatsApp", icon: "📱", color: "blue" },
      { key: "whatsappMessagesPerGroup", label: METRIC_LABELS.whatsappMessagesPerGroup, cardLabel: "Cantidad total de mensajes enviados durante el período de reporte", unit: "mensajes a grupos de WhatsApp", icon: "💬", color: "green", highlight: true },
      { key: "whatsappPeopleReached", label: METRIC_LABELS.whatsappPeopleReached, cardLabel: "Total de personas individuales a las que se enviaron mensajes de WhatsApp (no grupos)", unit: "personas por WhatsApp", icon: "👥", color: "teal" },
      { key: "fbOwnPostsCreated", label: METRIC_LABELS.fbOwnPostsCreated, cardLabel: "Total de posts creados en las páginas asignadas", unit: "posts de Facebook", icon: "📝", color: "indigo" },
      { key: "fbCommentsMade", label: METRIC_LABELS.fbCommentsMade, cardLabel: "Total de comentarios realizados", unit: "comentarios de Facebook", icon: "💭", color: "purple" },
      { key: "fbGroupsShared", label: METRIC_LABELS.fbGroupsShared, cardLabel: "Cantidad de grupos en los que se compartió contenido", unit: "grupos de Facebook", icon: "🔗", color: "pink" },
      { key: "fbNewGroupsJoined", label: METRIC_LABELS.fbNewGroupsJoined, cardLabel: "Cantidad de grupos a los que se unieron", unit: "grupos nuevos de Facebook", icon: "✨", color: "amber" },
      { key: "fbPeopleMessaged", label: METRIC_LABELS.fbPeopleMessaged, cardLabel: "Total de personas individuales a las que se enviaron mensajes de Facebook directo (no grupos)", unit: "personas por Facebook", icon: "📩", color: "teal" },
    ],
    linkLists: [
      { key: "fbOwnPostsLinks", title: "Posts propios", icon: "📝", summaryLabel: "post(s) propio(s)", pdfLabel: "Post propio", placeholder: "https://facebook.com/...", badgeClass: "bg-indigo-100 text-indigo-800", countMetric: "fbOwnPostsCreated" },
      { key: "fbCommentLinks", title: COMMENT_LINKS_LABEL, icon: "💬", summaryLabel: "post(s) comentado(s)", pdfLabel: "Post en el que se comentó", placeholder: "https://facebook.com/...", badgeClass: "bg-purple-100 text-purple-800", countMetric: "fbCommentsMade" },
    ],
    linksTitle: "Enlaces de Facebook",
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
    metrics: [
      { key: "tiktokCommentsMade", label: "Cantidad de comentarios realizados en TikTok", cardLabel: "Total de comentarios realizados en TikTok", unit: "comentarios de TikTok", icon: "💬", color: "pink", highlight: true },
      { key: "tiktokAccountsCommented", label: "Publicaciones comentadas", cardLabel: "Total de publicaciones comentadas", unit: "publicaciones de TikTok (enlaces registrados)", icon: "👤", color: "purple", derivedFromLinks: "tiktokCommentLinks" },
    ],
    linkLists: [
      { key: "tiktokCommentLinks", title: "Enlaces de las publicaciones en las que se comentó", icon: "🎵", summaryLabel: "publicación(es) comentada(s)", pdfLabel: "Publicación comentada", placeholder: "https://www.tiktok.com/@cuenta/video/...", badgeClass: "bg-pink-100 text-pink-800", countMetric: "tiktokCommentsMade" },
    ],
    linksTitle: "Enlaces de TikTok",
  },
};

export function isTeamId(value: unknown): value is TeamId {
  return value === "TEAM1" || value === "TEAM2";
}

// Metrics the member types in (derived ones are computed from links)
export function inputMetrics(team: TeamId): MetricDef[] {
  return TEAMS[team].metrics.filter((m) => !m.derivedFromLinks);
}
