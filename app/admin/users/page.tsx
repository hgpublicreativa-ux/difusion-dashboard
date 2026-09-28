"use client";

import { useState, useEffect } from "react";
import {
  createUser,
  getAllUsers,
  deleteUser,
  updateUserPhone,
  getPhoneHistory,
} from "@/lib/actions";
import type { User, PhoneChange } from "@prisma/client";
import { setUserPassword } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [userToEditPhone, setUserToEditPhone] = useState<User | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const [userToEditPassword, setUserToEditPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [phoneHistory, setPhoneHistory] = useState<PhoneChange[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data as User[]);
      } else {
        setError(result.error || "Failed to load users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        setError("All fields are required");
        setIsLoading(false);
        return;
      }

      if (!formData.email.includes("@")) {
        setError("Invalid email format");
        setIsLoading(false);
        return;
      }

      const result = await createUser(
        formData.name,
        formData.email,
        formData.password,
        "USER",
        formData.phone
      );

      if (result.success) {
        setSuccess("User created successfully!");
        setFormData({ name: "", email: "", password: "", phone: "" });
        await loadUsers();
      } else {
        setError(result.error || "Failed to create user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const openPhoneEditor = (user: User) => {
    setUserToEditPhone(user);
    setNewPhone(user.phone || "");
    setPhoneError("");
  };

  const handleSavePhone = async () => {
    if (!userToEditPhone) return;

    setIsSavingPhone(true);
    setPhoneError("");

    try {
      const result = await updateUserPhone(userToEditPhone.id, newPhone);
      if (result.success) {
        setSuccess(`Número de "${userToEditPhone.name}" actualizado`);
        setUserToEditPhone(null);
        await loadUsers();
      } else {
        setPhoneError(result.error || "No se pudo actualizar el número");
      }
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSavePassword = async () => {
    if (!userToEditPassword) return;

    setIsSavingPassword(true);
    setPasswordError("");

    try {
      const result = await setUserPassword(userToEditPassword.id, newPassword);
      if (result.success) {
        setSuccess(`Clave de "${userToEditPassword.name}" actualizada`);
        setUserToEditPassword(null);
      } else {
        setPasswordError(result.error || "No se pudo cambiar la clave");
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const openPhoneHistory = async (user: User) => {
    setHistoryUser(user);
    setPhoneHistory([]);
    setIsLoadingHistory(true);

    try {
      const result = await getPhoneHistory(user.id);
      if (result.success) {
        setPhoneHistory(result.data as PhoneChange[]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      const result = await deleteUser(userToDelete.id);
      if (result.success) {
        setSuccess(`Usuario "${userToDelete.name}" eliminado correctamente`);
        setUserToDelete(null);
        await loadUsers();
      } else {
        setError(result.error || "Failed to delete user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Difusión Dashboard
              </h1>
            </div>
            <div className="flex gap-1">
              <a
                href="/"
                className="px-4 py-2 text-gray-700 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
              >
                🏠 Inicio
              </a>
              <a
                href="/admin"
                className="px-4 py-2 text-gray-700 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
              >
                📊 Dashboard
              </a>
              <a
                href="/admin/users"
                className="px-4 py-2 text-gray-700 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
              >
                👥 Usuarios
              </a>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          {/* Create User Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">➕</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Crear Nuevo Usuario
              </h2>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg flex items-start gap-3">
                <span className="text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-lg flex items-start gap-3">
                <span className="text-xl mt-0.5">✅</span>
                <div>
                  <p className="font-semibold">¡Éxito!</p>
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  👤 Nombre Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  📧 Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="usuario@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  📱 Número de Teléfono <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+593 99 123 4567"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  🔐 Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⏳</span>
                    Creando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>➕</span> Crear Usuario
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>👥</span> Usuarios Registrados ({users.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                          {user.phone || (
                            <span className="text-gray-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {new Date(user.createdAt).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap space-x-2">
                          <button
                            onClick={() => openPhoneEditor(user)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
                          >
                            📱 Cambiar número
                          </button>
                          <button
                            onClick={() => {
                              setUserToEditPassword(user);
                              setNewPassword("");
                              setPasswordError("");
                            }}
                            className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors"
                          >
                            🔑 Cambiar clave
                          </button>
                          <button
                            onClick={() => openPhoneHistory(user)}
                            className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                          >
                            🕘 Historial
                          </button>
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No users created yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Change Phone Modal */}
      {userToEditPhone && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              📱 Cambiar número
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {userToEditPhone.name} — actual:{" "}
              <span className="font-semibold">
                {userToEditPhone.phone || "sin asignar"}
              </span>
            </p>

            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+593 99 123 4567"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 mb-4">
              El número anterior quedará guardado en el historial.
            </p>

            {phoneError && (
              <p className="text-sm text-red-600 mb-4">{phoneError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setUserToEditPhone(null)}
                disabled={isSavingPhone}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhone}
                disabled={isSavingPhone}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {isSavingPhone ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {userToEditPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              🔑 Cambiar clave
            </h3>
            <p className="text-sm text-gray-600 mb-4">{userToEditPassword.name}</p>

            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva clave"
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 mb-4">
              Mínimo 4 caracteres. Comunícale la nueva clave al usuario.
            </p>

            {passwordError && (
              <p className="text-sm text-red-600 mb-4">{passwordError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setUserToEditPassword(null)}
                disabled={isSavingPassword}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePassword}
                disabled={isSavingPassword}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50"
              >
                {isSavingPassword ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone History Modal */}
      {historyUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              🕘 Historial de números
            </h3>
            <p className="text-sm text-gray-600 mb-4">{historyUser.name}</p>

            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
              {isLoadingHistory ? (
                <p className="p-6 text-center text-gray-500">Cargando...</p>
              ) : phoneHistory.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Fecha</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Anterior</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Nuevo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {phoneHistory.map((h) => (
                      <tr key={h.id}>
                        <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                          {new Date(h.changedAt).toLocaleString("es-ES")}
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                          {h.oldPhone || "—"}
                        </td>
                        <td className="px-4 py-2 font-semibold text-gray-900">
                          {h.newPhone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-6 text-center text-gray-500">
                  Sin cambios registrados
                </p>
              )}
            </div>

            <button
              onClick={() => setHistoryUser(null)}
              className="mt-4 w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Eliminar Usuario
              </h3>
            </div>

            <p className="text-gray-700 mb-2">
              ¿Estás seguro de eliminar a <span className="font-semibold">{userToDelete.name}</span> ({userToDelete.email})?
            </p>
            <p className="text-sm text-red-600 mb-6">
              Esta acción también eliminará todos sus registros de actividad. No se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
