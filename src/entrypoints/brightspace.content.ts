import "@/assets/content/inject.css";
import injectFactory from "@/assets/content/injectFactory";

export default defineContentScript({
  matches: ["https://*.brightspace.com/d2l/lms/grades/my_grades/*"],

  main: injectFactory(
    ".d2l-table-row-first .d2l-table-cell-first",
    ".d2l-table tr:not([header]):not(.d_ggl1)",
    "th",
    "td:not(.d2l-table-cell-last) input", // Columns: sometimes padding, title, points, percentage. Let's hope this works
  ),
});
