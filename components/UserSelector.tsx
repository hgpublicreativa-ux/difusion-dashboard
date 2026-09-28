"use client";

import { useState, useEffect } from "react";
import { getUserDirectory } from "@/lib/actions";
import { getCurrentUser, loginUser, logout } from "@/lib/auth";
import UserForm from "@/components/UserForm";

type Member = { id: string; name: string };

export default function UserSelector() {
  const [users, setUsers] = useState<Member[]>([]);
  const [loggedUser, setLoggedUser] = useState<Member | null>(null);
  const [pendingUser, setPendingUser] = useState<Member | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Resume an existing session if the member already logged in
      const current = await getCurrentUser();
      if (current) {
        setLoggedUser(current);
        return;
      }

      const result = await getUserDirectory();
      if (result.success) {
        setUsers(result.data as Member[]);
      } else {
        setError(result.error || "No se pudieron cargar los usuarios");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingUser) return;

    setIsLoggingIn(true);
    setLoginError("");
    try {
      const result = await loginUser(pendingUser.id, password);
      if (result.success && result.user) {
        setLoggedUser(result.user);
        setPendingUser(null);
        setPassword("");
      } else {
        setLoginError(result.error || "Clave incorrecta");
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLoggedUser(null);
    await init();
  };

  // Once logged in, show the member's daily activity form
  if (loggedUser) {
    return (
      <div>
        <div className="max-w-2xl mx-auto mb-4">
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            ← Cerrar sesión
          </button>
        </div>
        <UserForm userId={loggedUser.id} userName={loggedUser.name} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">👤</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ¿Quién eres?
          </h2>
        </div>
        <p className="text-gray-600 mb-8">
          Selecciona tu nombre e ingresa tu clave para registrar tu actividad diaria.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="inline-block animate-spin text-3xl">⏳</span>
          </div>
        ) : users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setPendingUser(user);
                  setPassword("");
                  setLoginError("");
                }}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-gray-50 hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-400 rounded-xl transition-all duration-200 transform hover:scale-105 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-gray-900 truncate min-w-0">
                  {user.name}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No hay usuarios registrados</p>
            <p className="text-sm mt-1">
              Pide a un administrador que cree tu usuario.
            </p>
          </div>
        )}
      </div>

      {/* Password Modal */}
      {pendingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 max-w-md w-full border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-1">🔐 Ingresa tu clave</h3>
            <p className="text-sm text-gray-600 mb-4">{pendingUser.name}</p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
            />

            {loginError && (
              <p className="text-sm text-red-600 mt-3">{loginError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPendingUser(null)}
                disabled={isLoggingIn}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {isLoggingIn ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
