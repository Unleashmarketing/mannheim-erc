const OEFFENTLICHE_MELDUNGEN = [
  {
    title: "Mitgliederversammlung",
    date: "01.04.1977",
    url: "",
    text: "Platzhaltertext",
  },
];

function parseDate(dateStr) {
  if (!dateStr || dateStr === "N/A" || typeof dateStr !== "string") return null;

  const germanMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (germanMatch) {
    return new Date(
      Number.parseInt(germanMatch[3]),
      Number.parseInt(germanMatch[2]) - 1,
      Number.parseInt(germanMatch[1]),
    );
  }

  const monthMap = {
    januar: 0,
    january: 0,
    februar: 1,
    february: 1,
    märz: 2,
    march: 2,
    april: 3,
    mai: 4,
    may: 4,
    juni: 5,
    june: 5,
    juli: 6,
    july: 6,
    august: 7,
    september: 8,
    oktober: 9,
    october: 9,
    november: 10,
    dezember: 11,
    december: 11,
  };

  const words = dateStr.toLowerCase().split(/[\s-]+/);
  let year = words.find((w) => w.match(/^\d{4}$/));
  let month = words.find((w) => monthMap.hasOwnProperty(w));

  if (year && month !== undefined) {
    return new Date(Number.parseInt(year), monthMap[month], 1);
  }

  return null;
}

const OEFFENTLICHE_MELDUNGEN_DATES = OEFFENTLICHE_MELDUNGEN.map((item) =>
  parseDate(item.date),
)
  .filter((d) => d !== null)
  .sort((a, b) => a - b);

let OEFFENTLICHE_MELDUNGEN_MIN_DATE = null;
let OEFFENTLICHE_MELDUNGEN_MAX_DATE = null;
if (OEFFENTLICHE_MELDUNGEN_DATES.length > 0) {
  OEFFENTLICHE_MELDUNGEN_MIN_DATE = OEFFENTLICHE_MELDUNGEN_DATES[0];
  OEFFENTLICHE_MELDUNGEN_MAX_DATE =
    OEFFENTLICHE_MELDUNGEN_DATES[OEFFENTLICHE_MELDUNGEN_DATES.length - 1];
}
