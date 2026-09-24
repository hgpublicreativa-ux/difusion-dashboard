import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
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
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <AdminDashboard />
      </main>
    </div>
  );
}
