<script lang="ts">
  import { gradeStore } from "../stores.svelte";
  import { Course } from "../types";

    function handleCourseChange(ev: Event) {
        const courseIndex = Number.parseInt((ev.target as HTMLSelectElement).value)
        gradeStore.removeCourseAssociation(location.href);
        if (courseIndex > 0){
            gradeStore.setSelectedCourse(gradeStore.currentSemester?.courses[courseIndex])
            gradeStore.addCourseAssociation(location.href);
        }
    }

    function createCourse() {
        gradeStore.addCourse()
        gradeStore.addCourseAssociation(location.href)
    }
</script>

{#if gradeStore.currentSemester?.courses.length}
    <select onchange={handleCourseChange}>
        <option value="-1">Track grades</option>
        <option disabled>──────────</option>
        {#each gradeStore.currentSemester.courses as course, idx}
            <option selected={course.name === gradeStore.selectedCourse?.name} value={idx}>{course.name}</option>
        {/each}
    </select>
{:else}
    <button onclick={createCourse}>Track grades</button>
{/if}