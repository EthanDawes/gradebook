// entrypoints/example-ui.content/index.ts
import { loadFromStorage } from '@/assets/storage';
import CourseSelector from '@/assets/content/CourseSelector.svelte';
import { mount, unmount } from 'svelte';
import { Course } from '@/assets/types';
import "@/assets/content/inject.css"
import { gradeStore } from '@/assets/stores.svelte';

export default defineContentScript({
  matches: ['https://www.gradescope.com/courses/*'],

  async main(ctx) {
    await gradeStore.ready;
    const semesters = gradeStore.semesters;

    let currentCourse: Course | undefined;
    const currentSemester = semesters.find(semester =>
      currentCourse = semester.courses.find(course => course.associations.includes(location.href))
    ) || semesters.at(-1);
    gradeStore.setSemester(currentSemester)
    gradeStore.setSelectedCourse(currentCourse)

    console.log(location.pathname, currentCourse, currentSemester)

    async function mountUi(anchorSelector: string) {
      const ui = createIntegratedUi(ctx, {
        position: 'inline',
        anchor: anchorSelector,
        tag: "span",
        onMount: (container) => {
          // Create the Svelte app inside the UI container
          mount(CourseSelector, {
            target: container,
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

    mountUi(".courseHeader--courseID")
  },
});
