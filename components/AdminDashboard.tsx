"use client";

import { useState, useEffect } from "react";
import {
  getAggregatedByUser,
  getAggregatedByCampaign,
} from "@/lib/actions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AggregatedUser {
  user: {
    id: string;
    name: string;
    email: string;
  };
  totals: {
    whatsappGroupsReached: number;
    whatsappMessagesPerGroup: number;
    fbOwnPostsCreated: number;
    fbCommentsMade: number;
    fbGroupsShared: number;
    fbNewGroupsJoined: number;
  };
}

interface AggregatedCampaign {
  campaignName: string;
  entriesCount: number;
  totals: {
    whatsappGroupsReached: number;
    whatsappMessagesPerGroup: number;
    fbOwnPostsCreated: number;
    fbCommentsMade: number;
    fbGroupsShared: number;
    fbNewGroupsJoined: number;
  };
}

export default function AdminDashboard() {
  const [userAggregates, setUserAggregates] = useState<AggregatedUser[]>([]);
  const [campaignAggregates, setCampaignAggregates] = useState<
    AggregatedCampaign[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;

      const userResult = await getAggregatedByUser(startDateObj, endDateObj);
      const campaignResult = await getAggregatedByCampaign(
        startDateObj,
        endDateObj
      );

      if (userResult.success) {
        setUserAggregates(userResult.data as AggregatedUser[]);
      } else {
        setError(userResult.error || "Failed to load user data");
      }

      if (campaignResult.success) {
        setCampaignAggregates(campaignResult.data as AggregatedCampaign[]);
      } else {
        setError(campaignResult.error || "Failed to load campaign data");
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

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(
      `Total Grupos Alcanzados: ${formatNumber(totalGroups)}   |   Total Mensajes Enviados: ${formatNumber(totalMessages)}`,
      14,
      40
    );

    autoTable(doc, {
      startY: 46,
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
        formatNumber(u.totals.whatsappGroupsReached),
        formatNumber(u.totals.whatsappMessagesPerGroup),
        formatNumber(
          calculateTotalMessages(
            u.totals.whatsappGroupsReached,
            u.totals.whatsappMessagesPerGroup
          )
        ),
        formatNumber(u.totals.fbOwnPostsCreated),
        formatNumber(u.totals.fbCommentsMade),
        formatNumber(u.totals.fbGroupsShared),
        formatNumber(u.totals.fbNewGroupsJoined),
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    const afterUserTableY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY || 46;

    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text("Totales por Campaña", 14, afterUserTableY + 12);

    autoTable(doc, {
      startY: afterUserTableY + 16,
      head: [
        [
          "Campaña",
          "Entradas",
          "WA Grupos",
          "WA Msj/Grupo",
          "WA Total Msj",
          "FB Posts",
          "FB Comentarios",
          "FB Grupos Comp.",
          "FB Grupos Nuevos",
        ],
      ],
      body: campaignAggregates.map((c) => [
        c.campaignName,
        String(c.entriesCount),
        formatNumber(c.totals.whatsappGroupsReached),
        formatNumber(c.totals.whatsappMessagesPerGroup),
        formatNumber(
          calculateTotalMessages(
            c.totals.whatsappGroupsReached,
            c.totals.whatsappMessagesPerGroup
          )
        ),
        formatNumber(c.totals.fbOwnPostsCreated),
        formatNumber(c.totals.fbCommentsMade),
        formatNumber(c.totals.fbGroupsShared),
        formatNumber(c.totals.fbNewGroupsJoined),
      ]),
      headStyles: { fillColor: [147, 51, 234] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

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
      {userAggregates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-2">
              📱 Total Grupos Alcanzados
            </h3>
            <p className="text-4xl font-bold text-blue-600">
              {formatNumber(
                userAggregates.reduce(
                  (sum, user) => sum + user.totals.whatsappGroupsReached,
                  0
                )
              )}
            </p>
            <p className="text-sm text-blue-700 mt-2">grupos de WhatsApp</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg p-6 border-l-4 border-green-600">
            <h3 className="text-sm font-bold text-green-900 uppercase tracking-wide mb-2">
              💬 Total Mensajes Enviados
            </h3>
            <p className="text-4xl font-bold text-green-600">
              {formatNumber(
                userAggregates.reduce(
                  (sum, user) =>
                    sum +
                    calculateTotalMessages(
                      user.totals.whatsappGroupsReached,
                      user.totals.whatsappMessagesPerGroup
                    ),
                  0
                )
              )}
            </p>
            <p className="text-sm text-green-700 mt-2">mensajes de WhatsApp</p>
          </div>
        </div>
      )}

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

                  return (
                    <tr key={user.user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.user.name}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(user.totals.whatsappGroupsReached)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(user.totals.whatsappMessagesPerGroup)}
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-semibold">
                        {formatNumber(totalMessages)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(user.totals.fbOwnPostsCreated)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(user.totals.fbCommentsMade)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(user.totals.fbGroupsShared)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(user.totals.fbNewGroupsJoined)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600"
                        >
                          View
                        </a>
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

      {/* Table 2: By Campaign */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🎯</span> Totales por Campaña
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Campaign
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Entries
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
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {campaignAggregates.length > 0 ? (
                campaignAggregates.map((campaign) => {
                  const totalMessages = calculateTotalMessages(
                    campaign.totals.whatsappGroupsReached,
                    campaign.totals.whatsappMessagesPerGroup
                  );

                  return (
                    <tr key={campaign.campaignName} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {campaign.campaignName}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {campaign.entriesCount}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(campaign.totals.whatsappGroupsReached)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(campaign.totals.whatsappMessagesPerGroup)}
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-semibold">
                        {formatNumber(totalMessages)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(campaign.totals.fbOwnPostsCreated)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(campaign.totals.fbCommentsMade)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(campaign.totals.fbGroupsShared)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {formatNumber(campaign.totals.fbNewGroupsJoined)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No data available for the selected date range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
