const OEFFENTLICHE_MELDUNGEN = [
  {
    title: "Sommerpause!",
    date: "01.04.2026",
    url: "",
    text: `<p><strong>Das EZH und demzufolge auch die Geschäftsstelle bleiben bis zum Beginn der Saison 2026-2027 geschlossen!</strong></p>`,
  },
  {
    title: "Deutschlandpokal 2026",
    date: "10.03.2026",
    url: "",
    text: `
<p><span>Der Deutschlandpokal 2026 fand vom 06.03.2026 bis 08.03.2026 im Eissportzentrum Herzogenried in Mannheim statt.</span></p>
<p><span>Die besten Nachwuchseiskunstläufer Deutschlands waren in Mannheim zu Gast! Der Nachwuchs des Mannheimer ERC begeisterte das heimische Publikum. Sie gewannen 3 x Gold und erreichten insgesamt 5 Podestplätze.</span></p>
<p><a href="https://eislauf-union.de/de/events/deutschlandpokal">Alle detaillierte Informationen finden Sie hier</a></p>
<p><a href="https://www.wochenblatt-reporter.de/mannheim/c-community/deutschland-pokal-2026-im-eiskunstlaufen-nachwuchselite-zu-gast-in-mannheim_a707659">Den Vorbericht vom Wochenblatt finden Sie hier</a></p>
<p><a href="https://eislauf-union.de/de/media1/pressemitteilungen/1300-fast-150-eiskunstlauf-talente-beim-deutschlandpokal-2026-in-mannheim">Pressebericht der Deutschen Eislauf-Union</a></p>
<p><a href="https://www.wochenblatt-reporter.de/mannheim/c-community/dreimal-gold-und-fuenf-podestplaetze-erfolgreicher-deutschlandpokal-fuer-den-mannheimer-erc_a727027">Bericht Wochenblatt</a></p>
<p><a onclick="window.open(this.href); return false;" href="https://www.merc-online.de/files/deutschland-pokal-_titel_f__r_mannheimer_erc_und_d_260311_132838.pdf">Bericht der Rheinpfalz</a></p>`,
  },
  {
    title: "Nachruf Karl Hager",
    date: "01.09.2024",
    url: "",
    text: `<a href="https://www.merc-online.de/files/trauenrrede_f__r_den_merc_f__r_karl_hager.pdf">Bitte finden Sie hier den Nachruf von unserem verstorbenen&nbsp; Ehrenvorsitzenden Karl Hager!</a>`,
  },
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
  OEFFENTLICHE_MELDUNGEN_MAX_DATE = OEFFENTLICHE_MELDUNGEN_DATES.at(-1);
}

const OEFFENTLICHE_MELDUNGEN_DATES_SORTED = OEFFENTLICHE_MELDUNGEN.toSorted(
  (a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;
    return dateB - dateA;
  },
);
