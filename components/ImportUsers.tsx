"use client";

import { useMemo, useState } from "react";
import { importUsers } from "@/lib/actions";
import { nameKey, parseUserList } from "@/lib/importUsers";

interface ImportUsersProps {
  // Names already registered in this team, to flag them in the preview
  existingNames: string[];
  onImported: () => void | Promise<void>;
}

type ImportResult = { created: string[]; skipped: { name: string; reason: string }[] };

export default function ImportUsers({ existingNames, onImported }: ImportUsersProps) {
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const existing = useMemo(() => new Set(existingNames.map(nameKey)), [existingNames]);

  const rows = useMemo(
    () =>
      parseUserList(text).map((row) => ({
        ...row,
        exists: !row.problem && existing.has(nameKey(row.name)),
      })),
    [text, existing]
  );

  const toCreate = rows.filter((r) => !r.problem && !r.exists);
  const repeated = rows.filter((r) => r.problem === "repetido-en-lista").length;
  const alreadyThere = rows.filter((r) => r.exists).length;
  const withoutName = rows.filter((r) => r.problem === "sin-nombre").length;
  const phoneWarnings = toCreate.filter((r) => r.phoneWarning).length;

  const handleImport = async () => {
    setIsImporting(true);
    setError("");
    setResult(null);
    try {
      const response = await importUsers(toCreate.map((r) => ({ name: r.name, phone: r.phone })));
      if (response.success && "created" in response) {
        setResult({ created: response.created ?? [], skipped: response.skipped ?? [] });
        setText("");
        await onImported();
      } else {
        setError(response.error || "No se pudo completar la importación");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-xl">📋</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Importar usuarios desde una lista
        </h2>
      </div>
      <p className="text-gray-600 mb-4">
        En Excel, selecciona las columnas de <strong>nombre</strong> y <strong>celular</strong> (puedes
        incluir la fila de títulos y la columna de dirección: se ignoran), cópialas y pégalas aquí.
        Las contraseñas se generan al enviar los accesos por correo.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-lg text-sm space-y-1">
          <p className="font-semibold">✅ Se crearon {result.created.length} usuario(s).</p>
          {result.skipped.length > 0 && (
            <div>
              <p>Se omitieron {result.skipped.length}:</p>
              <ul className="list-disc list-inside">
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    {s.name}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <label htmlFor="import-list" className="block text-sm font-semibold text-gray-700 mb-2">
        Lista de personas
      </label>
      <textarea
        id="import-list"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"María José Pérez López\t0991234567\nJuan Carlos Gómez Ruiz\t0987654321"}
        className="w-full font-mono text-sm"
      />

      {rows.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
              {toCreate.length} por crear
            </span>
            {repeated > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                {repeated} repetida(s) en la lista: se omiten
              </span>
            )}
            {alreadyThere > 0 && (
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                {alreadyThere} ya registrada(s): se omiten
              </span>
            )}
            {withoutName > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold">
                {withoutName} sin nombre: se omiten
              </span>
            )}
            {phoneWarnings > 0 && (
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-semibold">
                {phoneWarnings} con celular incompleto (revísalo después)
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Nombre</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Celular</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => {
                  const status =
                    r.problem === "sin-nombre"
                      ? { text: "Sin nombre", cls: "text-red-700" }
                      : r.problem === "repetido-en-lista"
                      ? { text: "Repetido en la lista", cls: "text-amber-700" }
                      : r.exists
                      ? { text: "Ya registrado", cls: "text-gray-500" }
                      : { text: "Nuevo", cls: "text-green-700" };
                  return (
                    <tr key={`${r.line}-${i}`}>
                      <td className="px-3 py-1.5 text-gray-400 tabular-nums">{i + 1}</td>
                      <td className="px-3 py-1.5 text-gray-900">{r.name || "—"}</td>
                      <td className={`px-3 py-1.5 tabular-nums ${r.phoneWarning ? "text-orange-700 font-semibold" : "text-gray-700"}`}>
                        {r.phone || "—"}
                        {r.phoneWarning && " ⚠️"}
                      </td>
                      <td className={`px-3 py-1.5 font-medium ${status.cls}`}>{status.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting || toCreate.length === 0}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg"
          >
            {isImporting
              ? `⏳ Creando ${toCreate.length} usuario(s)… no cierres esta página`
              : `Crear ${toCreate.length} usuario(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
