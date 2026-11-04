"use client";

import { useState } from "react";
import { loginAdmin } from "@/lib/auth";
import { TEAMS, TeamId } from "@/lib/teams";

export default function AdminLogin({ team = "TEAM1" }: { team?: TeamId }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginAdmin(password, team);
      if (result.success) {
        window.location.href = TEAMS[team].adminPath;
      } else {
        setError(result.error || "Clave incorrecta");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100 max-w-md w-full">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🔐</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Administrador
          </h2>
        </div>
        {team !== "TEAM1" && (
          <p className="inline-block mb-3 px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-sm font-semibold">
            {TEAMS[team].label} · {TEAMS[team].tagline}
          </p>
        )}
        <p className="text-gray-600 mb-6">
          Ingresa la clave de administrador{team === "TEAM1" ? "" : ` del ${TEAMS[team].label}`} para continuar.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <a href="/" className="block text-center mt-6 text-sm text-blue-600 hover:underline">
          ← Volver al inicio
        </a>
      </div>
    </div>
  );
}
