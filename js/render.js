/*
╔═══════════════════════════════════════════════════════════════╗
║  render.js  –  DOM RENDERING MODULE                          ║
║                                                               ║
║  What this file does:                                         ║
║  Turns raw API data (plain JavaScript objects) into           ║
║  visible HTML on the page.                                    ║
║                                                               ║
║  RULE: This file never calls fetch() or touches localStorage. ║
║  It ONLY reads data and writes to the DOM.                    ║
║                                                               ║
║  Functions exported (used by events.js):                      ║
║    showLoader(containerEl)     – spinner while loading        ║
║    showError(containerEl, msg) – red error card               ║
║    showWeather(el, data, city) – weather result card          ║
║    showQuote(el, data)         – quote result card            ║
║    showGitHub(el, data)        – GitHub profile card          ║
╚═══════════════════════════════════════════════════════════════╝
*/


/* ══════════════════════════════════════════════════════════════
   SHARED HELPERS  –  loader and error states
   ══════════════════════════════════════════════════════════════ */

/**
 * showLoader(containerEl)
 * ────────────────────────
 * Clears the panel result area and shows a spinner + skeleton
 * bars so the user knows something is loading.
 *
 * @param {HTMLElement} containerEl  the .panel-result div
 */
function showLoader(containerEl) {
  containerEl.innerHTML = `
    <div class="loader">
      <div class="loader-ring"></div>
      <span>Fetching data…</span>
    </div>
    <!-- Skeleton bars mimic content shape while loading -->
    <div style="margin-top: 12px; display: flex; gap: 12px; align-items:center;">
      <div class="skeleton skeleton-avatar"></div>
      <div style="flex:1">
        <div class="skeleton skeleton-line wide"></div>
        <div class="skeleton skeleton-line mid"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>
  `;
}


/**
 * showError(containerEl, message)
 * ────────────────────────────────
 * Replaces the panel result area with a friendly error card.
 *
 * @param {HTMLElement} containerEl  the .panel-result div
 * @param {string}      message      human-readable error text
 */
function showError(containerEl, message) {
  containerEl.innerHTML = `
    <div class="error-card">
      <span class="error-icon">⚠️</span>
      <div>
        <p class="error-title">Something went wrong</p>
        <p class="error-msg">${message}</p>
      </div>
    </div>
  `;
}


/* ══════════════════════════════════════════════════════════════
   WEATHER RESULT
   ══════════════════════════════════════════════════════════════ */

/**
 * showWeather(containerEl, weatherData, cityLabel)
 * ─────────────────────────────────────────────────
 * Renders the dark weather card inside the weather panel.
 *
 * @param {HTMLElement} containerEl   the #weatherResult div
 * @param {Object}      weatherData   object from fetchWeather()
 * @param {string}      cityLabel     city + country string
 */
function showWeather(containerEl, weatherData, cityLabel) {
  /* Get the human label + emoji for this WMO weather code */
  const { label, emoji } = decodeWeatherCode(weatherData.weatherCode);

  /*
   * Template literal:  backtick strings that span multiple lines
   * and can contain ${expressions} embedded inside.
   * This is the idiomatic way to build HTML strings in JS.
   */
  containerEl.innerHTML = `
    <div class="weather-card">

      <p class="weather-location">📍 ${cityLabel}</p>

      <div class="weather-main">
        <div class="weather-temp">
          ${weatherData.temp}<sup>°C</sup>
        </div>
        <span class="weather-emoji">${emoji}</span>
      </div>

      <p class="weather-condition">${label}</p>

      <div class="weather-stats">
        <div class="stat-chip">
          💧 Humidity <strong>${weatherData.humidity}%</strong>
        </div>
        <div class="stat-chip">
          💨 Wind <strong>${weatherData.windSpeed} km/h</strong>
        </div>
        <div class="stat-chip">
          🌡 Feels like <strong>${weatherData.feelsLike}°C</strong>
        </div>
      </div>

    </div>
  `;
}


/* ══════════════════════════════════════════════════════════════
   QUOTE RESULT
   ══════════════════════════════════════════════════════════════ */

/**
 * showQuote(containerEl, quoteData)
 * ──────────────────────────────────
 * Renders the quote card with text, author, and tags.
 *
 * @param {HTMLElement} containerEl  the #quoteResult div
 * @param {Object}      quoteData    { text, author, tags }
 */
function showQuote(containerEl, quoteData) {
  /*
   * Build the tags HTML by mapping each tag to a <span>.
   * Array.map() returns a new array; .join('') merges into one string.
   * If there are no tags, we show an empty string.
   */
  const tagsHtml = quoteData.tags.length
    ? `<div class="quote-tags">
         ${quoteData.tags.map(tag => `<span class="quote-tag">${tag}</span>`).join('')}
       </div>`
    : '';

  containerEl.innerHTML = `
    <div class="quote-card">
      <p class="quote-text">${quoteData.text}</p>
      <p class="quote-author">— ${quoteData.author}</p>
      ${tagsHtml}
    </div>
  `;
}


/* ══════════════════════════════════════════════════════════════
   GITHUB PROFILE RESULT
   ══════════════════════════════════════════════════════════════ */

/**
 * showGitHub(containerEl, userData)
 * ──────────────────────────────────
 * Renders the GitHub profile card.
 *
 * @param {HTMLElement} containerEl  the #githubResult div
 * @param {Object}      userData     object from fetchGitHubUser()
 */
function showGitHub(containerEl, userData) {
  /*
   * Some GitHub users don't have a bio or location.
   * The || '' fallback ensures we never render "null" on screen.
   * The ternary operator (condition ? a : b) lets us hide
   * entire sections when data is missing.
   */
  const bioHtml      = userData.bio      ? `<p class="github-bio">${userData.bio}</p>` : '';
  const locationHtml = userData.location ? `<span>📍 ${userData.location}</span>` : '';

  /* For blogs: only show if it's a non-empty string */
  const blogHtml = userData.blog
    ? `<span>🔗 <a href="${userData.blog}" target="_blank" rel="noopener">${userData.blog}</a></span>`
    : '';

  /* Combine location + blog into a single meta row (if any exist) */
  const metaHtml = (locationHtml || blogHtml)
    ? `<div class="github-meta">${locationHtml}${blogHtml}</div>`
    : '';

  /*
   * formatNumber() makes large numbers readable:
   * 12500 → "12.5k"
   */
  const repos     = formatNumber(userData.publicRepos);
  const followers = formatNumber(userData.followers);
  const following = formatNumber(userData.following);

  containerEl.innerHTML = `
    <div class="github-card">

      <!-- Avatar + name + bio -->
      <div class="github-top">
        <img
          class="github-avatar"
          src="${userData.avatarUrl}"
          alt="Avatar of ${userData.name}"
          loading="lazy"
        />
        <div class="github-info">
          <h3 class="github-name">${userData.name}</h3>
          <p class="github-login">@${userData.login}</p>
          ${bioHtml}
        </div>
      </div>

      <!-- Stats: repos | followers | following -->
      <div class="github-stats">
        <div class="stat-box">
          <span class="stat-value">${repos}</span>
          <span class="stat-label">Repos</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${followers}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${following}</span>
          <span class="stat-label">Following</span>
        </div>
      </div>

      <!-- Optional location + blog -->
      ${metaHtml}

      <!-- Link to full GitHub profile -->
      <a
        class="github-link-btn"
        href="${userData.profileUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on GitHub ↗
      </a>

    </div>
  `;
}


/* ══════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ══════════════════════════════════════════════════════════════ */

/**
 * formatNumber(n)
 * ────────────────
 * Abbreviates large numbers for cleaner display.
 * 1200 → "1.2k"   /   500 → "500"
 */
function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}
