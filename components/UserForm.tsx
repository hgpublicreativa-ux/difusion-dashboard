"use client";

import { METRIC_LABELS } from "@/lib/labels";
import { FormEvent, useState } from "react";
import { ecuadorToday } from "@/lib/dates";

interface UserFormProps {
  userName: string;
  userId: string;
}

const CAMPAIGN_NAME = "Difusión General";

export default function UserForm({ userName, userId }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: ecuadorToday(),
    whatsappGroupsReached: "",
    whatsappMessagesPerGroup: "",
    whatsappPeopleReached: "",
    fbOwnPostsCreated: "",
    fbOwnPostsLinks: [""],
    fbCommentsMade: "",
    fbCommentLinks: [""],
    fbGroupsShared: "",
    fbNewGroupsJoined: "",
    whatsappFiles: [] as File[],
    facebookFiles: [] as File[],
    observations: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const MAX_FILES_PER_UPLOAD = 20;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === "file") {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const selectedFiles = Array.from(files);

        if (selectedFiles.length > MAX_FILES_PER_UPLOAD) {
          setError(
            `Solo puedes subir un máximo de ${MAX_FILES_PER_UPLOAD} archivos a la vez. Se seleccionaron los primeros ${MAX_FILES_PER_UPLOAD}.`
          );
        } else {
          setError("");
        }

        setFormData((prev) => ({
          ...prev,
          [name]: selectedFiles.slice(0, MAX_FILES_PER_UPLOAD),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  type LinkField = "fbOwnPostsLinks" | "fbCommentLinks";

  const handleFbLinksChange = (field: LinkField, index: number, value: string) => {
    setFormData((prev) => {
      const newLinks = [...prev[field]];
      newLinks[index] = value;
      return { ...prev, [field]: newLinks };
    });
  };

  const addFbLinkField = (field: LinkField) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeFbLinkField = (field: LinkField, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    // Validate numeric fields
    const numericFields: Record<string, string> = {
      whatsappGroupsReached: METRIC_LABELS.whatsappGroupsReached,
      whatsappMessagesPerGroup: METRIC_LABELS.whatsappMessagesPerGroup,
      whatsappPeopleReached: METRIC_LABELS.whatsappPeopleReached,
      fbOwnPostsCreated: METRIC_LABELS.fbOwnPostsCreated,
      fbCommentsMade: METRIC_LABELS.fbCommentsMade,
      fbGroupsShared: METRIC_LABELS.fbGroupsShared,
      fbNewGroupsJoined: METRIC_LABELS.fbNewGroupsJoined,
    };

    for (const [field, label] of Object.entries(numericFields)) {
      const value = formData[field as keyof typeof formData] as string;
      if (!value || isNaN(parseInt(value))) {
        setError(`"${label}" debe ser un número válido`);
        return false;
      }
      if (parseInt(value) < 0) {
        setError(`"${label}" no puede ser negativo`);
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccess("");
    setError("");

    try {
      const form = new FormData();
      form.append("userId", userId);
      form.append("userName", userName);
      form.append("campaignName", CAMPAIGN_NAME);
      form.append("date", formData.date);
      form.append("whatsappGroupsReached", formData.whatsappGroupsReached);
      form.append(
        "whatsappMessagesPerGroup",
        formData.whatsappMessagesPerGroup
      );
      form.append("whatsappPeopleReached", formData.whatsappPeopleReached);
      form.append("fbOwnPostsCreated", formData.fbOwnPostsCreated);
      form.append("fbCommentsMade", formData.fbCommentsMade);
      form.append("fbGroupsShared", formData.fbGroupsShared);
      form.append("fbNewGroupsJoined", formData.fbNewGroupsJoined);
      form.append("observations", formData.observations);

      // Add Facebook post links
      formData.fbOwnPostsLinks.forEach((link) => {
        if (link.trim()) {
          form.append("fbOwnPostsLinks", link);
        }
      });

      // Add links of the posts the member commented on
      formData.fbCommentLinks.forEach((link) => {
        if (link.trim()) {
          form.append("fbCommentLinks", link);
        }
      });

      // Add WhatsApp files
      formData.whatsappFiles.forEach((file) => {
        form.append("whatsappFiles", file);
      });

      // Add Facebook files
      formData.facebookFiles.forEach((file) => {
        form.append("facebookFiles", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo enviar el registro");
      }

      const data = await response.json();
      setSuccess(
        `¡Actividad registrada! ${data.message}`
      );

      // Reset form
      setFormData({
        date: ecuadorToday(),
        whatsappGroupsReached: "",
        whatsappMessagesPerGroup: "",
        whatsappPeopleReached: "",
        fbOwnPostsCreated: "",
        fbOwnPostsLinks: [""],
        fbCommentsMade: "",
        fbCommentLinks: [""],
        fbGroupsShared: "",
        fbNewGroupsJoined: "",
        whatsappFiles: [],
        facebookFiles: [],
        observations: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">📊</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reporte Diario
          </h2>
        </div>
        <p className="text-gray-600 mb-2">Hola, <span className="font-semibold text-gray-900">{userName}</span>. Registra tu actividad del día.</p>
        <p className="text-xs text-gray-400 mb-8">
          💡 Si ya enviaste un reporte hoy, estos valores se sumarán al reporte de hoy (no se reemplazan).
        </p>

        {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg flex items-start gap-3">
          <span className="text-xl mt-1">⚠️</span>
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        )}

        {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-lg flex items-start gap-3">
          <span className="text-xl mt-1">✅</span>
          <div>
            <p className="font-semibold">¡Éxito!</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            📅 Fecha
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* WhatsApp Section */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
            <span>💬</span> Métricas WhatsApp
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-green-900">
                {METRIC_LABELS.whatsappGroupsReached}
              </label>
              <input
                type="number"
                name="whatsappGroupsReached"
                value={formData.whatsappGroupsReached}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-green-900">
                {METRIC_LABELS.whatsappMessagesPerGroup}
              </label>
              <input
                type="number"
                name="whatsappMessagesPerGroup"
                value={formData.whatsappMessagesPerGroup}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-green-900">
                {METRIC_LABELS.whatsappPeopleReached}
              </label>
              <input
                type="number"
                name="whatsappPeopleReached"
                value={formData.whatsappPeopleReached}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>
        </div>

        {/* Facebook Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <span>👍</span> Métricas Facebook
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-blue-900">
                {METRIC_LABELS.fbOwnPostsCreated}
              </label>
              <input
                type="number"
                name="fbOwnPostsCreated"
                value={formData.fbOwnPostsCreated}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Enlaces de Posts
              </label>
              {formData.fbOwnPostsLinks.map((link, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleFbLinksChange("fbOwnPostsLinks", index, e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                  {formData.fbOwnPostsLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFbLinkField("fbOwnPostsLinks", index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addFbLinkField("fbOwnPostsLinks")}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all"
              >
                + Agregar Enlace
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-900">
                  {METRIC_LABELS.fbCommentsMade}
                </label>
                <input
                  type="number"
                  name="fbCommentsMade"
                  value={formData.fbCommentsMade}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-900">
                  {METRIC_LABELS.fbGroupsShared}
                </label>
                <input
                  type="number"
                  name="fbGroupsShared"
                  value={formData.fbGroupsShared}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-900">
                  {METRIC_LABELS.fbNewGroupsJoined}
                </label>
                <input
                  type="number"
                  name="fbNewGroupsJoined"
                  value={formData.fbNewGroupsJoined}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Enlaces de Posts Comentados
              </label>
              {formData.fbCommentLinks.map((link, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleFbLinksChange("fbCommentLinks", index, e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                  {formData.fbCommentLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFbLinkField("fbCommentLinks", index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addFbLinkField("fbCommentLinks")}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all"
              >
                + Agregar Enlace
              </button>
            </div>
          </div>
        </div>

        {/* File Upload - WhatsApp */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-dashed border-green-300 hover:border-green-500 transition-colors">
          <label className="block text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
            <span>💬</span> Evidencias WhatsApp (Capturas/Videos)
          </label>
          <input
            type="file"
            name="whatsappFiles"
            multiple
            onChange={handleInputChange}
            accept="image/*,video/*"
            className="w-full cursor-pointer"
          />
          <p className="mt-2 text-xs text-green-800">
            Puedes seleccionar hasta {MAX_FILES_PER_UPLOAD} archivos a la vez.
          </p>
          {formData.whatsappFiles.length > 0 && (
            <div className="mt-3 p-3 bg-green-100 rounded-lg text-sm text-green-900 font-medium">
              ✓ {formData.whatsappFiles.length} archivo(s) de WhatsApp seleccionado(s)
            </div>
          )}
        </div>

        {/* File Upload - Facebook */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors">
          <label className="block text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>👍</span> Evidencias Facebook (Capturas/Videos)
          </label>
          <input
            type="file"
            name="facebookFiles"
            multiple
            onChange={handleInputChange}
            accept="image/*,video/*"
            className="w-full cursor-pointer"
          />
          <p className="mt-2 text-xs text-blue-800">
            Puedes seleccionar hasta {MAX_FILES_PER_UPLOAD} archivos a la vez.
          </p>
          {formData.facebookFiles.length > 0 && (
            <div className="mt-3 p-3 bg-blue-100 rounded-lg text-sm text-blue-900 font-medium">
              ✓ {formData.facebookFiles.length} archivo(s) de Facebook seleccionado(s)
            </div>
          )}
        </div>

        {/* Observations */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            📝 Observaciones (opcional)
          </label>
          <textarea
            name="observations"
            value={formData.observations}
            onChange={handleTextareaChange}
            placeholder="Cualquier comentario adicional sobre tu actividad de hoy..."
            rows={3}
            className="w-full resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin">⏳</span>
              Subiendo evidencias...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🚀</span> Enviar Reporte
            </span>
          )}
        </button>
        </form>
      </div>
    </div>
  );
}
