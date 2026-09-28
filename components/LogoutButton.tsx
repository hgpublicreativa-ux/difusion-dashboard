"use client";

import { logout } from "@/lib/auth";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await logout();
        window.location.href = "/";
      }}
      title="Salir"
      className="px-2.5 sm:px-4 py-2 text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
    >
      🚪<span className="hidden md:inline"> Salir</span>
    </button>
  );
}
