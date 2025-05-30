import CourseSelector from "@/assets/content/CourseSelector.svelte";
import { mount, SvelteComponent } from "svelte";
import { Course } from "@/assets/types";
import { gradeStore } from "@/assets/stores.svelte";
import CategorySelector from "@/assets/content/CategorySelector.svelte";
import { ContentScriptContext } from "#imports";

export default function injectFactory(
  courseSelector: string,
  rowSelector: string,
  titleSelector: string,
  scoreSelector: string,
) {
  return async function main(ctx: ContentScriptContext) {
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
          container.style.position = "relative";
          // Create the Svelte app inside the UI container
          mount(component, {
            target: container,
            props,
          });
        },
      });
      ui.mount();
      return ui;
    }

    mountUi(courseSelector, CourseSelector);
    for (const row of document.querySelectorAll(rowSelector)) {
      const titleElem = row.querySelector(titleSelector) as HTMLElement;
      const title = titleElem.innerText;
      const scoreElem = row.querySelector(scoreSelector) as
        | HTMLElement
        | undefined;
      mountUi(titleElem, CategorySelector, {
        title,
        score: scoreElem?.innerText || scoreElem?.value,
      });
    }
  };
}
