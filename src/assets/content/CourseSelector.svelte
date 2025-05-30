<script lang="ts">
    import { gradeStore } from "../stores.svelte";

    function handleCourseChange(ev: Event) {
        const selectedVal = (ev.target as HTMLSelectElement).value;
        if (selectedVal === "_new") {
            gradeStore.addCourse();
            gradeStore.addCourseAssociation(location.href);
            return;
        }
        const courseIndex = Number.parseInt(selectedVal);
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
        <option value="_new">+ New course</option>
        {#if gradeStore.selectedCourse}
            <option value="-1">- Stop tracking</option>
        {/if}
    </select>
{:else}
    <button onclick={createCourse} class="reset">🆕 Track grades</button>
{/if}
<button
    onclick={() => browser.runtime.sendMessage({ action: "openOptionsPage" })}
    style="text-decoration: none;">↗️</button
>
