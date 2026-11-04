import { TEAMS, TeamId } from "@/lib/teams";

const TEAM_IDS: TeamId[] = ["TEAM1", "TEAM2"];

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center relative"
      style={{
        backgroundImage:
          "linear-gradient(rgba(30, 58, 138, 0.85), rgba(67, 56, 202, 0.85)), url('https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=1920&auto=format&fit=crop')",
      }}
    >
      <div className="text-center relative z-10 w-full max-w-4xl">
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
          Difusión Dashboard
        </h1>
        <p className="text-base sm:text-xl text-blue-100 mb-8 sm:mb-10 max-w-md mx-auto drop-shadow">
          Dashboard para registro de métricas de difusión masiva
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {TEAM_IDS.map((team) => {
            const t = TEAMS[team];
            return (
              <section
                key={team}
                className="bg-white/10 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 text-center flex flex-col"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{t.label}</h2>

                <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-6">
                  <a
                    href={t.memberPath}
                    className="flex-1 text-center px-5 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition duration-200 shadow-lg"
                  >
                    Registrar Actividad
                  </a>
                  <a
                    href={t.adminPath}
                    className="flex-1 text-center px-5 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition duration-200 shadow-lg"
                  >
                    Dashboard
                  </a>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
