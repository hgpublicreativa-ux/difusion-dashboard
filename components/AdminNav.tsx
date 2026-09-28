import LogoutButton from "@/components/LogoutButton";

const links = [
  { href: "/", icon: "🏠", label: "Inicio" },
  { href: "/admin", icon: "📊", label: "Dashboard" },
  { href: "/admin/users", icon: "👥", label: "Usuarios" },
];

export default function AdminNav() {
  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <h1 className="hidden sm:block text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              Difusión Dashboard
            </h1>
          </div>
          <div className="flex gap-0.5 sm:gap-1 items-center">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                title={l.label}
                className="px-2.5 sm:px-4 py-2 text-gray-700 font-semibold hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
              >
                {l.icon}
                <span className="hidden md:inline"> {l.label}</span>
              </a>
            ))}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
