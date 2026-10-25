// Shared by the client ThemeProvider and the server root layout, so it can't
// live in a "use client" module.

export const THEME_STORAGE_KEY = "theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Runs in <head> before the page paints so a dark-mode visitor never sees a
 * white flash. Must resolve the theme the same way ThemeProvider does.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("${DARK_QUERY}").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
