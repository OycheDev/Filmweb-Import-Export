(async () => {
  const VOTE_TYPES = ["film", "serial", "tvshow"];
  const MAX_VOTE_PAGES = 100;
  const WIKIDATA_BATCH = 200;
  const LETTERBOXD_MAX_ROWS = 1800;
  const REQUEST_DELAY_MS = 120;
  const MAX_FAILURES_IN_A_ROW = 5;
  const LETTERBOXD_COLUMNS = ["Title", "Year", "imdbID", "Rating10", "WatchedDate"];
  const problems = [];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const reportProblem = (message) => {
    problems.push(message);
    console.warn(message);
  };

  const describeError = (error) =>
    `${error?.name || "Error"}: ${error?.message || "(pusty komunikat)"}`;

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
    if (!response.ok) {
      const hint = [401, 403].includes(response.status) ? " (sprawdź, czy jesteś zalogowany)" : "";
      throw new Error(`Filmweb: błąd ${response.status} dla ${endpoint}${hint}`);
    }
    return response.json();
  };

  const getVotes = async () => {
    const votes = new Map();
    for (const type of VOTE_TYPES) {
      try {
        for (let page = 1; ; page++) {
          if (page > MAX_VOTE_PAGES) {
            reportProblem(`Lista ${type}: Filmweb udostępnia tylko ${MAX_VOTE_PAGES} stron, dalsze pozycje pominięto.`);
            break;
          }
          const rows = await filmweb(`logged/vote/title/${type}?page=${page}`);
          if (!rows.length) break;
          for (const vote of rows) {
            if (vote.entity) votes.set(vote.entity, { ...vote, voteType: type });
          }
          console.log(`Lista ${type}: strona ${page}, razem pozycji: ${votes.size}`);
          await sleep(REQUEST_DELAY_MS);
        }
      } catch (error) {
        reportProblem(`Lista ${type} jest niepełna: ${describeError(error)}`);
      }
    }
    return [...votes.values()];
  };

  const formatDate = (value) => {
    const date = String(value ?? "");
    return /^\d{8}$/.test(date) ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}` : "";
  };

  const getTitles = async (votes) => {
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
          console.warn(`Nie udało się pobrać tytułu ${vote.entity}: ${describeError(error)}`);
          if (failuresInARow === MAX_FAILURES_IN_A_ROW) {
            reportProblem(`Filmweb przestał podawać tytuły: ${describeError(error)}`);
          }
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
      if ((i + 1) % 25 === 0 || i + 1 === votes.length) {
        console.log(`Pobrano tytuły: ${i + 1}/${votes.length}`);
      }
    }
    return titles;
  };

  const getImdbIds = async (titles) => {
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
        if (!response.ok) throw new Error(`Wikidata: błąd ${response.status}`);
        const data = await response.json();
        for (const row of data.results.bindings) {
          if (!imdbIds.has(row.fw.value)) imdbIds.set(row.fw.value, row.imdb.value);
        }
      } catch (error) {
        console.warn(`Pominięto część numerów IMDb: ${describeError(error)}`);
      }
      await sleep(300);
    }
    return imdbIds;
  };

  const toImdbItem = (title, imdbId) => {
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

  const downloadLetterboxd = async (name, titles, imdbIds) => {
    for (let start = 0, part = 1; start < titles.length; start += LETTERBOXD_MAX_ROWS, part++) {
      const chunk = titles.slice(start, start + LETTERBOXD_MAX_ROWS);
      await download(`letterboxd-${name}-${part}.csv`, toLetterboxdCsv(chunk, imdbIds), "text/csv");
    }
  };

  console.log("Rozpoczynam pobieranie. Nie zamykaj ani nie przełączaj tej karty.");
  const votes = await getVotes();
  if (!votes.length) {
    console.error("Nie pobrano żadnych ocen.", problems);
    return;
  }

  const titles = (await getTitles(votes));
  const imdbIds = await getImdbIds(titles);
  const named = titles.filter((title) => title.title || imdbIds.has(title.id));
  const imdbItems = named.map((title) => toImdbItem(title, imdbIds.get(title.id)));

  await download("imdb-import.json", `${JSON.stringify(imdbItems, null, 2)}\n`, "application/json");
  await downloadLetterboxd("filmy", named.filter((title) => title.isFilm), imdbIds);
  await downloadLetterboxd("seriale", named.filter((title) => !title.isFilm), imdbIds);

  console.log(
    `Gotowe. Zapisano: ${named.length}. Z numerem IMDb: ${imdbItems.filter((item) => item.imdb_id).length}. ` +
    `Pominięto: ${titles.length - named.length}.\n` +
    "IMDb: https://www.imdb.com/labs/import-watch-history/\n" +
    "Letterboxd: https://letterboxd.com/import/"
  );
  if (problems.length) {
    console.error(`EKSPORT MOŻE BYĆ NIEPEŁNY:\n- ${problems.join("\n- ")}`);
  }
})().catch((error) => console.error("Eksport przerwany:", error));
