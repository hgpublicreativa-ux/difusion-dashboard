// Parsing and cleanup for the bulk "Importar usuarios" tool. Pure functions
// shared by the client preview and the server action.

const LOWERCASE_WORDS = new Set(["de", "del", "la", "las", "los", "y", "da", "do", "dos", "das"]);

// "  DIANA CAROLINA estrella " -> "Diana Carolina Estrella"
export function cleanName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word, i) => {
      const lower = word.toLocaleLowerCase("es");
      if (i > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      return lower
        .split("-")
        .map((part) => part.charAt(0).toLocaleUpperCase("es") + part.slice(1))
        .join("-");
    })
    .join(" ");
}

// Ecuador mobile numbers: restores the leading 0 Excel drops and turns
// +593 9XXXXXXXX into 09XXXXXXXX
export function cleanPhone(raw: string): string {
  let digits = raw.replace(/\.0$/, "").replace(/\D/g, "");
  if (digits.startsWith("593") && digits.length === 12) digits = `0${digits.slice(3)}`;
  if (digits.length === 9 && digits.startsWith("9")) digits = `0${digits}`;
  return digits;
}

export function isValidPhone(phone: string): boolean {
  return /^09\d{8}$/.test(phone);
}

// Accent- and case-insensitive key used to detect repeated names
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export interface ParsedRow {
  line: number;
  name: string;
  phone: string;
  // Set when the row can't be imported as-is
  problem?: "sin-nombre" | "repetido-en-lista";
  phoneWarning?: boolean;
}

// Accepts rows pasted from Excel (tab separated) or typed as
// "Nombre; Teléfono" / "Nombre, Teléfono". Only the first two columns are
// used (any address column is ignored) and a header row is skipped.
export function parseUserList(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach((rawLine, index) => {
    if (!rawLine.trim()) return;
    const cells = rawLine.includes("\t")
      ? rawLine.split("\t")
      : rawLine.split(/[;,]/);
    const name = cleanName(cells[0] || "");
    const phone = cleanPhone(cells[1] || "");

    // Skip a header like "NOMBRES COMPLETOS | CELULAR"
    if (index === 0 && /nombre/i.test(name) && !/\d/.test(cells[1] || "")) return;
    if (!name && !phone) return;

    const row: ParsedRow = { line: index + 1, name, phone };
    if (!name) row.problem = "sin-nombre";
    else if (seen.has(nameKey(name))) row.problem = "repetido-en-lista";
    if (phone && !isValidPhone(phone)) row.phoneWarning = true;
    if (name) seen.add(nameKey(name));
    rows.push(row);
  });

  return rows;
}
