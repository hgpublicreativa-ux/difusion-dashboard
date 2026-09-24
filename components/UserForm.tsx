"use client";

import { FormEvent, useState } from "react";

interface UserFormProps {
  userName: string;
  userId: string;
}

export default function UserForm({ userName, userId }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: "",
    date: new Date().toISOString().split("T")[0],
    whatsappGroupsReached: "",
    whatsappMessagesPerGroup: "",
    fbOwnPostsCreated: "",
    fbOwnPostsLinks: [""],
    fbCommentsMade: "",
    fbGroupsShared: "",
    fbNewGroupsJoined: "",
    files: [] as File[],
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === "file") {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        setFormData((prev) => ({
          ...prev,
          files: Array.from(files),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFbLinksChange = (index: number, value: string) => {
    const newLinks = [...formData.fbOwnPostsLinks];
    newLinks[index] = value;
    setFormData((prev) => ({
      ...prev,
      fbOwnPostsLinks: newLinks,
    }));
  };

  const addFbLinkField = () => {
    setFormData((prev) => ({
      ...prev,
      fbOwnPostsLinks: [...prev.fbOwnPostsLinks, ""],
    }));
  };

  const removeFbLinkField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fbOwnPostsLinks: prev.fbOwnPostsLinks.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.campaignName.trim()) {
      setError("Campaign name is required");
      return false;
    }

    // Validate numeric fields
    const numericFields = [
      "whatsappGroupsReached",
      "whatsappMessagesPerGroup",
      "fbOwnPostsCreated",
      "fbCommentsMade",
      "fbGroupsShared",
      "fbNewGroupsJoined",
    ];

    for (const field of numericFields) {
      const value = formData[field as keyof typeof formData] as string;
      if (!value || isNaN(parseInt(value))) {
        setError(`${field} must be a valid number`);
        return false;
      }
      if (parseInt(value) < 0) {
        setError(`${field} cannot be negative`);
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
      form.append("campaignName", formData.campaignName);
      form.append("date", formData.date);
      form.append("whatsappGroupsReached", formData.whatsappGroupsReached);
      form.append(
        "whatsappMessagesPerGroup",
        formData.whatsappMessagesPerGroup
      );
      form.append("fbOwnPostsCreated", formData.fbOwnPostsCreated);
      form.append("fbCommentsMade", formData.fbCommentsMade);
      form.append("fbGroupsShared", formData.fbGroupsShared);
      form.append("fbNewGroupsJoined", formData.fbNewGroupsJoined);

      // Add Facebook post links
      formData.fbOwnPostsLinks.forEach((link) => {
        if (link.trim()) {
          form.append("fbOwnPostsLinks", link);
        }
      });

      // Add files
      formData.files.forEach((file) => {
        form.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setSuccess(
        `Activity logged successfully! ${data.message}. Folder: ${data.folderUrl}`
      );

      // Reset form
      setFormData({
        campaignName: "",
        date: new Date().toISOString().split("T")[0],
        whatsappGroupsReached: "",
        whatsappMessagesPerGroup: "",
        fbOwnPostsCreated: "",
        fbOwnPostsLinks: [""],
        fbCommentsMade: "",
        fbGroupsShared: "",
        fbNewGroupsJoined: "",
        files: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">📊</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reporte Diario
          </h2>
        </div>
        <p className="text-gray-600 mb-8">Hola, <span className="font-semibold text-gray-900">{userName}</span>. Registra tu actividad del día.</p>

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
        {/* Campaign Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            📝 Nombre de Campaña
          </label>
          <input
            type="text"
            name="campaignName"
            value={formData.campaignName}
            onChange={handleInputChange}
            placeholder="Ej: Promoción de Verano, Black Friday, etc."
            required
          />
        </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-green-900">
                Grupos Alcanzados
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
                Mensajes por Grupo
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
                Posts Propios Creados
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
                    onChange={(e) => handleFbLinksChange(index, e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                  {formData.fbOwnPostsLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFbLinkField(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFbLinkField}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all"
              >
                + Agregar Enlace
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-900">
                  Comentarios
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
                  Grupos Compartidos
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
                  Grupos Nuevos
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
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-dashed border-purple-300 hover:border-purple-500 transition-colors">
          <label className="block text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <span>📸</span> Evidencias (Capturas/Videos)
          </label>
          <input
            type="file"
            name="files"
            multiple
            onChange={handleInputChange}
            accept="image/*,video/*"
            className="w-full cursor-pointer"
          />
          {formData.files.length > 0 && (
            <div className="mt-3 p-3 bg-purple-100 rounded-lg text-sm text-purple-900 font-medium">
              ✓ {formData.files.length} archivo(s) seleccionado(s)
            </div>
          )}
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
