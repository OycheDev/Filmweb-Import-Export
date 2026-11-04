# Filmweb ⇄ IMDb ⇄ Letterboxd

<table>
<tr>
<th width="50%">🇵🇱 Polski</th>
<th width="50%">🇬🇧 English</th>
</tr>
<tr>
<td valign="top">

Przenoś oceny filmów i seriali między Filmwebem, IMDb i Letterboxd. Nic nie instalujesz: skrypty wklejasz do przeglądarki.

</td>
<td valign="top">

Move your film and TV ratings between Filmweb, IMDb and Letterboxd. Nothing to install: you paste the scripts into your browser.

</td>
</tr>
<tr>
<th colspan="2">Eksport / Export</th>
</tr>
<tr>
<td valign="top">

**Z Filmwebu**

1. Zaloguj się na [filmweb.pl](https://www.filmweb.pl).
2. Naciśnij `F12` i wejdź w zakładkę **Console**.
3. Skopiuj całą zawartość [`filmweb-export.js`](filmweb-export.js), wklej ją do konsoli i naciśnij `Enter`.
4. Nie przełączaj karty, aż w konsoli pojawi się „Gotowe”.
5. Pobiorą się: `imdb-import.json` oraz pliki `letterboxd-*.csv`.

Jeśli Chrome zablokuje wklejanie, wpisz `allow pasting` i naciśnij `Enter`.

</td>
<td valign="top">

**From Filmweb**

1. Log in to [filmweb.pl](https://www.filmweb.pl).
2. Press `F12` and open the **Console** tab.
3. Copy all of [`filmweb-export.js`](filmweb-export.js), paste it into the console and press `Enter`.
4. Stay on the tab until the console says "Gotowe" (done).
5. You will get `imdb-import.json` and `letterboxd-*.csv` files.

If Chrome blocks pasting, type `allow pasting` and press `Enter`.

</td>
</tr>
<tr>
<td valign="top">

**Z IMDb**

1. Zaloguj się i otwórz [swoje oceny](https://www.imdb.com/list/ratings/).
2. Kliknij **Actions**, a potem **Export**.
3. Gdy plik będzie gotowy, pobierz go ze strony [Exports](https://www.imdb.com/exports/).

</td>
<td valign="top">

**From IMDb**

1. Log in and open [your ratings](https://www.imdb.com/list/ratings/).
2. Click **Actions**, then **Export**.
3. When the file is ready, download it from the [Exports](https://www.imdb.com/exports/) page.

</td>
</tr>
<tr>
<td valign="top">

**Z Letterboxd**

1. Zaloguj się i wejdź w [ustawienia danych](https://letterboxd.com/settings/data/).
2. Kliknij **Export your data**.
3. Rozpakuj pobrany plik ZIP. Najważniejszy jest `ratings.csv`.

</td>
<td valign="top">

**From Letterboxd**

1. Log in and open your [data settings](https://letterboxd.com/settings/data/).
2. Click **Export your data**.
3. Unzip the downloaded file. The main one is `ratings.csv`.

</td>
</tr>
<tr>
<th colspan="2">Import</th>
</tr>
<tr>
<td valign="top">

**Na Filmweb**

1. Zaloguj się na [filmweb.pl](https://www.filmweb.pl).
2. Naciśnij `F12` i wejdź w zakładkę **Console**.
3. Skopiuj całą zawartość [`filmweb-import.js`](filmweb-import.js), wklej ją do konsoli i naciśnij `Enter`.
4. W oknie, które się pojawi, wybierz `ratings.csv` z IMDb lub Letterboxd.
5. Sprawdź podsumowanie. Do tego momentu nic nie jest zapisywane.
6. Kliknij **Zapisz**. Zacznij od kilku ocen i zobacz wynik na profilu.
7. Możesz też wgrać `watched.csv` z Letterboxd, żeby dodać filmy bez oceny.

Już ocenione tytuły nie są zmieniane. Tytuły, których nie udało się dopasować, zobaczysz pod przyciskiem **Pokaż pominięte tytuły**.

</td>
<td valign="top">

**To Filmweb**

1. Log in to [filmweb.pl](https://www.filmweb.pl).
2. Press `F12` and open the **Console** tab.
3. Copy all of [`filmweb-import.js`](filmweb-import.js), paste it into the console and press `Enter`.
4. In the window that appears, click **EN** to switch to English, then choose `ratings.csv` from IMDb or Letterboxd.
5. Check the summary. Nothing is saved up to this point.
6. Click **Save**. Start with a few ratings and check your profile.
7. You can also upload Letterboxd's `watched.csv` to add unrated films.

Titles you have already rated are left unchanged. Titles that could not be matched are listed under **Show skipped titles**.

</td>
</tr>
<tr>
<td valign="top">

**Na IMDb**

1. Zaloguj się i otwórz [Import Your Watch History](https://www.imdb.com/labs/import-watch-history/).
2. Wgraj `imdb-import.json` z eksportu Filmwebu.

Oceny się przenoszą, ale daty mogą ustawić się na dzień importu.

</td>
<td valign="top">

**To IMDb**

1. Log in and open [Import Your Watch History](https://www.imdb.com/labs/import-watch-history/).
2. Upload `imdb-import.json` from the Filmweb export.

Ratings carry over, but dates may be set to the day of the import.

</td>
</tr>
<tr>
<td valign="top">

**Na Letterboxd**

1. Zaloguj się i otwórz [stronę importu](https://letterboxd.com/import/).
2. Wgraj pliki `letterboxd-filmy-*.csv` z eksportu Filmwebu.
3. Sprawdź dopasowania i potwierdź import.

Letterboxd to głównie serwis filmowy, więc `letterboxd-seriale-*.csv` może dopasować się słabo.

</td>
<td valign="top">

**To Letterboxd**

1. Log in and open the [import page](https://letterboxd.com/import/).
2. Upload the `letterboxd-filmy-*.csv` files from the Filmweb export.
3. Review the matches and confirm the import.

Letterboxd is mainly for films, so `letterboxd-seriale-*.csv` may match poorly.

</td>
</tr>
<tr>
<th colspan="2">Ważne / Good to know</th>
</tr>
<tr>
<td valign="top">

- Skrypty działają tylko w Twojej przeglądarce, na Twoim koncie.
- Używasz ich na własną odpowiedzialność. Masowy import może wyglądać dla serwisu jak działanie automatu.
- Filmweb, IMDb i Letterboxd mogą zmienić swoje strony, a wtedy skrypt przestanie działać.

</td>
<td valign="top">

- The scripts run only in your browser, on your own account.
- Use them at your own risk. A bulk import may look like automated activity to the service.
- Filmweb, IMDb and Letterboxd can change their sites, which may break the scripts.

</td>
</tr>
</table>

## Licencja / License

[MIT](LICENSE). Oparte na / Based on [Filmweb2Letterboxd](https://github.com/JSerwatka/Filmweb2Letterboxd) by Jakub Serwatka.
