(() => {
  const VOTE_TYPES = ["film", "serial", "tvshow"];
  const MAX_VOTE_PAGES = 100;
  const WIKIDATA_BATCH = 200;
  const LETTERBOXD_MAX_ROWS = 1800;
  const REQUEST_DELAY_MS = 120;
  const MAX_FAILURES_IN_A_ROW = 5;
  const LETTERBOXD_COLUMNS = ["Title", "Year", "imdbID", "Rating10", "WatchedDate"];
  const LANGUAGE_STORAGE_KEY = "filmweb-import-language";
  const PLATFORMS = ["imdb", "letterboxd"];

  const countLabel = (amount, one, few, many) => {
    const lastDigit = amount % 10;
    const lastTwoDigits = amount % 100;
    if (amount === 1) return `1 ${one}`;
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) return `${amount} ${few}`;
    return `${amount} ${many}`;
  };

  const TEXT = {
    pl: {
      title: "Eksport ocen z Filmwebu",
      languageButton: "EN",
      languageTitle: "Switch to English",
      close: "Zamknij",
      step: (number) => `Krok ${number} z 2`,
      startTitle: "Pobierz swoje oceny",
      startHint: "Skrypt tylko odczyta oceny. Na Filmwebie nic się nie zmieni.",
      startButton: "Pobierz oceny z Filmwebu",
      loadingTitle: "Pobieram oceny",
      loadingHint: "Nie zamykaj tej karty. To może potrwać kilka minut.",
      readyTitle: "Wybierz platformę",
      readyHint: "Plik powstanie dopiero po kliknięciu. Możesz pobrać kilka.",
      errorTitle: "Nie udało się pobrać ocen",
      errorHint: "Sprawdź, czy jesteś zalogowany, i spróbuj ponownie.",
      retryButton: "Spróbuj ponownie",
      preparing: "Przygotowuję…",
      progressVotes: (total) => `Pobieram listę ocen: ${total}`,
      progressTitles: (current, total) => `Pobieram tytuły: ${current} z ${total}`,
      progressImdb: (current, total) => `Szukam numerów IMDb: ${current} z ${total}`,
      statTitles: "Wszystkie tytuły",
      statFilms: "Filmy",
      statSeries: "Seriale",
      statImdb: "Z numerem IMDb",
      statUnrated: "Bez oceny",
      incomplete: "Eksport może być niepełny:",
      noVotes: "Nie pobrano żadnych ocen.",
      imdbName: "IMDb",
      imdbDescription: (total) => `Jeden plik JSON, ${countLabel(total, "tytuł", "tytuły", "tytułów")}.`,
      letterboxdName: "Letterboxd",
      letterboxdDescription: (films, series) =>
        `Pliki CSV: ${countLabel(films, "film", "filmy", "filmów")}, ${countLabel(series, "serial", "seriale", "seriali")}.`,
      downloaded: "Pobrano",
      imdbNext: "Wgraj plik na IMDb",
      letterboxdNext: "Wgraj pliki na Letterboxd",
      nothingToExport: "Brak tytułów do tego eksportu.",
      confirmClose: "Trwa pobieranie. Zamknąć okno?",
    },
    en: {
      title: "Export ratings from Filmweb",
      languageButton: "PL",
      languageTitle: "Przełącz na polski",
      close: "Close",
      step: (number) => `Step ${number} of 2`,
      startTitle: "Get your ratings",
      startHint: "The script only reads your ratings. Nothing changes on Filmweb.",
      startButton: "Get my Filmweb ratings",
      loadingTitle: "Getting your ratings",
      loadingHint: "Keep this tab open. This can take a few minutes.",
      readyTitle: "Choose a platform",
      readyHint: "A file is created only when you click. You can download several.",
      errorTitle: "Could not get your ratings",
      errorHint: "Make sure you are logged in and try again.",
      retryButton: "Try again",
      preparing: "Preparing…",
      progressVotes: (total) => `Getting your ratings list: ${total}`,
      progressTitles: (current, total) => `Getting titles: ${current} of ${total}`,
      progressImdb: (current, total) => `Looking up IMDb IDs: ${current} of ${total}`,
      statTitles: "All titles",
      statFilms: "Films",
      statSeries: "Series",
      statImdb: "With an IMDb ID",
      statUnrated: "Unrated",
      incomplete: "The export may be incomplete:",
      noVotes: "No ratings were found.",
      imdbName: "IMDb",
      imdbDescription: (total) => `One JSON file, ${total} ${total === 1 ? "title" : "titles"}.`,
      letterboxdName: "Letterboxd",
      letterboxdDescription: (films, series) =>
        `CSV files: ${films} ${films === 1 ? "film" : "films"}, ${series} series.`,
      downloaded: "Downloaded",
      imdbNext: "Upload the file to IMDb",
      letterboxdNext: "Upload the files to Letterboxd",
      nothingToExport: "There are no titles for this export.",
      confirmClose: "Still downloading. Close the window?",
    },
  };

  const NEXT_LINKS = {
    imdb: "https://www.imdb.com/labs/import-watch-history/",
    letterboxd: "https://letterboxd.com/import/",
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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const describeError = (error) => `${error?.name || "Error"}: ${error?.message || "-"}`;

  const getCleanFetch = () => {
    try {
      const frame = document.createElement("iframe");
      frame.style.display = "none";
      document.documentElement.appendChild(frame);
      return frame.contentWindow.fetch.bind(frame.contentWindow);
    } catch {
      return window.fetch.bind(window);
    }
  };

  const cleanFetch = getCleanFetch();

  const fetchWithRetry = async (url, options, attempts = 5) => {
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

  const filmweb = async (endpoint) => {
    const response = await fetchWithRetry(`${location.origin}/api/v1/${endpoint}`, {
      credentials: "include",
      headers: { "X-Locale": "pl" },
    });
    if (!response.ok) throw new Error(`Filmweb: HTTP ${response.status} (${endpoint})`);
    return response.json();
  };

  const getVotes = async (problems, onProgress) => {
    const votes = new Map();
    for (const type of VOTE_TYPES) {
      try {
        for (let page = 1; ; page++) {
          if (page > MAX_VOTE_PAGES) {
            problems.push(`${type}: Filmweb: max ${MAX_VOTE_PAGES} pages`);
            break;
          }
          const rows = await filmweb(`logged/vote/title/${type}?page=${page}`);
          if (!rows.length) break;
          for (const vote of rows) {
            if (vote.entity) votes.set(vote.entity, { ...vote, voteType: type });
          }
          onProgress("progressVotes", 0, votes.size);
          await sleep(REQUEST_DELAY_MS);
        }
      } catch (error) {
        console.warn(error);
        problems.push(`${type}: ${describeError(error)}`);
      }
    }
    return [...votes.values()];
  };

  const formatDate = (value) => {
    const date = String(value ?? "");
    return /^\d{8}$/.test(date) ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}` : "";
  };

  const getTitles = async (votes, problems, onProgress) => {
    const titles = [];
    let failuresInARow = 0;
    for (let i = 0; i < votes.length; i++) {
      const vote = votes[i];
      let info = {};
      if (failuresInARow < MAX_FAILURES_IN_A_ROW) {
        try {
          info = await filmweb(`title/${vote.entity}/info`);
          failuresInARow = 0;
        } catch (error) {
          failuresInARow++;
          console.warn(`${vote.entity}: ${describeError(error)}`);
          if (failuresInARow === MAX_FAILURES_IN_A_ROW) problems.push(describeError(error));
        }
        await sleep(REQUEST_DELAY_MS);
      }
      titles.push({
        id: String(vote.entity),
        isFilm: vote.voteType === "film",
        title: info.originalTitle || info.title || "",
        year: info.year,
        rating: vote.rate > 0 ? vote.rate : undefined,
        watchedDate: formatDate(vote.viewDate),
      });
      onProgress("progressTitles", (i + 1) / votes.length, i + 1, votes.length);
    }
    return titles;
  };

  const getImdbIds = async (titles, onProgress) => {
    const imdbIds = new Map();
    for (let start = 0; start < titles.length; start += WIKIDATA_BATCH) {
      const ids = titles.slice(start, start + WIKIDATA_BATCH).map((title) => `"${title.id}"`);
      const query = `SELECT ?fw ?imdb WHERE {
        VALUES ?fw { ${ids.join(" ")} }
        ?item wdt:P5032 ?fw; wdt:P345 ?imdb.
        FILTER(STRSTARTS(?imdb, "tt"))
      }`;
      try {
        const response = await fetchWithRetry("https://query.wikidata.org/sparql", {
          method: "POST",
          credentials: "omit",
          headers: { Accept: "application/sparql-results+json" },
          body: new URLSearchParams({ query }),
        });
        if (!response.ok) throw new Error(`Wikidata: HTTP ${response.status}`);
        const data = await response.json();
        for (const row of data.results.bindings) {
          if (!imdbIds.has(row.fw.value)) imdbIds.set(row.fw.value, row.imdb.value);
        }
      } catch (error) {
        console.warn(describeError(error));
      }
      const done = Math.min(start + WIKIDATA_BATCH, titles.length);
      onProgress("progressImdb", done / titles.length, done, titles.length);
      await sleep(300);
    }
    return imdbIds;
  };

  const toJsonItem = (title, imdbId) => {
    const item = {};
    if (title.title) item.title = title.title;
    if (title.year) item.year = title.year;
    if (imdbId) item.imdb_id = imdbId;
    if (title.rating) item.rating = title.rating;
    if (title.watchedDate) item.watched_date = title.watchedDate;
    return item;
  };

  const csvCell = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const toLetterboxdCsv = (titles, imdbIds) =>
    [
      LETTERBOXD_COLUMNS,
      ...titles.map((title) => [title.title, title.year, imdbIds.get(title.id), title.rating, title.watchedDate]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n") + "\n";

  const download = async (filename, text, type) => {
    const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    await sleep(800);
    URL.revokeObjectURL(url);
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
  const primaryButton = `${baseButton}display:none;width:100%;margin-top:12px;padding:12px;background:${COLORS.accent};color:#000`;

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
  const startButton = element("button", { type: "button" }, primaryButton);
  const progressBox = element("div", {}, "display:none;margin-top:12px");
  const progressTrack = element("div", {}, `height:8px;overflow:hidden;border-radius:4px;background:${COLORS.card}`);
  const progressBar = element("div", {}, `width:0;height:100%;background:${COLORS.accent};transition:width .2s`);
  const progressText = element("div", {}, `margin-top:6px;color:${COLORS.muted};font-size:13px`);
  const stats = element("div", {}, `display:none;margin-top:12px;padding:4px 12px;border-radius:8px;background:${COLORS.card}`);
  const errorBox = element("div", {}, `display:none;margin-top:12px;padding:10px 12px;border-radius:8px;background:rgba(255,107,107,.14);color:${COLORS.danger};font-size:13px;overflow-wrap:anywhere`);
  const platformBox = element("div", {}, "display:none;margin-top:12px");

  header.append(heading, languageButton, closeButton);
  progressTrack.append(progressBar);
  progressBox.append(progressTrack, progressText);
  panel.append(header, stepLabel, stepTitle, stepHint, startButton, progressBox, stats, errorBox, platformBox);
  document.body.append(panel);

  let phase = "start";
  let titles = [];
  let imdbIds = new Map();
  let problems = [];
  let fatalMessage = "";
  let currentProgress = null;
  const downloads = {};
  let saving = false;

  const named = () => titles.filter((title) => title.title || imdbIds.has(title.id));
  const films = () => named().filter((title) => title.isFilm);
  const series = () => named().filter((title) => !title.isFilm);
  const rated = () => named().filter((title) => title.rating);

  const setProgress = (key, value, ...args) => {
    currentProgress = { key, args };
    progressText.textContent = t(key, ...args);
    if (value !== undefined) progressBar.style.width = `${Math.round(value * 100)}%`;
  };

  const addStat = (label, value) => {
    const row = element("div", {}, `display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid ${COLORS.border}`);
    row.append(element("span", { textContent: label }, "flex:1"), element("strong", { textContent: String(value) }));
    stats.append(row);
  };

  const renderStats = () => {
    stats.replaceChildren();
    addStat(t("statTitles"), named().length);
    addStat(t("statFilms"), films().length);
    addStat(t("statSeries"), series().length);
    addStat(t("statImdb"), named().filter((title) => imdbIds.has(title.id)).length);
    addStat(t("statUnrated"), named().length - rated().length);
    stats.lastElementChild?.style.setProperty("border-bottom", "0");
  };

  const platformDescription = (platform) => {
    if (platform === "imdb") return t("imdbDescription", named().length);
    return t("letterboxdDescription", films().length, series().length);
  };

  const renderPlatforms = () => {
    platformBox.replaceChildren();
    for (const platform of PLATFORMS) {
      const card = element("div", {}, `margin-top:8px;padding:10px 12px;border-radius:8px;background:${COLORS.card}`);
      const button = element("button", { type: "button", textContent: t(`${platform}Name`) }, `${baseButton}width:100%;padding:10px;background:${COLORS.accent};color:#000`);
      button.disabled = saving;
      button.style.opacity = saving ? "0.5" : "1";
      button.addEventListener("click", () => exportFor(platform));
      card.append(button, element("div", { textContent: platformDescription(platform) }, `margin-top:6px;color:${COLORS.muted};font-size:13px`));
      if (downloads[platform]) {
        const status = element("div", {}, "margin-top:6px;font-size:13px");
        status.append(
          element("span", { textContent: `✓ ${t("downloaded")}. ` }, `color:${COLORS.success};font-weight:700`),
          element("a", { href: NEXT_LINKS[platform], target: "_blank", rel: "noopener", textContent: t(`${platform}Next`) }, `color:${COLORS.accent}`)
        );
        card.append(status);
      }
      platformBox.append(card);
    }
  };

  const renderProblems = () => {
    errorBox.replaceChildren();
    if (fatalMessage) errorBox.append(element("div", { textContent: fatalMessage }));
    if (problems.length) {
      errorBox.append(element("strong", { textContent: t("incomplete") }));
      problems.forEach((problem) => errorBox.append(element("div", { textContent: `• ${problem}` })));
    }
    errorBox.style.display = fatalMessage || problems.length ? "block" : "none";
  };

  const render = () => {
    heading.textContent = t("title");
    languageButton.textContent = t("languageButton");
    languageButton.title = t("languageTitle");
    closeButton.title = t("close");
    const step = phase === "ready" ? 2 : 1;
    stepLabel.textContent = t("step", step);
    stepTitle.textContent = t(`${phase}Title`);
    stepHint.textContent = t(`${phase}Hint`);
    startButton.textContent = t(phase === "error" ? "retryButton" : "startButton");
    startButton.style.display = phase === "start" || phase === "error" ? "block" : "none";
    progressBox.style.display = phase === "loading" ? "block" : "none";
    if (currentProgress) progressText.textContent = t(currentProgress.key, ...currentProgress.args);
    stats.style.display = phase === "ready" ? "block" : "none";
    platformBox.style.display = phase === "ready" ? "block" : "none";
    if (phase === "ready") {
      renderStats();
      renderPlatforms();
    }
    renderProblems();
  };

  const exportFor = async (platform) => {
    saving = true;
    renderPlatforms();
    if (platform === "imdb") {
      const items = named().map((title) => toJsonItem(title, imdbIds.get(title.id)));
      await download("imdb-import.json", `${JSON.stringify(items, null, 2)}\n`, "application/json");
    } else {
      for (const [name, list] of [["filmy", films()], ["seriale", series()]]) {
        for (let start = 0, part = 1; start < list.length; start += LETTERBOXD_MAX_ROWS, part++) {
          const chunk = list.slice(start, start + LETTERBOXD_MAX_ROWS);
          await download(`letterboxd-${name}-${part}.csv`, toLetterboxdCsv(chunk, imdbIds), "text/csv");
        }
      }
    }
    downloads[platform] = true;
    saving = false;
    renderPlatforms();
  };

  const startExport = async () => {
    phase = "loading";
    problems = [];
    fatalMessage = "";
    currentProgress = null;
    setProgress("preparing", 0);
    render();
    try {
      const votes = await getVotes(problems, setProgress);
      if (!votes.length) {
        fatalMessage = t("noVotes");
        phase = "error";
        render();
        return;
      }
      titles = await getTitles(votes, problems, setProgress);
      imdbIds = await getImdbIds(titles, setProgress);
      phase = "ready";
    } catch (error) {
      console.error(error);
      fatalMessage = describeError(error);
      phase = "error";
    }
    render();
  };

  startButton.addEventListener("click", startExport);

  languageButton.addEventListener("click", () => {
    language = language === "pl" ? "en" : "pl";
    saveLanguage();
    render();
  });

  closeButton.addEventListener("click", () => {
    if (phase !== "loading" || confirm(t("confirmClose"))) panel.remove();
  });

  render();
})();
