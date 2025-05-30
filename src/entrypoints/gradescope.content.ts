import "@/assets/content/inject.css";
import injectFactory from "@/assets/content/injectFactory";

export default defineContentScript({
  matches: ["https://www.gradescope.com/courses/*"],

  main: injectFactory(
    ".courseHeader--courseID",
    "tbody tr",
    ".table--primaryLink",
    ".submissionStatus--score",
  ),
});
