import CourseSelector from "@/assets/content/CourseSelector.svelte";
import { mount, SvelteComponent, unmount } from "svelte";
import { Course } from "@/assets/types";
import "@/assets/content/inject.css";
import { gradeStore } from "@/assets/stores.svelte";
import CategorySelector from "@/assets/content/CategorySelector.svelte";
import AverageSelector from "@/assets/content/AverageSelector.svelte";

export default defineContentScript({
  matches: ["https://www.gradescope.com/courses/*"],

  async main(ctx) {
    await gradeStore.ready;
    const semesters = gradeStore.semesters;

    let currentCourse: Course | undefined;
    const currentSemester =
      semesters.find(
        (semester) =>
          (currentCourse = semester.courses.find((course) =>
            course.associations.includes(location.href),
          )),
      ) || semesters.at(-1);
    gradeStore.setSemester(currentSemester);
    gradeStore.setSelectedCourse(currentCourse);

    console.log(location.pathname, currentCourse, currentSemester);

    async function mountUi<T extends Record<string, any>>(
      anchorSelector: ContentScriptAnchoredOptions["anchor"],
      component: typeof SvelteComponent<T>,
      props = {} as T,
    ) {
      const ui = createIntegratedUi(ctx, {
        position: "inline",
        anchor: anchorSelector,
        tag: "span",
        onMount: (container) => {
          // Create the Svelte app inside the UI container
          mount(component, {
            target: container,
            props,
          });
        },
        onRemove: (app) => {
          // Destroy the app when the UI is removed
          unmount(app);
        },
      });
      ui.mount();
      return ui;
    }

    mountUi(".courseHeader--courseID", CourseSelector);
    for (const row of document.querySelectorAll("tbody tr")) {
      const titleElem = row.querySelector(".table--primaryLink") as HTMLElement;
      const title = titleElem.innerText;
      const scoreElem = row.querySelector(
        ".submissionStatus--score",
      ) as HTMLElement;
      mountUi(titleElem, CategorySelector, {
        title,
        score: scoreElem.innerText,
      });
      mountUi(scoreElem, AverageSelector, { title });
    }
  },
});
