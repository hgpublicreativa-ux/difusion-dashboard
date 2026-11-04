import AdminDashboard from "@/components/AdminDashboard";
import AdminNav from "@/components/AdminNav";

export default function Team2AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminNav team="TEAM2" />

      <main className="max-w-7xl mx-auto">
        <AdminDashboard team="TEAM2" />
      </main>
    </div>
  );
}
