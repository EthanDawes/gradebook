<script lang="ts">
    import { gradeStore } from "../stores.svelte";

    function handleCourseChange(ev: Event) {
        const courseIndex = Number.parseInt(
            (ev.target as HTMLSelectElement).value,
        );
        gradeStore.removeCourseAssociation(location.href);
        if (courseIndex > -1) {
            gradeStore.setSelectedCourse(
                gradeStore.currentSemester?.courses[courseIndex],
            );
            gradeStore.addCourseAssociation(location.href);
        } else location.reload();
    }

    function createCourse() {
        gradeStore.addCourse();
        gradeStore.addCourseAssociation(location.href);
    }
</script>

{#if gradeStore.currentSemester?.courses.length}
    <select onchange={handleCourseChange}>
        <option disabled selected>Track grades</option>
        {#each gradeStore.currentSemester.courses as course, idx}
            <option
                selected={course.name === gradeStore.selectedCourse?.name}
                value={idx}>{course.name}</option
            >
        {/each}
        {#if gradeStore.selectedCourse}
            <option value="-1">- Stop tracking</option>
        {/if}
    </select>
{:else}
    <button onclick={createCourse} style="border: 1px solid rgb(118, 118, 118);"
        >🆕 Track grades</button
    >
{/if}
