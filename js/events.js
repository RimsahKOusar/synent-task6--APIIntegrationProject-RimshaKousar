/*
╔═══════════════════════════════════════════════════════════════╗
║  events.js  –  USER INTERACTION MODULE                       ║
║                                                               ║
║  What this file does:                                         ║
║  Wires user actions (button clicks, Enter key) to the        ║
║  correct api.js function, then passes the result to          ║
║  the correct render.js function.                             ║
║                                                               ║
║  This file is the GLUE between api.js and render.js.         ║
║  Think of it as the traffic controller:                       ║
║    user clicks → events.js → api.js (get data)               ║
║                            → render.js (show data)           ║
║                                                               ║
║  KEY CONCEPT in this file:  async / await                     ║
║  Fetch calls take time (network round-trip).                  ║
║  "async" marks a function as potentially slow.                ║
║  "await" pauses execution until the slow part finishes,       ║
║  then continues – without freezing the browser.              ║
╚═══════════════════════════════════════════════════════════════╝
*/


/* ══════════════════════════════════════════════════════════════
   DOM ELEMENT REFERENCES
   Grab all interactive elements once at the top.
   ══════════════════════════════════════════════════════════════ */
const cityInputEl    = document.getElementById('cityInput');
const weatherBtnEl   = document.getElementById('weatherBtn');
const weatherResultEl = document.getElementById('weatherResult');

const quoteBtnEl     = document.getElementById('quoteBtn');
const quoteResultEl  = document.getElementById('quoteResult');

const githubInputEl  = document.getElementById('githubInput');
const githubBtnEl    = document.getElementById('githubBtn');
const githubResultEl = document.getElementById('githubResult');


/* ══════════════════════════════════════════════════════════════
   WEATHER HANDLERS
   ══════════════════════════════════════════════════════════════ */

/**
 * handleWeatherSearch()
 * ──────────────────────
 * Called when user clicks "Search" in the weather panel.
 *
 * Pattern used here for every handler:
 *   1. Validate input (don't fetch if empty)
 *   2. showLoader() → user sees spinner immediately
 *   3. await the API call (could take 1-3 seconds)
 *   4. On success → showWeather() with the data
 *   5. On failure → catch the Error → showError()
 */
async function handleWeatherSearch() {
  const city = cityInputEl.value.trim();

  /* Validation: require at least 2 characters */
  if (city.length < 2) {
    showError(weatherResultEl, 'Please enter a city name (at least 2 characters).');
    return;
  }

  /* Show spinner immediately – before the await */
  showLoader(weatherResultEl);
  weatherBtnEl.disabled = true;   /* prevent double-clicks     */

  try {
    /*
     * await pauses HERE until getWeatherInfo() resolves.
     * getWeatherInfo is in api.js – it does geocoding + weather.
     * If EITHER step fails, it throws an Error.
     */
    const { weather, cityLabel } = await getWeatherInfo(city);

    /* Data arrived! Show the weather card. */
    showWeather(weatherResultEl, weather, cityLabel);

  } catch (error) {
    /*
     * catch(error) runs only if something went wrong:
     * - No internet
     * - City not found (getWeatherInfo throws for this)
     * - API returned a non-200 status
     *
     * error.message is the human-readable string we set
     * in the throw statements inside api.js.
     */
    showError(weatherResultEl, error.message);

  } finally {
    /*
     * finally runs ALWAYS – whether try succeeded or catch fired.
     * We re-enable the button so the user can try again.
     */
    weatherBtnEl.disabled = false;
  }
}

/* Button click → run the handler */
weatherBtnEl.addEventListener('click', handleWeatherSearch);

/* Enter key in the input → same as clicking Search */
cityInputEl.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') handleWeatherSearch();
});

/* ══════════════════════════════════════════════════════════════
   QUOTE HANDLERS
   ══════════════════════════════════════════════════════════════ */

/**
 * handleQuoteFetch()
 * ───────────────────
 * Called when user clicks "↻ New Quote".
 * No input validation needed – fetchQuote() needs no parameters.
 */
async function handleQuoteFetch() {
  showLoader(quoteResultEl);
  quoteBtnEl.disabled = true;

  try {
    const quoteData = await fetchQuote();   /* from api.js */
    showQuote(quoteResultEl, quoteData);    /* from render.js */

  } catch (error) {
    showError(quoteResultEl, error.message);

  } finally {
    quoteBtnEl.disabled = false;
  }
}

quoteBtnEl.addEventListener('click', handleQuoteFetch);

/* ══════════════════════════════════════════════════════════════
   GITHUB HANDLERS
   ══════════════════════════════════════════════════════════════ */

/**
 * handleGitHubSearch()
 * ─────────────────────
 * Called when user clicks "Search" in the GitHub panel.
 */
async function handleGitHubSearch() {
  const username = githubInputEl.value.trim();

  if (!username) {
    showError(githubResultEl, 'Please enter a GitHub username.');
    return;
  }

  showLoader(githubResultEl);
  githubBtnEl.disabled = true;

  try {
    const userData = await fetchGitHubUser(username);   /* from api.js */
    showGitHub(githubResultEl, userData);               /* from render.js */

  } catch (error) {
    showError(githubResultEl, error.message);

  } finally {
    githubBtnEl.disabled = false;
  }
}

githubBtnEl.addEventListener('click', handleGitHubSearch);

/* Enter key in the GitHub input → search */
githubInputEl.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') handleGitHubSearch();
});
