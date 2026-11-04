(() => {
  const VOTE_TYPES = ["film", "serial", "tvshow"];
  const MAX_VOTE_PAGES = 100;
  const WIKIDATA_BATCH = 200;
  const READ_DELAY_MS = 150;
  const WRITE_DELAY_MS = 600;
  const MAX_FAILURES_IN_A_ROW = 3;
  const DEFAULT_WRITE_LIMIT = 10;
  const SEARCH_HITS = 8;
  const ROMAN_NUMERALS = { ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9" };
  const LANGUAGE_STORAGE_KEY = "filmweb-import-language";

  const polishRatings = (amount) => {
    const lastDigit = amount % 10;
    const lastTwoDigits = amount % 100;
    if (amount === 1) return "1 ocenę";
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) return `${amount} oceny`;
    return `${amount} ocen`;
  };

  const englishRatings = (amount) => `${amount} ${amount === 1 ? "rating" : "ratings"}`;

  const TEXT = {
    pl: {
      title: "Import ocen na Filmweb",
      languageButton: "EN",
      languageTitle: "Switch to English",
      close: "Zamknij",
      step: (number) => `Krok ${number} z 3`,
      chooseTitle: "Wybierz plik z ocenami",
      chooseHint: "Obsługiwane pliki:",
      order: "Najpierw ratings.csv, potem ewentualnie pozostałe.",
      chooseFile: "Wybierz plik",
      noFile: "Nie wybrano pliku",
      checkingTitle: "Sprawdzam plik",
      checkingHint: "Nie zamykaj tej karty. Na tym etapie nic nie jest zapisywane.",
      reviewTitle: "Sprawdź i zapisz",
      reviewHint: (total) => `Pozycji w pliku: ${total}. Na Filmwebie nic się jeszcze nie zmieniło.`,
      nothingTitle: "Nie ma nic do zapisania",
      nothingHint: (total) => `Pozycji w pliku: ${total}. Na Filmwebie nic się nie zmieniło.`,
      savingTitle: "Zapisuję oceny",
      savingHint: "Nie zamykaj tej karty.",
      doneTitle: "Gotowe",
      doneErrorsTitle: "Zakończono z błędami",
      doneHint: (saved) => `Zapisano ${polishRatings(saved)}. Sprawdź wynik na swoim profilu.`,
      errorTitle: "Nie udało się sprawdzić pliku",
      errorHint: "Popraw problem i wybierz plik ponownie.",
      checkLogin: "Sprawdź też, czy jesteś zalogowany.",
      preparing: "Przygotowuję…",
      progressOwnVotes: (total) => `Sprawdzam Twoje oceny: ${total}`,
      progressMatching: (current, total) => `Dopasowuję tytuły: ${current} z ${total}`,
      progressSaving: (current, total, title) => `Zapisuję ${current} z ${total}: ${title}`,
      limitLabel: "Ile zapisać teraz:",
      all: "Wszystkie",
      limitHint: "Zacznij od kilku i sprawdź wynik na profilu. Tytuły już ocenione nie zostaną zmienione.",
      save: (amount) => `Zapisz ${polishRatings(amount)} na Filmwebie`,
      enterNumber: "Podaj liczbę ocen",
      report: "Pobierz raport CSV",
      showList: (total) => `Pokaż pominięte tytuły (${total})`,
      hideList: (total) => `Ukryj pominięte tytuły (${total})`,
      statReady: "Do zapisania",
      statSaved: "Zapisano",
      statRated: "Już ocenione, pominięte",
      statAmbiguous: "Kilka możliwych tytułów",
      statMissing: "Nie znaleziono",
      statFailed: "Błędy zapisu",
      groupRated: "Już ocenione",
      noteUnrated: "Bez oceny",
      noteUnratedText: "zapiszą się jako obejrzane.",
      noteMissingText: "nie zapiszą się, dodaj je ręcznie.",
      noteAmbiguousText: "nie zapiszą się, wybierz właściwy ręcznie.",
      unrated: "bez oceny",
      confirmClose: "Trwa praca skryptu. Zamknąć okno?",
      unknownFile: "Nie rozpoznano pliku. Użyj ratings.csv z IMDb lub ratings.csv, watched.csv albo diary.csv z Letterboxd.",
      emptyFile: "W pliku nie ma żadnych tytułów.",
      reportFile: "filmweb-import-raport.csv",
      reportColumns: ["Tytuł", "Rok", "Ocena", "Data", "IMDb", "Status", "Filmweb ID", "Tytuł Filmweb", "Rok Filmweb"],
      status: {
        ready: "do zapisania",
        rated: "już ocenione",
        ambiguous: "kilka możliwych tytułów",
        missing: "nie znaleziono",
        saved: "zapisano",
        failed: "błąd zapisu",
      },
    },
    en: {
      title: "Import ratings to Filmweb",
      languageButton: "PL",
      languageTitle: "Przełącz na polski",
      close: "Close",
      step: (number) => `Step ${number} of 3`,
      chooseTitle: "Choose your ratings file",
      chooseHint: "Supported files:",
      order: "Start with ratings.csv, then add the others if you want.",
      chooseFile: "Choose file",
      noFile: "No file selected",
      checkingTitle: "Checking the file",
      checkingHint: "Keep this tab open. Nothing is saved at this stage.",
      reviewTitle: "Review and save",
      reviewHint: (total) => `Items in the file: ${total}. Nothing has changed on Filmweb yet.`,
      nothingTitle: "Nothing to save",
      nothingHint: (total) => `Items in the file: ${total}. Nothing has changed on Filmweb.`,
      savingTitle: "Saving ratings",
      savingHint: "Keep this tab open.",
      doneTitle: "Done",
      doneErrorsTitle: "Finished with errors",
      doneHint: (saved) => `Saved ${englishRatings(saved)}. Check the result on your profile.`,
      errorTitle: "Could not check the file",
      errorHint: "Fix the problem and choose the file again.",
      checkLogin: "Also make sure you are logged in.",
      preparing: "Preparing…",
      progressOwnVotes: (total) => `Checking your ratings: ${total}`,
      progressMatching: (current, total) => `Matching titles: ${current} of ${total}`,
      progressSaving: (current, total, title) => `Saving ${current} of ${total}: ${title}`,
      limitLabel: "How many to save now:",
      all: "All",
      limitHint: "Start with a few and check your profile. Titles you have already rated will not be changed.",
      save: (amount) => `Save ${englishRatings(amount)} to Filmweb`,
      enterNumber: "Enter the number of ratings",
      report: "Download CSV report",
      showList: (total) => `Show skipped titles (${total})`,
      hideList: (total) => `Hide skipped titles (${total})`,
      statReady: "Ready to save",
      statSaved: "Saved",
      statRated: "Already rated, skipped",
      statAmbiguous: "Several possible titles",
      statMissing: "Not found",
      statFailed: "Save errors",
      groupRated: "Already rated",
      noteUnrated: "Unrated",
      noteUnratedText: "will be saved as watched.",
      noteMissingText: "will not be saved, add them manually.",
      noteAmbiguousText: "will not be saved, pick the right one manually.",
      unrated: "unrated",
      confirmClose: "The script is still working. Close the window?",
      unknownFile: "File not recognized. Use ratings.csv from IMDb or ratings.csv, watched.csv or diary.csv from Letterboxd.",
      emptyFile: "There are no titles in this file.",
      reportFile: "filmweb-import-report.csv",
      reportColumns: ["Title", "Year", "Rating", "Date", "IMDb", "Status", "Filmweb ID", "Filmweb title", "Filmweb year"],
      status: {
        ready: "ready to save",
        rated: "already rated",
        ambiguous: "several possible titles",
        missing: "not found",
        saved: "saved",
        failed: "save error",
      },
    },
  };

  const loadLanguage = () => {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "pl";
    } catch {
      return "pl";
    }
  };

  const saveLanguage = () => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      return;
    }
  };

  let language = loadLanguage();

  const t = (key, ...args) => {
    const value = TEXT[language][key];
    return typeof value === "function" ? value(...args) : value;
  };

  const translatedError = (textKey) => Object.assign(new Error(TEXT.en[textKey]), { textKey });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getCleanFetch = () => {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    document.documentElement.appendChild(frame);
    return frame.contentWindow.fetch.bind(frame.contentWindow);
  };

  const cleanFetch = getCleanFetch();

  const fetchWithRetry = async (url, options, attempts = 4) => {
    for (let attempt = 1; ; attempt++) {
      let response;
      try {
        response = await cleanFetch(url, options);
      } catch (error) {
        if (attempt >= attempts) throw error;
        await sleep(1000 * attempt);
        continue;
      }
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt >= attempts) return response;
      await sleep(1500 * attempt);
    }
  };

  const apiUrl = (endpoint) => `${location.origin}/api/v1/${endpoint}`;

  const filmweb = async (endpoint) => {
    const response = await fetchWithRetry(apiUrl(endpoint), {
      credentials: "include",
      headers: { "X-Locale": "pl" },
    });
    if (!response.ok) throw new Error(`Filmweb: błąd ${response.status} dla ${endpoint}`);
    return response.json();
  };

  const getCookie = (name) => {
    const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
  };

  const refreshSession = () =>
    cleanFetch(apiUrl("jwt"), { method: "POST", credentials: "include", headers: { accept: "*/*" } });

  const post = async (endpoint, body, canRefresh = true) => {
    if (!getCookie("XSRF-TOKEN")) await refreshSession();
    const headers = { "Content-Type": "application/json", "X-Locale": "pl", "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") };
    const userToken = getCookie("_fwuser_token");
    if (userToken) headers["X-Fwuser-Token"] = userToken;
    const response = await fetchWithRetry(apiUrl(endpoint), {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(body),
    });
    if (response.status === 403 && canRefresh) {
      await refreshSession();
      return post(endpoint, body, false);
    }
    if (!response.ok) throw new Error(`Filmweb: błąd ${response.status} dla ${endpoint}`);
  };

  const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (char === '"') {
          quoted = false;
        } else {
          cell += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\n") {
        row.push(cell.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    if (cell || row.length) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
    }
    const [header, ...body] = rows.filter((line) => line.some(Boolean));
    if (!header) return [];
    return body.map((line) => Object.fromEntries(header.map((name, index) => [name.trim(), line[index] ?? ""])));
  };

  const toRating = (value, multiplier = 1) => {
    const rating = Number(String(value ?? "").replace(",", ".")) * multiplier;
    return Number.isInteger(rating) && rating >= 1 && rating <= 10 ? rating : 0;
  };

  const toDate = (value) => (/^\d{4}-\d{2}-\d{2}/.test(value ?? "") ? value.slice(0, 10) : "");

  const fromImdb = (row) => ({
    title: row["Original Title"] || row.Title,
    alternateTitle: row.Title,
    year: Number(row.Year) || 0,
    rating: toRating(row["Your Rating"]),
    date: toDate(row["Date Rated"]),
    imdbId: row.Const,
    isSeries: /series/i.test(row["Title Type"] ?? ""),
  });

  const fromLetterboxd = (row) => ({
    title: row.Name,
    alternateTitle: "",
    year: Number(row.Year) || 0,
    rating: toRating(row.Rating, 2),
    date: toDate(row["Watched Date"] || row.Date),
    imdbId: "",
    isSeries: false,
  });

  const fromFilmwebExport = (row) => ({
    title: row.Title,
    alternateTitle: "",
    year: Number(row.Year) || 0,
    rating: toRating(row.Rating10),
    date: toDate(row.WatchedDate),
    imdbId: row.imdbID ?? "",
    isSeries: false,
  });

  const fromJson = (row) => ({
    title: row.title ?? "",
    alternateTitle: "",
    year: Number(row.year) || 0,
    rating: toRating(row.rating),
    date: toDate(row.watched_date),
    imdbId: row.imdb_id ?? "",
    isSeries: row.season !== undefined,
  });

  const parseFile = (name, text) => {
    const content = text.replace(/^\uFEFF/, "");
    if (/\.json$/i.test(name)) return JSON.parse(content).map(fromJson);
    const rows = parseCsv(content);
    if (!rows.length) return [];
    const first = rows[0];
    if ("Const" in first) return rows.map(fromImdb);
    if ("Letterboxd URI" in first) return rows.map(fromLetterboxd);
    if ("Rating10" in first) return rows.map(fromFilmwebExport);
    throw translatedError("unknownFile");
  };

  const normalize = (text) =>
    String(text ?? "")
      .replace(/ł/g, "l")
      .replace(/Ł/g, "L")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\b(ii|iii|iv|v|vi|vii|viii|ix)\b/g, (numeral) => ROMAN_NUMERALS[numeral])
      .replace(/[^\p{L}\p{N}]/gu, "");

  const getOwnVotes = async (onProgress) => {
    const own = new Set();
    for (const type of VOTE_TYPES) {
      for (let page = 1; page <= MAX_VOTE_PAGES; page++) {
        const rows = await filmweb(`logged/vote/title/${type}?page=${page}`);
        if (!rows.length) break;
        rows.forEach((vote) => own.add(vote.entity));
        onProgress("progressOwnVotes", undefined, own.size);
        await sleep(READ_DELAY_MS);
      }
    }
    return own;
  };

  const getFilmwebIds = async (items) => {
    const found = new Map();
    const imdbIds = [...new Set(items.map((item) => item.imdbId).filter((id) => /^tt\d+$/.test(id)))];
    for (let start = 0; start < imdbIds.length; start += WIKIDATA_BATCH) {
      const values = imdbIds.slice(start, start + WIKIDATA_BATCH).map((id) => `"${id}"`).join(" ");
      const query = `SELECT ?imdb ?fw WHERE { VALUES ?imdb { ${values} } ?item wdt:P345 ?imdb; wdt:P5032 ?fw. }`;
      try {
        const response = await fetchWithRetry("https://query.wikidata.org/sparql", {
          method: "POST",
          credentials: "omit",
          headers: { Accept: "application/sparql-results+json" },
          body: new URLSearchParams({ query }),
        });
        if (!response.ok) continue;
        const data = await response.json();
        for (const row of data.results.bindings) {
          if (/^\d+$/.test(row.fw.value) && !found.has(row.imdb.value)) found.set(row.imdb.value, Number(row.fw.value));
        }
      } catch (error) {
        console.warn("Wikidata niedostępne, szukam po tytułach.", error);
      }
      await sleep(300);
    }
    return found;
  };

  const searchFilmweb = async (item) => {
    const wanted = new Set([normalize(item.title), normalize(item.alternateTitle)].filter(Boolean));
    const queries = [...new Set([item.title, item.alternateTitle].filter(Boolean))];
    const candidates = new Map();
    for (const query of queries) {
      const data = await filmweb(`live/search?query=${encodeURIComponent(query)}&pageSize=${SEARCH_HITS}`);
      await sleep(READ_DELAY_MS);
      for (const hit of (data.searchHits ?? []).slice(0, SEARCH_HITS)) {
        const allowed = hit.type === "film" || hit.type === "serial";
        if (allowed && wanted.has(normalize(hit.matchedTitle))) candidates.set(hit.id, hit);
      }
    }
    const checked = [];
    for (const id of candidates.keys()) {
      checked.push({ id, info: await filmweb(`title/${id}/info`) });
      await sleep(READ_DELAY_MS);
    }
    const exact = checked.filter(({ info }) => info.year === item.year);
    const near = checked.filter(({ info }) => Math.abs(info.year - item.year) === 1);
    const pool = !item.year ? checked : exact.length ? exact : near;
    const sameKind = pool.filter(({ info }) => (info.type !== "film") === item.isSeries);
    const final = sameKind.length ? sameKind : pool;
    if (final.length === 1) return { status: "ready", ...final[0] };
    return { status: final.length ? "ambiguous" : "missing" };
  };

  const matchItems = async (items, ownVotes, onProgress) => {
    const byImdb = await getFilmwebIds(items);
    const results = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let result = { status: "missing" };
      try {
        const knownId = byImdb.get(item.imdbId);
        if (knownId) {
          result = { status: "ready", id: knownId, info: await filmweb(`title/${knownId}/info`) };
          await sleep(READ_DELAY_MS);
        } else if (item.title) {
          result = await searchFilmweb(item);
        }
      } catch (error) {
        console.warn(`Pominięto: ${item.title}`, error);
      }
      if (result.id && ownVotes.has(result.id)) result.status = "rated";
      results.push({ ...item, ...result });
      onProgress("progressMatching", (i + 1) / items.length, i + 1, items.length);
    }
    return results;
  };

  const saveVote = async (item) => {
    const entityName = item.info.type;
    await post("vote", { entity: item.id, rate: item.rating, entityName });
    if (!item.date) return;
    try {
      await post("vote/date", { entity: item.id, viewDate: Number(item.date.replace(/-/g, "")), entityName });
    } catch (error) {
      console.warn(`Ocena zapisana bez daty: ${item.title}`, error);
    }
  };

  const csvCell = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const downloadReport = (results) => {
    const rows = results.map((item) => [
      item.title, item.year, item.rating, item.date, item.imdbId, t("status")[item.status],
      item.id, item.info?.originalTitle || item.info?.title, item.info?.year,
    ]);
    const text = [t("reportColumns"), ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = t("reportFile");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const element = (tag, properties = {}, style = "") => {
    const node = Object.assign(document.createElement(tag), properties);
    node.style.cssText = style;
    return node;
  };

  const COLORS = {
    panel: "#1c1c1c",
    card: "#2a2a2a",
    border: "#3a3a3a",
    text: "#ffffff",
    muted: "#b5b5b5",
    accent: "#ffc200",
    success: "#4cc38a",
    warning: "#f5a524",
    danger: "#ff6b6b",
  };

  const baseButton = "border:0;border-radius:8px;font:700 14px/1.2 Arial,sans-serif;cursor:pointer;";
  const primaryButton = `${baseButton}display:none;width:100%;margin-top:10px;padding:12px;background:${COLORS.accent};color:#000`;
  const secondaryButton = `${baseButton}padding:9px 12px;background:${COLORS.card};color:${COLORS.text};border:1px solid ${COLORS.border}`;

  const panel = element(
    "div",
    {},
    `position:fixed;top:16px;right:16px;z-index:2147483647;box-sizing:border-box;width:360px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;padding:18px;border-radius:12px;background:${COLORS.panel};color:${COLORS.text};font:14px/1.45 Arial,sans-serif;box-shadow:0 10px 36px rgba(0,0,0,.55)`
  );
  const header = element("div", {}, "display:flex;align-items:center;gap:8px;margin-bottom:12px");
  const heading = element("div", {}, "flex:1;font-size:17px;font-weight:700");
  const languageButton = element(
    "button",
    { type: "button" },
    `${baseButton}flex:none;padding:5px 8px;background:${COLORS.card};color:${COLORS.text};border:1px solid ${COLORS.border};font-size:12px`
  );
  const closeButton = element(
    "button",
    { type: "button", textContent: "×" },
    `${baseButton}flex:none;width:30px;height:30px;padding:0;background:transparent;color:${COLORS.muted};font-size:22px`
  );
  const stepLabel = element("div", {}, `color:${COLORS.accent};font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase`);
  const stepTitle = element("div", {}, "font-size:15px;font-weight:700;margin-top:2px");
  const stepHint = element("div", {}, `color:${COLORS.muted};margin-top:2px`);
  const sourceFiles = element("div", {}, `margin-top:8px;color:${COLORS.muted}`);
  const sourceRow = (service, files) => {
    const row = element("div", {}, "margin-top:2px");
    row.append(element("span", { textContent: `${service}: ` }, `color:${COLORS.text};font-weight:700`));
    files.forEach((name, index) => {
      if (index) row.append(", ");
      const isMain = name === "ratings.csv";
      row.append(element("span", { textContent: name }, isMain ? `color:${COLORS.accent};font-weight:700` : ""));
    });
    return row;
  };
  const sourceOrder = element("div", {}, "margin-top:4px;font-size:13px");
  sourceFiles.append(
    sourceRow("IMDb", ["ratings.csv"]),
    sourceRow("Letterboxd", ["ratings.csv", "watched.csv", "diary.csv"]),
    sourceOrder
  );
  const fileRow = element("div", {}, "display:flex;align-items:center;gap:10px;margin-top:12px");
  const fileInput = element("input", { type: "file", accept: ".csv,.json" }, "display:none");
  const fileButton = element("button", { type: "button" }, secondaryButton);
  const fileName = element("div", {}, `min-width:0;overflow:hidden;color:${COLORS.muted};text-overflow:ellipsis;white-space:nowrap`);
  const progressBox = element("div", {}, "display:none;margin-top:12px");
  const progressTrack = element("div", {}, `height:8px;overflow:hidden;border-radius:4px;background:${COLORS.card}`);
  const progressBar = element("div", {}, `width:0;height:100%;background:${COLORS.accent};transition:width .2s`);
  const progressText = element("div", {}, `margin-top:6px;color:${COLORS.muted};font-size:13px`);
  const stats = element("div", {}, `display:none;margin-top:12px;padding:4px 12px;border-radius:8px;background:${COLORS.card}`);
  const note = element("div", {}, `display:none;margin-top:10px;color:${COLORS.text};font-size:13px`);
  const errorBox = element("div", {}, `display:none;margin-top:12px;padding:10px 12px;border-radius:8px;background:rgba(255,107,107,.14);color:${COLORS.danger}`);
  const limitBox = element("div", {}, "display:none;margin-top:12px");
  const limitRow = element("div", {}, "display:flex;align-items:center;gap:8px");
  const limitLabel = element("label", {}, "flex:1");
  const limitInput = element(
    "input",
    { type: "number", min: "1", value: String(DEFAULT_WRITE_LIMIT) },
    `box-sizing:border-box;width:76px;padding:7px 8px;border:1px solid ${COLORS.border};border-radius:8px;background:${COLORS.card};color:${COLORS.text};font:14px Arial,sans-serif`
  );
  const allButton = element("button", { type: "button" }, secondaryButton);
  const limitHint = element("div", {}, `margin-top:6px;color:${COLORS.muted};font-size:13px`);
  const saveButton = element("button", { type: "button" }, primaryButton);
  const reportButton = element("button", { type: "button" }, `${secondaryButton};display:none;width:100%;margin-top:8px`);
  const listButton = element("button", { type: "button" }, `${secondaryButton};display:none;width:100%;margin-top:8px`);
  const listBox = element(
    "div",
    {},
    `display:none;box-sizing:border-box;max-height:260px;overflow:auto;margin-top:8px;padding:2px 12px 8px;border-radius:8px;background:${COLORS.card}`
  );

  header.append(heading, languageButton, closeButton);
  fileRow.append(fileButton, fileName, fileInput);
  progressTrack.append(progressBar);
  progressBox.append(progressTrack, progressText);
  limitRow.append(limitLabel, limitInput, allButton);
  limitBox.append(limitRow, limitHint);
  panel.append(header, stepLabel, stepTitle, stepHint, sourceFiles, fileRow, progressBox, errorBox, stats, note, limitBox, saveButton, listButton, listBox, reportButton);
  document.body.append(panel);

  let results = [];
  let busy = false;
  let selectedFile = "";
  let currentStep = null;
  let currentProgress = null;
  let currentError = null;
  const ready = () => results.filter((item) => item.status === "ready");
  const count = (name) => results.filter((item) => item.status === name).length;

  const renderStep = () => {
    const { number, titleKey, hintKey, args } = currentStep;
    stepLabel.textContent = t("step", number);
    stepTitle.textContent = t(titleKey);
    stepHint.textContent = t(hintKey, ...args);
  };

  const setStep = (number, titleKey, hintKey, ...args) => {
    currentStep = { number, titleKey, hintKey, args };
    renderStep();
  };

  const renderProgress = () => {
    if (currentProgress) progressText.textContent = t(currentProgress.key, ...currentProgress.args);
  };

  const setProgress = (key, value, ...args) => {
    currentProgress = { key, args };
    renderProgress();
    if (value !== undefined) progressBar.style.width = `${Math.round(value * 100)}%`;
  };

  const setBusy = (value) => {
    busy = value;
    fileButton.disabled = value;
    saveButton.disabled = value;
    allButton.disabled = value;
    limitInput.disabled = value;
    fileButton.style.opacity = value ? "0.5" : "1";
    fileButton.style.cursor = value ? "default" : "pointer";
    progressBox.style.display = value ? "block" : "none";
    if (value) setProgress("preparing", 0);
  };

  const selectedLimit = () => {
    const value = Math.floor(Number(limitInput.value));
    return Number.isFinite(value) && value >= 1 ? Math.min(value, ready().length) : 0;
  };

  const updateSaveButton = () => {
    const limit = selectedLimit();
    saveButton.textContent = limit ? t("save", limit) : t("enterNumber");
    saveButton.disabled = busy || !limit;
    saveButton.style.opacity = saveButton.disabled ? "0.5" : "1";
    saveButton.style.cursor = saveButton.disabled ? "default" : "pointer";
  };

  const addStat = (label, value, color) => {
    if (!value) return;
    const row = element("div", {}, `display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid ${COLORS.border}`);
    const dot = element("span", {}, `flex:none;width:9px;height:9px;border-radius:50%;background:${color}`);
    const name = element("span", { textContent: label }, "flex:1");
    const amount = element("strong", { textContent: String(value) });
    row.append(dot, name, amount);
    stats.append(row);
  };

  const addNote = (label, value, text, color) => {
    if (!value) return;
    const row = element("div", {}, "margin-top:4px");
    row.append(element("strong", { textContent: `${label} (${value}): ` }, `color:${color}`), text);
    note.append(row);
  };

  const skippedGroups = () =>
    [
      { status: "failed", label: t("statFailed"), color: COLORS.danger },
      { status: "missing", label: t("statMissing"), color: COLORS.danger },
      { status: "ambiguous", label: t("statAmbiguous"), color: COLORS.warning },
      { status: "rated", label: t("groupRated"), color: COLORS.muted },
    ]
      .map((group) => ({ ...group, items: results.filter((item) => item.status === group.status) }))
      .filter((group) => group.items.length);

  const renderSkippedList = () => {
    listBox.replaceChildren();
    for (const group of skippedGroups()) {
      const title = element("div", {}, "display:flex;align-items:center;gap:8px;margin-top:10px;font-weight:700");
      title.append(
        element("span", {}, `flex:none;width:9px;height:9px;border-radius:50%;background:${group.color}`),
        element("span", { textContent: `${group.label} (${group.items.length})` })
      );
      listBox.append(title);
      for (const item of group.items) {
        const row = element("div", {}, `display:flex;gap:8px;padding:5px 0;border-bottom:1px solid ${COLORS.border};font-size:13px`);
        const name = item.year ? `${item.title} (${item.year})` : item.title;
        row.append(
          element("span", { textContent: name }, "flex:1;min-width:0;overflow-wrap:anywhere"),
          element("span", { textContent: item.rating ? `★ ${item.rating}` : t("unrated") }, `flex:none;color:${COLORS.muted}`)
        );
        listBox.append(row);
      }
    }
  };

  const updateListButton = () => {
    const total = skippedGroups().reduce((sum, group) => sum + group.items.length, 0);
    const isOpen = listBox.style.display === "block";
    listButton.textContent = t(isOpen ? "hideList" : "showList", total);
    listButton.style.display = total ? "block" : "none";
    if (!total) listBox.style.display = "none";
  };

  const renderSummary = () => {
    const remaining = ready().length;
    const saved = count("saved");
    const failed = count("failed");
    const withoutRating = ready().filter((item) => !item.rating).length;

    stats.replaceChildren();
    addStat(t("statReady"), remaining, COLORS.accent);
    addStat(t("statSaved"), saved, COLORS.success);
    addStat(t("statRated"), count("rated"), COLORS.muted);
    addStat(t("statAmbiguous"), count("ambiguous"), COLORS.warning);
    addStat(t("statMissing"), count("missing"), COLORS.danger);
    addStat(t("statFailed"), failed, COLORS.danger);
    stats.lastElementChild?.style.setProperty("border-bottom", "0");
    stats.style.display = "block";

    note.replaceChildren();
    addNote(t("noteUnrated"), withoutRating, t("noteUnratedText"), COLORS.accent);
    addNote(t("statMissing"), count("missing"), t("noteMissingText"), COLORS.danger);
    addNote(t("statAmbiguous"), count("ambiguous"), t("noteAmbiguousText"), COLORS.warning);
    note.style.display = note.childElementCount ? "block" : "none";

    if (remaining) {
      setStep(2, "reviewTitle", "reviewHint", results.length);
    } else if (saved || failed) {
      setStep(3, failed ? "doneErrorsTitle" : "doneTitle", "doneHint", saved);
    } else {
      setStep(2, "nothingTitle", "nothingHint", results.length);
    }

    limitBox.style.display = remaining ? "block" : "none";
    saveButton.style.display = remaining ? "block" : "none";
    limitInput.max = String(remaining);
    reportButton.style.display = "block";
    renderSkippedList();
    updateListButton();
    updateSaveButton();
  };

  const showSummary = () => {
    limitInput.value = String(Math.min(DEFAULT_WRITE_LIMIT, ready().length || 1));
    renderSummary();
  };

  const renderError = () => {
    if (!currentError) return;
    const message = currentError.textKey ? t(currentError.textKey) : currentError.message || String(currentError);
    errorBox.textContent = `${message} ${t("checkLogin")}`;
  };

  const renderLanguage = () => {
    heading.textContent = t("title");
    languageButton.textContent = t("languageButton");
    languageButton.title = t("languageTitle");
    closeButton.title = t("close");
    sourceOrder.textContent = t("order");
    fileButton.textContent = t("chooseFile");
    fileName.textContent = selectedFile || t("noFile");
    limitLabel.textContent = t("limitLabel");
    allButton.textContent = t("all");
    limitHint.textContent = t("limitHint");
    reportButton.textContent = t("report");
    if (currentStep) renderStep();
    renderProgress();
    renderError();
    if (stats.style.display === "block") {
      renderSummary();
    } else {
      updateSaveButton();
    }
  };

  const clearResults = () => {
    currentError = null;
    stats.style.display = "none";
    note.style.display = "none";
    errorBox.style.display = "none";
    limitBox.style.display = "none";
    saveButton.style.display = "none";
    reportButton.style.display = "none";
    listButton.style.display = "none";
    listBox.style.display = "none";
  };

  languageButton.addEventListener("click", () => {
    language = language === "pl" ? "en" : "pl";
    saveLanguage();
    renderLanguage();
  });

  fileButton.addEventListener("click", () => fileInput.click());

  listButton.addEventListener("click", () => {
    listBox.style.display = listBox.style.display === "block" ? "none" : "block";
    updateListButton();
  });

  fileInput.addEventListener("change", async () => {
    const [file] = fileInput.files;
    if (!file) return;
    clearResults();
    sourceFiles.style.display = "none";
    selectedFile = file.name;
    fileName.textContent = file.name;
    setBusy(true);
    setStep(1, "checkingTitle", "checkingHint");
    try {
      const items = parseFile(file.name, await file.text()).filter((item) => item.title || item.imdbId);
      if (!items.length) throw translatedError("emptyFile");
      const ownVotes = await getOwnVotes(setProgress);
      results = await matchItems(items, ownVotes, setProgress);
      setBusy(false);
      showSummary();
    } catch (error) {
      console.error(error);
      setBusy(false);
      sourceFiles.style.display = "block";
      setStep(1, "errorTitle", "errorHint");
      currentError = error;
      renderError();
      errorBox.style.display = "block";
    }
    fileInput.value = "";
  });

  limitInput.addEventListener("input", updateSaveButton);

  allButton.addEventListener("click", () => {
    limitInput.value = String(ready().length);
    updateSaveButton();
  });

  saveButton.addEventListener("click", async () => {
    const batch = ready().slice(0, selectedLimit());
    if (!batch.length) return;
    setBusy(true);
    clearResults();
    setStep(3, "savingTitle", "savingHint");
    let failuresInARow = 0;
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      setProgress("progressSaving", i / batch.length, i + 1, batch.length, item.title);
      try {
        await saveVote(item);
        item.status = "saved";
        failuresInARow = 0;
      } catch (error) {
        console.error(`Nie zapisano: ${item.title}`, error);
        item.status = "failed";
        failuresInARow++;
        if (failuresInARow >= MAX_FAILURES_IN_A_ROW) break;
      }
      await sleep(WRITE_DELAY_MS);
    }
    setBusy(false);
    showSummary();
  });

  reportButton.addEventListener("click", () => downloadReport(results));
  closeButton.addEventListener("click", () => {
    if (!busy || confirm(t("confirmClose"))) panel.remove();
  });

  setStep(1, "chooseTitle", "chooseHint");
  renderLanguage();
})();
