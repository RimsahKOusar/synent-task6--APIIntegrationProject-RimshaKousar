/*
╔═══════════════════════════════════════════════════════════════╗
║  api.js  –  ALL FETCH / NETWORK CALLS                        ║
║                                                               ║
║  What this file does:                                         ║
║  Contains ONLY the functions that talk to the internet.      ║
║  It never touches the DOM (no document.getElementById etc.)  ║
║                                                               ║
║  WHY keep API calls in their own file?                        ║
║  If an API URL changes, you update it HERE – not hunting      ║
║  through event handlers. Clean separation of concerns.        ║
║                                                               ║
║  APIs used:                                                   ║
║  1. Nominatim (OpenStreetMap) – city name → lat/lon coords    ║
║  2. Open-Meteo              – coords → weather data           ║
║  3. Quotable.io             – random inspirational quote      ║
║  4. GitHub REST API         – public user profile data        ║
╚═══════════════════════════════════════════════════════════════╝
*/


/* ══════════════════════════════════════════════════════════════
   WEATHER  –  two-step fetch process
   Step 1: city name → latitude + longitude (geocoding)
   Step 2: lat/lon → actual weather data
   ══════════════════════════════════════════════════════════════

   WHY two steps?
   The weather API needs coordinates, not city names.
   Nominatim converts "Lahore" → { lat: 31.55, lon: 74.35 }
*/

/**
 * geocodeCity(cityName)
 * ─────────────────────
 * Converts a city name string into {lat, lon, displayName}.
 *
 * Uses the Nominatim API from OpenStreetMap (free, no key).
 * Returns null if the city is not found.
 *
 * @param  {string} cityName  e.g. "Lahore" or "New York"
 * @returns {Object|null}     { lat, lon, displayName } or null
 */
async function geocodeCity(cityName) {
  /*
   * Template literal builds the URL dynamically:
   * encodeURIComponent() handles spaces & special chars safely
   * e.g. "New York" → "New%20York" so the URL stays valid
   */
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;

  const response = await fetch(url, {
    headers: {
      /* Nominatim requires a User-Agent header – identifies our app */
      'User-Agent': 'PulseDashboard/1.0 (internship-project)'
    }
  });

  /* response.ok is true when HTTP status is 200-299 (success) */
  if (!response.ok) throw new Error('Geocoding service unavailable.');

  /*
   * response.json() parses the response body from JSON text
   * into a JavaScript array. We use await because it's async.
   */
  const data = await response.json();

  /* Nominatim returns an empty array [] if city not found */
  if (!data || data.length === 0) return null;

  /* Return only the fields we need */
  return {
    lat:         data[0].lat,
    lon:         data[0].lon,
    displayName: data[0].display_name
  };
}


/**
 * fetchWeather(lat, lon)
 * ──────────────────────
 * Fetches current weather conditions from Open-Meteo API.
 * Open-Meteo is completely free and requires no API key.
 *
 * @param  {string} lat  latitude  e.g. "31.5497"
 * @param  {string} lon  longitude e.g. "74.3436"
 * @returns {Object}     weather data object
 */
async function fetchWeather(lat, lon) {
  /*
   * We request specific fields using the 'current' parameter.
   * wind_speed_10m = wind speed at 10 metres above ground
   * relative_humidity_2m = humidity at 2m height
   * apparent_temperature = "feels like" temperature
   * weather_code = WMO code that maps to a description
   */
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
    `weather_code,wind_speed_10m` +
    `&wind_speed_unit=kmh&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather service unavailable.');

  const data = await response.json();

  /* Destructure just the 'current' block from the response */
  const c = data.current;

  return {
    temp:        Math.round(c.temperature_2m),
    feelsLike:   Math.round(c.apparent_temperature),
    humidity:    c.relative_humidity_2m,
    windSpeed:   Math.round(c.wind_speed_10m),
    weatherCode: c.weather_code
  };
}


/**
 * getWeatherInfo(cityName)
 * ─────────────────────────
 * Combines geocodeCity + fetchWeather into one easy call.
 * events.js calls this – it doesn't need to know about two steps.
 *
 * Returns { weather, cityLabel } or throws an Error.
 */
async function getWeatherInfo(cityName) {
  const geo = await geocodeCity(cityName);

  if (!geo) {
    /* City not found – throw a custom error message */
    throw new Error(`City "${cityName}" not found. Try another name.`);
  }

  const weather = await fetchWeather(geo.lat, geo.lon);

  /*
   * display_name from Nominatim is very long:
   * "Lahore, Punjab, Pakistan"
   * We take only the first two comma-separated parts for display.
   */
  const cityLabel = geo.displayName.split(',').slice(0, 2).join(',');

  return { weather, cityLabel };
}


/* ══════════════════════════════════════════════════════════════
   WMO WEATHER CODE → human label + emoji
   WMO (World Meteorological Organization) uses numeric codes.
   This helper maps those codes to readable text + an emoji.
   ══════════════════════════════════════════════════════════════ */

/**
 * decodeWeatherCode(code)
 * ───────────────────────
 * Returns { label, emoji } for a given WMO weather code.
 */
function decodeWeatherCode(code) {
  /* Map of WMO codes to descriptions */
  const codes = {
    0:  { label: 'Clear Sky',        emoji: '☀️'  },
    1:  { label: 'Mainly Clear',     emoji: '🌤'  },
    2:  { label: 'Partly Cloudy',    emoji: '⛅'  },
    3:  { label: 'Overcast',         emoji: '☁️'  },
    45: { label: 'Foggy',            emoji: '🌫'  },
    48: { label: 'Icy Fog',          emoji: '🌫'  },
    51: { label: 'Light Drizzle',    emoji: '🌦'  },
    61: { label: 'Light Rain',       emoji: '🌧'  },
    63: { label: 'Moderate Rain',    emoji: '🌧'  },
    65: { label: 'Heavy Rain',       emoji: '🌧'  },
    71: { label: 'Light Snow',       emoji: '❄️'  },
    73: { label: 'Moderate Snow',    emoji: '❄️'  },
    75: { label: 'Heavy Snow',       emoji: '🌨'  },
    80: { label: 'Rain Showers',     emoji: '🌦'  },
    95: { label: 'Thunderstorm',     emoji: '⛈'  },
    99: { label: 'Heavy Thunderstorm', emoji: '⛈' },
  };
  /* Return matching code or a fallback if code isn't in our map */
  return codes[code] || { label: 'Unknown Conditions', emoji: '🌡' };
}

/* ══════════════════════════════════════════════════════════════
   QUOTES  –  Quotable API
   ══════════════════════════════════════════════════════════════ */

/**
 * fetchQuote()
 * ─────────────
 * Fetches a single random quote from quotable.io.
 * No API key required.
 *
 * Returns { text, author, tags }
 */
async function fetchQuote() {
  const response = await fetch('https://api.quotable.io/quotes/random?limit=1');

  if (!response.ok) throw new Error('Could not reach the quotes service.');

  const data = await response.json();

  /*
   * The API returns an array even for a single quote.
   * data[0] gets the first (and only) item.
   */
  const q = data[0];
  return {
    text:   q.content,
    author: q.author,
    tags:   q.tags || []
  };
}
/* ══════════════════════════════════════════════════════════════
   GITHUB  –  GitHub REST API
   ══════════════════════════════════════════════════════════════ */

/**
 * fetchGitHubUser(username)
 * ─────────────────────────
 * Fetches a public GitHub user's profile.
 * No API key needed for public data (rate limit: 60 req/hr).
 *
 * @param  {string} username  e.g. "torvalds" or "sindresorhus"
 * @returns {Object}  profile data
 */
async function fetchGitHubUser(username) {
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);

  /*
   * GitHub returns 404 for unknown users.
   * We handle this specifically to show a friendly message.
   */
  if (response.status === 404) {
    throw new Error(`GitHub user "${username}" not found.`);
  }

  if (!response.ok) {
    throw new Error('GitHub API unavailable. Try again shortly.');
  }

  const d = await response.json();

  /* Return only the fields we display (ignore the ~30 others) */
  return {
    name:       d.name || d.login,
    login:      d.login,
    avatarUrl:  d.avatar_url,
    bio:        d.bio,
    location:   d.location,
    blog:       d.blog,
    publicRepos: d.public_repos,
    followers:  d.followers,
    following:  d.following,
    profileUrl: d.html_url
  };
}