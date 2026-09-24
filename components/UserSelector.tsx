"use client";

import { useState, useEffect } from "react";
import { getAllUsers } from "@/lib/actions";
import UserForm from "@/components/UserForm";
import type { User } from "@prisma/client";

export default function UserSelector() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data as User[]);
      } else {
        setError(result.error || "No se pudieron cargar los usuarios");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  // Once a user is picked, show their daily activity form
  if (selectedUser) {
    return (
      <div>
        <div className="max-w-2xl mx-auto mb-4">
          <button
            onClick={() => setSelectedUser(null)}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            ← Cambiar usuario
          </button>
        </div>
        <UserForm userId={selectedUser.id} userName={selectedUser.name} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">👤</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ¿Quién eres?
          </h2>
        </div>
        <p className="text-gray-600 mb-8">
          Selecciona tu nombre para registrar tu actividad diaria.
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
                onClick={() => setSelectedUser(user)}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-gray-50 hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-400 rounded-xl transition-all duration-200 transform hover:scale-105 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No hay usuarios registrados</p>
            <p className="text-sm mt-1">
              Pide a un administrador que cree tu usuario en{" "}
              <a href="/admin/users" className="text-blue-600 hover:underline">
                /admin/users
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
