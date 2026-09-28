"use client";

import { logout } from "@/lib/auth";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await logout();
        window.location.href = "/";
      }}
      className="px-4 py-2 text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-colors"
    >
      🚪 Salir
    </button>
  );
}
