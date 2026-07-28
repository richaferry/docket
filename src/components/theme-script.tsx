const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (e) {}
})();
`;

export function ThemeScript() {
  // Runs before paint so the stored preference applies immediately, with no
  // flash of the wrong theme. Must stay a plain inline script (no external
  // file, no async) to execute synchronously ahead of first paint.
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
