const THEME_INIT_SCRIPT = `
(function () {
  try {
    function readCookie(name) {
      var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    }
    var theme = readCookie("theme");
    if (theme !== "light" && theme !== "dark") {
      var legacy = null;
      try {
        legacy = localStorage.getItem("theme");
      } catch (e) {}
      if (legacy === "light" || legacy === "dark") {
        document.cookie = "theme=" + legacy + "; path=/; max-age=31536000; samesite=lax";
        theme = legacy;
      }
    }
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {}
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
