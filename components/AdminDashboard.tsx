"use client";

import { useState, useEffect } from "react";
import {
  getAggregatedByUser,
  getFacebookLinksByDateRange,
  getActivityLogsByDateRange,
  getObservationsByUser,
  updateActivityLog,
} from "@/lib/actions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { METRIC_LABELS } from "@/lib/labels";
import { formatDay, formatDateTimeEc } from "@/lib/dates";

interface UserTotals {
  whatsappGroupsReached: number;
  whatsappMessagesPerGroup: number;
  whatsappPeopleReached: number;
  fbOwnPostsCreated: number;
  fbCommentsMade: number;
  fbGroupsShared: number;
  fbNewGroupsJoined: number;
}

interface AggregatedUser {
  user: {
    id: string;
    name: string;
    email: string;
    driveFolderUrl: string | null;
  };
  hasObservations: boolean;
  totals: UserTotals;
  todayTotals: UserTotals;
}

interface ObservationEntry {
  id: string;
  date: Date;
  observations: string | null;
}

interface EditFormState {
  whatsappGroupsReached: string;
  whatsappMessagesPerGroup: string;
  whatsappPeopleReached: string;
  fbOwnPostsCreated: string;
  fbCommentsMade: string;
  fbGroupsShared: string;
  fbNewGroupsJoined: string;
  observations: string;
}

interface FacebookLink {
  userId: string;
  userName: string;
  date: Date;
  link: string;
  kind: "post" | "comment";
}

interface DailyLog {
  id: string;
  date: Date;
  whatsappGroupsReached: number;
  whatsappMessagesPerGroup: number;
  whatsappPeopleReached: number;
  fbOwnPostsCreated: number;
  fbOwnPostsLinks: string[];
  fbCommentsMade: number;
  fbCommentLinks: string[];
  fbGroupsShared: number;
  fbNewGroupsJoined: number;
  driveEvidenceFolderUrl: string | null;
  observations: string | null;
  user: { id: string; name: string };
}

export default function AdminDashboard() {
  const [userAggregates, setUserAggregates] = useState<AggregatedUser[]>([]);
  const [facebookLinks, setFacebookLinks] = useState<FacebookLink[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Observations modal
  const [observationsUser, setObservationsUser] = useState<{ id: string; name: string } | null>(null);
  const [observationsData, setObservationsData] = useState<ObservationEntry[]>([]);
  const [loadingObservations, setLoadingObservations] = useState(false);

  // Facebook links per-user modal
  const [linksModalUser, setLinksModalUser] = useState<{ id: string; name: string } | null>(null);
  // Expanded days in the links accordion; null = default (most recent day open)
  const [openLinkDates, setOpenLinkDates] = useState<Set<string> | null>(null);

  // Daily history per-user modal; null dates = default (most recent day open)
  const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null);
  const [openHistoryDates, setOpenHistoryDates] = useState<Set<string> | null>(null);

  // Edit activity log modal
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormState>({
    whatsappGroupsReached: "",
    whatsappMessagesPerGroup: "",
    whatsappPeopleReached: "",
    fbOwnPostsCreated: "",
    fbCommentsMade: "",
    fbGroupsShared: "",
    fbNewGroupsJoined: "",
    observations: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [newPostLinks, setNewPostLinks] = useState<string[]>([]);
  const [newCommentLinks, setNewCommentLinks] = useState<string[]>([]);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;

      const userResult = await getAggregatedByUser(startDateObj, endDateObj);
      const linksResult = await getFacebookLinksByDateRange(
        startDateObj,
        endDateObj
      );
      const logsResult = await getActivityLogsByDateRange(
        startDateObj,
        endDateObj
      );

      if (userResult.success) {
        setUserAggregates(userResult.data as AggregatedUser[]);
      } else {
        setError(userResult.error || "No se pudieron cargar los datos de usuarios");
      }

      if (linksResult.success) {
        setFacebookLinks(linksResult.data as FacebookLink[]);
      } else {
        setError(linksResult.error || "No se pudieron cargar los enlaces de Facebook");
      }

      if (logsResult.success) {
        setDailyLogs(logsResult.data as unknown as DailyLog[]);
      } else {
        setError(logsResult.error || "No se pudo cargar el historial diario");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = () => {
    loadData();
  };

  const handleOpenObservations = async (userId: string, userName: string) => {
    setObservationsUser({ id: userId, name: userName });
    setLoadingObservations(true);
    try {
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;
      const result = await getObservationsByUser(userId, startDateObj, endDateObj);
      if (result.success) {
        setObservationsData(result.data as ObservationEntry[]);
      } else {
        setObservationsData([]);
      }
    } finally {
      setLoadingObservations(false);
    }
  };

  const handleOpenEditLog = (log: DailyLog) => {
    setEditingLog(log);
    setEditFormData({
      whatsappGroupsReached: String(log.whatsappGroupsReached),
      whatsappMessagesPerGroup: String(log.whatsappMessagesPerGroup),
      whatsappPeopleReached: String(log.whatsappPeopleReached),
      fbOwnPostsCreated: String(log.fbOwnPostsCreated),
      fbCommentsMade: String(log.fbCommentsMade),
      fbGroupsShared: String(log.fbGroupsShared),
      fbNewGroupsJoined: String(log.fbNewGroupsJoined),
      observations: log.observations || "",
    });
    setNewPostLinks([]);
    setNewCommentLinks([]);
  };

  // How many extra "new link" fields to show: only grows as fbOwnPostsCreated
  // increases past the log's original value, so existing posts aren't affected.
  const extraPostsCount = editingLog
    ? Math.max(
        0,
        (parseInt(editFormData.fbOwnPostsCreated) || 0) - editingLog.fbOwnPostsCreated
      )
    : 0;

  // Same idea for the posts the member commented on
  const extraCommentsCount = editingLog
    ? Math.max(
        0,
        (parseInt(editFormData.fbCommentsMade) || 0) - editingLog.fbCommentsMade
      )
    : 0;

  const handleNewCommentLinkChange = (index: number, value: string) => {
    setNewCommentLinks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleNewPostLinkChange = (index: number, value: string) => {
    setNewPostLinks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    setIsSavingEdit(true);
    setError("");
    try {
      const result = await updateActivityLog(editingLog.id, {
        whatsappGroupsReached: parseInt(editFormData.whatsappGroupsReached) || 0,
        whatsappMessagesPerGroup: parseInt(editFormData.whatsappMessagesPerGroup) || 0,
        whatsappPeopleReached: parseInt(editFormData.whatsappPeopleReached) || 0,
        fbOwnPostsCreated: parseInt(editFormData.fbOwnPostsCreated) || 0,
        fbCommentsMade: parseInt(editFormData.fbCommentsMade) || 0,
        fbGroupsShared: parseInt(editFormData.fbGroupsShared) || 0,
        fbNewGroupsJoined: parseInt(editFormData.fbNewGroupsJoined) || 0,
        observations: editFormData.observations.trim() || null,
        newPostLinks: newPostLinks.slice(0, extraPostsCount),
        newCommentLinks: newCommentLinks.slice(0, extraCommentsCount),
      });

      if (result.success) {
        setEditingLog(null);
        setNewPostLinks([]);
        setNewCommentLinks([]);
        await loadData();
      } else {
        setError(result.error || "No se pudo actualizar el registro");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("es-ES").format(num);
  };

  const formatDateEs = (isoDate: string): string => {
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  const MetricCell = ({
    today,
    total,
    highlight,
  }: {
    today: number;
    total: number;
    highlight?: boolean;
  }) => (
    <td className="px-3 sm:px-6 py-4 text-center">
      <p
        className={`font-semibold ${highlight ? "text-green-600" : "text-gray-800"}`}
      >
        {formatNumber(total)}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">Hoy: {formatNumber(today)}</p>
    </td>
  );

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    const rangeLabel =
      startDate && endDate
        ? `${formatDateEs(startDate)} - ${formatDateEs(endDate)}`
        : startDate
        ? `Desde ${formatDateEs(startDate)}`
        : endDate
        ? `Hasta ${formatDateEs(endDate)}`
        : "Histórico completo";

    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text("Difusión Dashboard - Reporte", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Rango de fechas: ${rangeLabel}`, 14, 26);
    doc.text(
      `Generado: ${formatDateTimeEc(new Date())} (hora de Ecuador)`,
      14,
      32
    );

    const totalGroups = userAggregates.reduce(
      (sum, u) => sum + u.totals.whatsappGroupsReached,
      0
    );
    const totalMessages = userAggregates.reduce(
      (sum, u) => sum + u.totals.whatsappMessagesPerGroup,
      0
    );
    const totalPeople = userAggregates.reduce(
      (sum, u) => sum + u.totals.whatsappPeopleReached,
      0
    );
    const totalFbPosts = userAggregates.reduce(
      (sum, u) => sum + u.totals.fbOwnPostsCreated,
      0
    );
    const totalFbComments = userAggregates.reduce(
      (sum, u) => sum + u.totals.fbCommentsMade,
      0
    );
    const totalFbGroupsShared = userAggregates.reduce(
      (sum, u) => sum + u.totals.fbGroupsShared,
      0
    );
    const totalFbNewGroups = userAggregates.reduce(
      (sum, u) => sum + u.totals.fbNewGroupsJoined,
      0
    );

    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(
      `WA Grupos: ${formatNumber(totalGroups)}   |   WA Mensajes: ${formatNumber(totalMessages)}   |   WA Personas: ${formatNumber(totalPeople)}   |   FB Posts: ${formatNumber(totalFbPosts)}`,
      14,
      40
    );
    doc.text(
      `FB Comentarios: ${formatNumber(totalFbComments)}   |   FB Grupos Compartidos: ${formatNumber(totalFbGroupsShared)}   |   FB Grupos Nuevos: ${formatNumber(totalFbNewGroups)}`,
      14,
      46
    );

    autoTable(doc, {
      startY: 52,
      head: [
        [
          "Usuario",
          "WA Grupos",
          "WA Mensajes",
          "WA Personas",
          "FB Posts",
          "FB Comentarios",
          "FB Grupos Comp.",
          "FB Grupos Nuevos",
        ],
      ],
      body: userAggregates.map((u) => [
        u.user.name,
        `${formatNumber(u.totals.whatsappGroupsReached)} (hoy: ${formatNumber(u.todayTotals.whatsappGroupsReached)})`,
        `${formatNumber(u.totals.whatsappMessagesPerGroup)} (hoy: ${formatNumber(u.todayTotals.whatsappMessagesPerGroup)})`,
        `${formatNumber(u.totals.whatsappPeopleReached)} (hoy: ${formatNumber(u.todayTotals.whatsappPeopleReached)})`,
        `${formatNumber(u.totals.fbOwnPostsCreated)} (hoy: ${formatNumber(u.todayTotals.fbOwnPostsCreated)})`,
        `${formatNumber(u.totals.fbCommentsMade)} (hoy: ${formatNumber(u.todayTotals.fbCommentsMade)})`,
        `${formatNumber(u.totals.fbGroupsShared)} (hoy: ${formatNumber(u.todayTotals.fbGroupsShared)})`,
        `${formatNumber(u.totals.fbNewGroupsJoined)} (hoy: ${formatNumber(u.todayTotals.fbNewGroupsJoined)})`,
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    const afterUserTableY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY || 46;

    if (facebookLinks.length > 0) {
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text("Enlaces de Facebook (posts propios y comentados)", 14, afterUserTableY + 12);

      autoTable(doc, {
        startY: afterUserTableY + 16,
        head: [["Usuario", "Fecha", "Tipo", "Enlace"]],
        body: facebookLinks.map((l) => [
          l.userName,
          formatDay(l.date),
          l.kind === "post" ? "Post propio" : "Comentado",
          l.link,
        ]),
        headStyles: { fillColor: [147, 51, 234] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
    }

    const fileDateLabel =
      startDate || endDate
        ? `${startDate || "inicio"}_a_${endDate || "hoy"}`
        : "historico";

    doc.save(`difusion-dashboard-${fileDateLabel}.pdf`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="flex items-center gap-3 mb-2 sm:mb-8">
        <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-2xl">📊</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard Administrativo
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Date Filter Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span>📅</span> Filtrar por Rango de Fechas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilter}
              disabled={isLoading}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-md hover:shadow-lg"
            >
              {isLoading ? "⏳ Cargando..." : "🔍 Filtrar"}
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleDownloadPDF}
              disabled={isLoading || userAggregates.length === 0}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-md hover:shadow-lg"
            >
              📄 Descargar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {userAggregates.length > 0 && (() => {
        const totals = userAggregates.reduce(
          (acc, user) => ({
            groups: acc.groups + user.totals.whatsappGroupsReached,
            messages: acc.messages + user.totals.whatsappMessagesPerGroup,
            people: acc.people + user.totals.whatsappPeopleReached,
            fbPosts: acc.fbPosts + user.totals.fbOwnPostsCreated,
            fbComments: acc.fbComments + user.totals.fbCommentsMade,
            fbGroupsShared: acc.fbGroupsShared + user.totals.fbGroupsShared,
            fbNewGroups: acc.fbNewGroups + user.totals.fbNewGroupsJoined,
          }),
          {
            groups: 0,
            messages: 0,
            people: 0,
            fbPosts: 0,
            fbComments: 0,
            fbGroupsShared: 0,
            fbNewGroups: 0,
          }
        );

        const cards = [
          {
            icon: "📱",
            label: "Total de grupos a los que se enviaron mensajes",
            value: totals.groups,
            unit: "grupos de WhatsApp",
            color: "blue",
          },
          {
            icon: "💬",
            label: "Total de mensajes enviados durante el período de reporte",
            value: totals.messages,
            unit: "mensajes a grupos de WhatsApp",
            color: "green",
          },
          {
            icon: "👥",
            label: "Total de personas individuales a las que se enviaron mensajes de WhatsApp",
            value: totals.people,
            unit: "personas por WhatsApp",
            color: "teal",
          },
          {
            icon: "📝",
            label: "Total de posts creados en las páginas asignadas",
            value: totals.fbPosts,
            unit: "posts de Facebook",
            color: "indigo",
          },
          {
            icon: "💭",
            label: "Total de comentarios contestados realizados",
            value: totals.fbComments,
            unit: "comentarios de Facebook",
            color: "purple",
          },
          {
            icon: "🔗",
            label: "Cantidad de grupos en los que se compartió contenido",
            value: totals.fbGroupsShared,
            unit: "grupos de Facebook",
            color: "pink",
          },
          {
            icon: "✨",
            label: "Cantidad de grupos a los que se unieron",
            value: totals.fbNewGroups,
            unit: "grupos nuevos de Facebook",
            color: "amber",
          },
        ];

        const colorClasses: Record<
          string,
          { bg: string; border: string; title: string; value: string; unit: string }
        > = {
          blue: {
            bg: "from-blue-50 to-blue-100",
            border: "border-blue-600",
            title: "text-blue-900",
            value: "text-blue-600",
            unit: "text-blue-700",
          },
          green: {
            bg: "from-green-50 to-emerald-100",
            border: "border-green-600",
            title: "text-green-900",
            value: "text-green-600",
            unit: "text-green-700",
          },
          indigo: {
            bg: "from-indigo-50 to-indigo-100",
            border: "border-indigo-600",
            title: "text-indigo-900",
            value: "text-indigo-600",
            unit: "text-indigo-700",
          },
          purple: {
            bg: "from-purple-50 to-purple-100",
            border: "border-purple-600",
            title: "text-purple-900",
            value: "text-purple-600",
            unit: "text-purple-700",
          },
          pink: {
            bg: "from-pink-50 to-pink-100",
            border: "border-pink-600",
            title: "text-pink-900",
            value: "text-pink-600",
            unit: "text-pink-700",
          },
          teal: {
            bg: "from-teal-50 to-teal-100",
            border: "border-teal-600",
            title: "text-teal-900",
            value: "text-teal-600",
            unit: "text-teal-700",
          },
          amber: {
            bg: "from-amber-50 to-amber-100",
            border: "border-amber-600",
            title: "text-amber-900",
            value: "text-amber-600",
            unit: "text-amber-700",
          },
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((card) => {
              const c = colorClasses[card.color];
              return (
                <div
                  key={card.label}
                  className={`bg-gradient-to-br ${c.bg} rounded-xl shadow-lg p-6 border-l-4 ${c.border}`}
                >
                  <h3
                    className={`text-sm font-bold ${c.title} uppercase tracking-wide mb-2`}
                  >
                    {card.icon} {card.label}
                  </h3>
                  <p className={`text-4xl font-bold ${c.value}`}>
                    {formatNumber(card.value)}
                  </p>
                  <p className={`text-sm ${c.unit} mt-2`}>{card.unit}</p>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Table 1: By User */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-3 sm:px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>👥</span> Totales por Usuario
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700">
                  Usuario
                </th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">
                  WA Grupos
                </th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">
                  WA Mensajes Enviados
                </th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">
                  WA Personas Alcanzadas
                </th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">
                  FB Posts
                </th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">
                  FB Comentarios
                </th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">
                  FB Grupos Comp.
                </th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">
                  FB Grupos Nuevos
                </th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">
                  Drive
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {userAggregates.length > 0 ? (
                userAggregates.map((user) => {
                  return (
                    <tr key={user.user.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{user.user.name}</span>
                          <button
                            onClick={() => handleOpenObservations(user.user.id, user.user.name)}
                            title={user.hasObservations ? "Ver observaciones" : "Sin observaciones"}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors ${
                              user.hasObservations
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                            }`}
                          >
                            📝
                          </button>
                        </div>
                      </td>
                      <MetricCell
                        today={user.todayTotals.whatsappGroupsReached}
                        total={user.totals.whatsappGroupsReached}
                      />
                      <MetricCell
                        today={user.todayTotals.whatsappMessagesPerGroup}
                        total={user.totals.whatsappMessagesPerGroup}
                        highlight
                      />
                      <MetricCell
                        today={user.todayTotals.whatsappPeopleReached}
                        total={user.totals.whatsappPeopleReached}
                      />
                      <MetricCell
                        today={user.todayTotals.fbOwnPostsCreated}
                        total={user.totals.fbOwnPostsCreated}
                      />
                      <MetricCell
                        today={user.todayTotals.fbCommentsMade}
                        total={user.totals.fbCommentsMade}
                      />
                      <MetricCell
                        today={user.todayTotals.fbGroupsShared}
                        total={user.totals.fbGroupsShared}
                      />
                      <MetricCell
                        today={user.todayTotals.fbNewGroupsJoined}
                        total={user.totals.fbNewGroupsJoined}
                      />
                      <td className="px-3 sm:px-6 py-4 text-center">
                        {user.user.driveFolderUrl ? (
                          <a
                            href={user.user.driveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600"
                          >
                            📁 Ver
                          </a>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-400 text-xs font-semibold rounded">
                            Sin evidencias
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                    No hay datos para el rango de fechas seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily History: one row per user; details open in a modal grouped by date */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-3 sm:px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>📆</span> Historial Diario
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Un registro por usuario. Abre el detalle para ver cada día reportado.
          </p>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700">Usuario</th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">Días reportados</th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">Último reporte</th>
                <th className="px-3 sm:px-6 py-3 text-center font-semibold text-gray-700">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(() => {
                // dailyLogs arrive newest first, so the first log per user is the latest
                const byUser = new Map<string, { id: string; name: string; logs: DailyLog[] }>();
                dailyLogs.forEach((log) => {
                  const entry = byUser.get(log.user.id) || { ...log.user, logs: [] };
                  entry.logs.push(log);
                  byUser.set(log.user.id, entry);
                });

                if (byUser.size === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                        No hay registros para el rango de fechas seleccionado
                      </td>
                    </tr>
                  );
                }

                return Array.from(byUser.values()).map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-3 sm:px-6 py-3 text-center text-gray-700">{u.logs.length}</td>
                    <td className="px-3 sm:px-6 py-3 text-center text-gray-700 whitespace-nowrap">
                      {formatDay(u.logs[0].date)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-center">
                      <button
                        onClick={() => {
                          setHistoryUser({ id: u.id, name: u.name });
                          setOpenHistoryDates(null);
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 whitespace-nowrap"
                      >
                        📋 Ver detalle
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-user Daily History Modal (accordion by date) */}
      {historyUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-100">
            <div className="px-3 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>📆</span> Historial de {historyUser.name}
              </h3>
              <button
                onClick={() => setHistoryUser(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 space-y-3">
              {(() => {
                const logs = dailyLogs.filter((l) => l.user.id === historyUser.id);
                if (logs.length === 0) {
                  return <p className="text-sm text-gray-400">Sin registros</p>;
                }

                // Until the admin toggles something, only the most recent day is open
                const openDates = openHistoryDates ?? new Set([logs[0].id]);

                return logs.map((log) => {
                  const isOpen = openDates.has(log.id);
                  const rows: { label: string; value: number }[] = [
                    { label: METRIC_LABELS.whatsappGroupsReached, value: log.whatsappGroupsReached },
                    { label: METRIC_LABELS.whatsappMessagesPerGroup, value: log.whatsappMessagesPerGroup },
                    { label: METRIC_LABELS.whatsappPeopleReached, value: log.whatsappPeopleReached },
                    { label: METRIC_LABELS.fbOwnPostsCreated, value: log.fbOwnPostsCreated },
                    { label: METRIC_LABELS.fbCommentsMade, value: log.fbCommentsMade },
                    { label: METRIC_LABELS.fbGroupsShared, value: log.fbGroupsShared },
                    { label: METRIC_LABELS.fbNewGroupsJoined, value: log.fbNewGroupsJoined },
                  ];

                  return (
                    <div key={log.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => {
                          const next = new Set(openDates);
                          if (isOpen) next.delete(log.id);
                          else next.add(log.id);
                          setOpenHistoryDates(next);
                        }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                      >
                        <span className="font-semibold text-gray-900">📅 {formatDay(log.date)}</span>
                        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                      </button>

                      {isOpen && (
                        <div className="p-4 space-y-4">
                          <dl className="divide-y divide-gray-100">
                            {rows.map((r) => (
                              <div key={r.label} className="flex items-start justify-between gap-4 py-2">
                                <dt className="text-sm text-gray-600">{r.label}</dt>
                                <dd className="text-sm font-semibold text-gray-900 tabular-nums">
                                  {formatNumber(r.value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                          {log.observations && (
                            <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 whitespace-pre-wrap">
                              📝 {log.observations}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {log.driveEvidenceFolderUrl && (
                              <a
                                href={log.driveEvidenceFolderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600"
                              >
                                📁 Ver evidencias
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEditLog(log)}
                              className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded hover:bg-amber-600"
                            >
                              ✏️ Editar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Facebook Links: per-user list, each with its own "Ver Enlaces" button */}
      {(() => {
        const linksByUser = new Map<
          string,
          { userId: string; userName: string; links: FacebookLink[] }
        >();
        facebookLinks.forEach((item) => {
          const entry = linksByUser.get(item.userId) || {
            userId: item.userId,
            userName: item.userName,
            links: [],
          };
          entry.links.push(item);
          linksByUser.set(item.userId, entry);
        });
        const usersWithLinks = Array.from(linksByUser.values());

        return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-3 sm:px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>🔗</span> Enlaces de Facebook
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Enlaces agrupados por usuario en el rango de fechas seleccionado
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {usersWithLinks.length > 0 ? (
                usersWithLinks.map((u) => (
                  <div
                    key={u.userId}
                    className="px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{u.userName}</p>
                      <p className="text-sm text-gray-500">
                        {u.links.filter((l) => l.kind === "post").length} post(s) propio(s) ·{" "}
                        {u.links.filter((l) => l.kind === "comment").length} post(s) comentado(s)
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setOpenLinkDates(null);
                        setLinksModalUser({ id: u.userId, name: u.userName });
                      }}
                      className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                    >
                      🔗 Ver Enlaces
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay enlaces de Facebook para el rango de fechas seleccionado
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Per-user Facebook Links Modal */}
      {linksModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-100">
            <div className="px-3 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🔗</span> Enlaces de {linksModalUser.name}
              </h3>
              <button
                onClick={() => setLinksModalUser(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 space-y-3">
              {(() => {
                // Group this user's links by day (links arrive newest first)
                const byDate = new Map<string, FacebookLink[]>();
                facebookLinks
                  .filter((l) => l.userId === linksModalUser.id)
                  .forEach((l) => {
                    const key = formatDay(l.date);
                    byDate.set(key, [...(byDate.get(key) || []), l]);
                  });

                if (byDate.size === 0) {
                  return <p className="text-sm text-gray-400">Sin enlaces</p>;
                }

                // Until the admin toggles something, only the most recent day is open
                const openDates = openLinkDates ?? new Set([Array.from(byDate.keys())[0]]);

                return Array.from(byDate.entries()).map(([dateLabel, items]) => {
                  const isOpen = openDates.has(dateLabel);
                  const posts = items.filter((l) => l.kind === "post");
                  const comments = items.filter((l) => l.kind === "comment");

                  return (
                    <div key={dateLabel} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => {
                          const next = new Set(openDates);
                          if (isOpen) next.delete(dateLabel);
                          else next.add(dateLabel);
                          setOpenLinkDates(next);
                        }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                      >
                        <span className="font-semibold text-gray-900">📅 {dateLabel}</span>
                        <span className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            📝 {posts.length}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            💬 {comments.length}
                          </span>
                          <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-4 space-y-4">
                          {([
                            { title: "📝 Posts propios", list: posts },
                            { title: "💬 Posts comentados", list: comments },
                          ]).map((section) => (
                            <div key={section.title} className="space-y-2">
                              <h4 className="text-sm font-bold text-gray-700">
                                {section.title} ({section.list.length})
                              </h4>
                              {section.list.length > 0 ? (
                                <ol className="space-y-1.5 list-decimal list-inside">
                                  {section.list.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-500 break-all">
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {item.link}
                                      </a>
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <p className="text-sm text-gray-400">Sin enlaces</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Observations Modal */}
      {observationsUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-100">
            <div className="px-3 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>📝</span> Observaciones de {observationsUser.name}
              </h3>
              <button
                onClick={() => setObservationsUser(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-3">
              {loadingObservations ? (
                <p className="text-center text-gray-500 py-8">⏳ Cargando...</p>
              ) : observationsData.length > 0 ? (
                observationsData.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <span className="text-xs text-red-700 font-semibold block mb-1">
                      {formatDay(obs.date)}
                    </span>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {obs.observations}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Sin observaciones en el rango de fechas seleccionado
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-gray-100">
            <div className="px-3 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>✏️</span> Editar reporte
              </h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              <p className="text-sm text-gray-500">
                {editingLog.user.name} · {formatDay(editingLog.date)}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    {METRIC_LABELS.whatsappGroupsReached}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.whatsappGroupsReached}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, whatsappGroupsReached: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    {METRIC_LABELS.whatsappMessagesPerGroup}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.whatsappMessagesPerGroup}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, whatsappMessagesPerGroup: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    {METRIC_LABELS.whatsappPeopleReached}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.whatsappPeopleReached}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, whatsappPeopleReached: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    {METRIC_LABELS.fbOwnPostsCreated}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.fbOwnPostsCreated}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, fbOwnPostsCreated: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    {METRIC_LABELS.fbCommentsMade}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.fbCommentsMade}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, fbCommentsMade: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    {METRIC_LABELS.fbGroupsShared}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.fbGroupsShared}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, fbGroupsShared: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    {METRIC_LABELS.fbNewGroupsJoined}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.fbNewGroupsJoined}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, fbNewGroupsJoined: e.target.value }))
                    }
                  />
                </div>
              </div>

              {editingLog && editingLog.fbOwnPostsLinks.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Enlaces de posts ya registrados
                  </label>
                  <div className="space-y-1">
                    {editingLog.fbOwnPostsLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:underline break-all"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {extraPostsCount > 0 && (
                <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="block text-xs font-semibold text-amber-900">
                    Aumentaste FB Posts en {extraPostsCount} — agrega {extraPostsCount === 1 ? "su enlace" : "sus enlaces"} (opcional)
                  </label>
                  {Array.from({ length: extraPostsCount }).map((_, i) => (
                    <input
                      key={i}
                      type="url"
                      placeholder="https://facebook.com/..."
                      value={newPostLinks[i] || ""}
                      onChange={(e) => handleNewPostLinkChange(i, e.target.value)}
                    />
                  ))}
                </div>
              )}

              {editingLog && editingLog.fbCommentLinks.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Enlaces de posts comentados ya registrados
                  </label>
                  <div className="space-y-1">
                    {editingLog.fbCommentLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:underline break-all"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {extraCommentsCount > 0 && (
                <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="block text-xs font-semibold text-amber-900">
                    Aumentaste FB Comentarios en {extraCommentsCount} — agrega {extraCommentsCount === 1 ? "el enlace del post comentado" : "los enlaces de los posts comentados"} (opcional)
                  </label>
                  {Array.from({ length: extraCommentsCount }).map((_, i) => (
                    <input
                      key={i}
                      type="url"
                      placeholder="https://facebook.com/..."
                      value={newCommentLinks[i] || ""}
                      onChange={(e) => handleNewCommentLinkChange(i, e.target.value)}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  className="w-full resize-none"
                  value={editFormData.observations}
                  onChange={(e) =>
                    setEditFormData((p) => ({ ...p, observations: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="px-3 sm:px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
              <button
                onClick={() => setEditingLog(null)}
                disabled={isSavingEdit}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50"
              >
                {isSavingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
