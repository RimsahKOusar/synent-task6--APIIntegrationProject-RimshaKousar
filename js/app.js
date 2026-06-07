/*
╔═══════════════════════════════════════════════════════════════╗
║  app.js  –  APPLICATION ENTRY POINT                          ║
║                                                               ║
║  What this file does:                                         ║
║  Fires automatically once the page finishes loading.         ║
║  Its only job: fetch a quote immediately on load so the      ║
║  quote panel isn't empty when the user first visits.         ║
║                                                               ║
║  All other startup work is done by the browser itself:       ║
║  index.html defines the structure, CSS files paint it,       ║
║  events.js wires the buttons.                                 ║
║  This file is deliberately tiny – a clean entry point.       ║
╚═══════════════════════════════════════════════════════════════╝
*/


/**
 * init()
 * ──────
 * Called once when the page is ready.
 * Triggers an automatic quote fetch so something interesting
 * appears on load without the user having to click anything.
 */
async function init() {
  /*
   * Pre-load a quote so the panel isn't empty.
   * handleQuoteFetch is defined in events.js (loaded before app.js).
   * We call it exactly as if the user clicked the button.
   */
  try {
    await handleQuoteFetch();
  } catch (_) {
    /* Silent fail – the error state is already shown by handleQuoteFetch */
  }

  /*
   * Pre-fill the city input with user's likely city based on
   * the assignment description (Lahore, PK context).
   * Just a helpful default – user can change it.
   */
  const cityInput = document.getElementById('cityInput');
  if (cityInput && !cityInput.value) {
    cityInput.placeholder = 'Try: Lahore, Tokyo, London…';
  }
}


/* Run init after all HTML elements exist in the DOM */
document.addEventListener('DOMContentLoaded', init);
