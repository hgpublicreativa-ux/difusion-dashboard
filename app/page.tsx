export default function HomePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center relative"
      style={{
        backgroundImage:
          "linear-gradient(rgba(30, 58, 138, 0.85), rgba(67, 56, 202, 0.85)), url('https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=1920&auto=format&fit=crop')",
      }}
    >
      <div className="text-center relative z-10">
        <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
          Difusión Dashboard
        </h1>
        <p className="text-xl text-blue-100 mb-8 max-w-md mx-auto drop-shadow">
          Dashboard para registro de métricas de difusión masiva en WhatsApp y
          Facebook
        </p>

        <div className="flex gap-4 flex-col sm:flex-row justify-center">
          <a
            href="/user"
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition duration-200 shadow-lg"
          >
            Registrar Actividad
          </a>
          <a
            href="/admin"
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition duration-200 shadow-lg"
          >
            Dashboard Administrativo
          </a>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              📱 WhatsApp
            </h3>
            <p className="text-blue-100">
              Registra grupos alcanzados y mensajes enviados
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              👍 Facebook
            </h3>
            <p className="text-blue-100">
              Controla posts, comentarios y grupos alcanzados
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              📊 Analytics
            </h3>
            <p className="text-blue-100">
              Visualiza métricas agrupadas por usuario y campaña
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
