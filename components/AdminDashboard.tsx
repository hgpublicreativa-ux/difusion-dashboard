"use client";

import { useState, useEffect } from "react";
import {
  getAggregatedByUser,
  getFacebookLinksByDateRange,
  getActivityLogsByDateRange,
} from "@/lib/actions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface UserTotals {
  whatsappGroupsReached: number;
  whatsappMessagesPerGroup: number;
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
  totals: UserTotals;
  todayTotals: UserTotals;
}

interface FacebookLink {
  userId: string;
  userName: string;
  date: Date;
  link: string;
}

interface DailyLog {
  id: string;
  date: Date;
  whatsappGroupsReached: number;
  whatsappMessagesPerGroup: number;
  fbOwnPostsCreated: number;
  fbCommentsMade: number;
  fbGroupsShared: number;
  fbNewGroupsJoined: number;
  driveEvidenceFolderUrl: string | null;
  user: { id: string; name: string };
}

export default function AdminDashboard() {
  const [userAggregates, setUserAggregates] = useState<AggregatedUser[]>([]);
  const [facebookLinks, setFacebookLinks] = useState<FacebookLink[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLinksModal, setShowLinksModal] = useState(false);

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
        setError(userResult.error || "Failed to load user data");
      }

      if (linksResult.success) {
        setFacebookLinks(linksResult.data as FacebookLink[]);
      } else {
        setError(linksResult.error || "Failed to load Facebook links");
      }

      if (logsResult.success) {
        setDailyLogs(logsResult.data as unknown as DailyLog[]);
      } else {
        setError(logsResult.error || "Failed to load daily logs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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

  const calculateTotalMessages = (
    groupsReached: number,
    messagesPerGroup: number
  ): number => {
    return groupsReached * messagesPerGroup;
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
    <td className="px-6 py-4 text-center">
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
      `Generado: ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}`,
      14,
      32
    );

    const totalGroups = userAggregates.reduce(
      (sum, u) => sum + u.totals.whatsappGroupsReached,
      0
    );
    const totalMessages = userAggregates.reduce(
      (sum, u) =>
        sum +
        calculateTotalMessages(
          u.totals.whatsappGroupsReached,
          u.totals.whatsappMessagesPerGroup
        ),
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
      `WA Grupos: ${formatNumber(totalGroups)}   |   WA Mensajes: ${formatNumber(totalMessages)}   |   FB Posts: ${formatNumber(totalFbPosts)}`,
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
          "WA Msj/Grupo",
          "WA Total Msj",
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
        `${formatNumber(
          calculateTotalMessages(
            u.totals.whatsappGroupsReached,
            u.totals.whatsappMessagesPerGroup
          )
        )} (hoy: ${formatNumber(
          calculateTotalMessages(
            u.todayTotals.whatsappGroupsReached,
            u.todayTotals.whatsappMessagesPerGroup
          )
        )})`,
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
      doc.text("Enlaces de Facebook Compartidos", 14, afterUserTableY + 12);

      autoTable(doc, {
        startY: afterUserTableY + 16,
        head: [["Usuario", "Fecha", "Enlace"]],
        body: facebookLinks.map((l) => [
          l.userName,
          new Date(l.date).toLocaleDateString("es-ES"),
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-2xl">📊</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
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
            messages:
              acc.messages +
              calculateTotalMessages(
                user.totals.whatsappGroupsReached,
                user.totals.whatsappMessagesPerGroup
              ),
            fbPosts: acc.fbPosts + user.totals.fbOwnPostsCreated,
            fbComments: acc.fbComments + user.totals.fbCommentsMade,
            fbGroupsShared: acc.fbGroupsShared + user.totals.fbGroupsShared,
            fbNewGroups: acc.fbNewGroups + user.totals.fbNewGroupsJoined,
          }),
          {
            groups: 0,
            messages: 0,
            fbPosts: 0,
            fbComments: 0,
            fbGroupsShared: 0,
            fbNewGroups: 0,
          }
        );

        const cards = [
          {
            icon: "📱",
            label: "Total Grupos Alcanzados",
            value: totals.groups,
            unit: "grupos de WhatsApp",
            color: "blue",
          },
          {
            icon: "💬",
            label: "Total Mensajes Enviados",
            value: totals.messages,
            unit: "mensajes de WhatsApp",
            color: "green",
          },
          {
            icon: "📝",
            label: "Total Posts Creados",
            value: totals.fbPosts,
            unit: "posts de Facebook",
            color: "indigo",
          },
          {
            icon: "💭",
            label: "Total Comentarios",
            value: totals.fbComments,
            unit: "comentarios de Facebook",
            color: "purple",
          },
          {
            icon: "🔗",
            label: "Total Grupos Compartidos",
            value: totals.fbGroupsShared,
            unit: "grupos de Facebook",
            color: "pink",
          },
          {
            icon: "✨",
            label: "Total Grupos Nuevos",
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
        <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>👥</span> Totales por Usuario
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  User
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  WA Groups
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  WA Mensajes/Grupo
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  WA Total Mensajes Enviados
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  FB Posts
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  FB Comments
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  FB Groups Shared
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  FB New Groups
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Drive
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {userAggregates.length > 0 ? (
                userAggregates.map((user) => {
                  const totalMessages = calculateTotalMessages(
                    user.totals.whatsappGroupsReached,
                    user.totals.whatsappMessagesPerGroup
                  );
                  const todayMessages = calculateTotalMessages(
                    user.todayTotals.whatsappGroupsReached,
                    user.todayTotals.whatsappMessagesPerGroup
                  );

                  return (
                    <tr key={user.user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.user.name}
                      </td>
                      <MetricCell
                        today={user.todayTotals.whatsappGroupsReached}
                        total={user.totals.whatsappGroupsReached}
                      />
                      <MetricCell
                        today={user.todayTotals.whatsappMessagesPerGroup}
                        total={user.totals.whatsappMessagesPerGroup}
                      />
                      <MetricCell
                        today={todayMessages}
                        total={totalMessages}
                        highlight
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
                      <td className="px-6 py-4 text-center">
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
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No data available for the selected date range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table: Daily History (individual reports, one row per user per day) */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>📆</span> Historial Diario
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Un registro por usuario por día. Si alguien reporta varias veces el mismo día, se acumula en la misma fila.
          </p>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Usuario
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  WA Grupos
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  WA Msj/Grupo
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  FB Posts
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  FB Comments
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  FB Grupos Comp.
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  FB Grupos Nuevos
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Evidencias
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {dailyLogs.length > 0 ? (
                dailyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {log.user.name}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      {formatNumber(log.whatsappGroupsReached)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      {formatNumber(log.whatsappMessagesPerGroup)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      {formatNumber(log.fbOwnPostsCreated)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      {formatNumber(log.fbCommentsMade)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      {formatNumber(log.fbGroupsShared)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      {formatNumber(log.fbNewGroupsJoined)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {log.driveEvidenceFolderUrl ? (
                        <a
                          href={log.driveEvidenceFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600"
                        >
                          📁 Ver
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No hay registros para el rango de fechas seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facebook Links: button that opens a modal */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔗</span> Enlaces de Facebook Compartidos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {facebookLinks.length} enlace(s) en el rango de fechas seleccionado
          </p>
        </div>
        <button
          onClick={() => setShowLinksModal(true)}
          disabled={facebookLinks.length === 0}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-md hover:shadow-lg"
        >
          🔗 Ver Enlaces
        </button>
      </div>

      {/* Facebook Links Modal */}
      {showLinksModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🔗</span> Enlaces de Facebook ({facebookLinks.length})
              </h3>
              <button
                onClick={() => setShowLinksModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-3">
              {facebookLinks.length > 0 ? (
                facebookLinks.map((item, index) => (
                  <div
                    key={`${item.userId}-${index}`}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {item.userName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline break-all text-sm"
                    >
                      {item.link}
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay enlaces de Facebook para el rango de fechas seleccionado
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
