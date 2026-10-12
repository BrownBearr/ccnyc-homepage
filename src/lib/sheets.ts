import "server-only";

export type SheetRow = Record<string, string>;

export async function fetchSheetRows(range: string): Promise<SheetRow[]> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!apiKey || !sheetId) return [];

  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const data: { values?: string[][] } = await response.json();
    const [header, ...body] = data.values ?? [];
    if (!header) return [];
    const keys = header.map(key => key.trim());
    return body.filter(row => row.some(cell => cell?.trim())).map(row => Object.fromEntries(keys.map((key, index) => [key, (row[index] ?? "").trim()])));
  } catch (error) {
    console.warn(`[sheets] Could not read ${range}:`, error);
    return [];
  }
}

export type MeetupEvent = { date: string; time: string; title: string; location: string };

export function sheetRowsToEvents(rows: SheetRow[]): MeetupEvent[] {
  return rows.map(row => ({
    date: row["Meeting date"],
    time: row["Override time"] || "6PM-8PM",
    title: row["Override title"] || "CCNYC meetup",
    location: row["Override location"] || `Pier 57, ${row["Classroom"] ? `${row["Classroom"]} classroom` : "classroom TBD"}`,
  }));
}

export async function getNextPosterEvent() {
  const events = sheetRowsToEvents(await fetchSheetRows("'Poster Signups'!A2:L"));
  const upcoming = events.map(event => ({ event, date: new Date(`${event.date} 12:00:00`) }))
    .filter(item => !Number.isNaN(item.date.valueOf()) && item.date.valueOf() >= Date.now() - 86_400_000)
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())[0];
  if (upcoming) return { date: upcoming.date, location: upcoming.event.location };
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const date = new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
  date.setUTCDate(date.getUTCDate() + ((2 - date.getUTCDay() + 7) % 7 || 7));
  return { date, location: "Location TBA" };
}
