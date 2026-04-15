/* ========================================
   DATEN FÜR WETTBEWERBE
   Hier neue Wettbewerbe hinzufügen.
   ======================================== */

const wettbewerbeData = [
  {
    id: "dm-2025",
    title: "Deutsche Meisterschaften 2025",
    date: "01.01.2029",
    description:
      "Spannende Wettkämpfe in Berlin. Unsere Athleten haben 3 Medaillen geholt.",
    coverImage: "images/82331e4d-ed93-4d10-8211-51c107e9e614.jpg",
    gallery: [
      "images/82331e4d-ed93-4d10-8211-51c107e9e614.jpg",
      "images/Bild2.jpeg",
      "https://via.placeholder.com/800x600?text=Siegerehrung",
      "https://via.placeholder.com/800x600?text=Lauf+Kuer",
    ],
  },
  {
    id: "jugend-2025",
    title: "Jugendmeisterschaften Mannheim",
    date: "01.03.2025",
    description:
      "Der Nachwuchs zeigt sein Können im heimischen Eissportzentrum.",
    coverImage: "images/Bild2.jpeg",
    gallery: [
      "images/Bild2.jpeg",
      "https://via.placeholder.com/800x600?text=Nachwuchs+1",
      "https://via.placeholder.com/800x600?text=Nachwuchs+2",
    ],
  },
  {
    id: "sommer-2025",
    title: "Internationales Sommerturnier",
    date: "01.07.2025",
    description: "Gäste aus ganz Europa zu Besuch in Mannheim.",
    coverImage: "images/dc0f7fd0-3eea-4d4e-9135-640f62c069b7.jpg",
    gallery: [
      "images/dc0f7fd0-3eea-4d4e-9135-640f62c069b7.jpg",
      "https://via.placeholder.com/800x600?text=Sommer+Eis",
      "https://via.placeholder.com/800x600?text=Gruppenfoto",
    ],
  },
  {
    id: "placeholder-2026-0",
    title: "Internationales Platzhalterturnier",
    date: "01.03.2026",
    description: `Es sind viele Leute gekommen um einen Platz zu halten.
    Es sind viele Leute gekommen um einen Platz zu halten.
    Es sind viele Leute gekommen um einen Platz zu halten.
    Es sind viele Leute gekommen um einen Platz zu halten.
    Es sind viele Leute gekommen um einen Platz zu halten.
    Es sind viele Leute gekommen um einen Platz zu halten.
    Es sind viele Leute gekommen um einen Platz zu halten.
    Es sind viele Leute gekommen um einen Platz zu halten.`,
    coverImage: "",
    gallery: [],
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

const NEWS_LIST_DATES = wettbewerbeData
  .map((item) => parseDate(item.date))
  .filter((d) => d !== null)
  .sort((a, b) => a - b);

let NEWS_LIST_MIN_DATE = null;
let NEWS_LIST_MAX_DATE = null;
if (NEWS_LIST_DATES.length > 0) {
  NEWS_LIST_MIN_DATE = NEWS_LIST_DATES[0];
  NEWS_LIST_MAX_DATE = NEWS_LIST_DATES[NEWS_LIST_DATES.length - 1];
}

const wettbewerbeData_DATES_SORTED = wettbewerbeData.toSorted((a, b) => {
  const dateA = parseDate(a.date);
  const dateB = parseDate(b.date);
  if (dateA === null && dateB === null) return 0;
  if (dateA === null) return 1;
  if (dateB === null) return -1;
  return dateB - dateA;
});
