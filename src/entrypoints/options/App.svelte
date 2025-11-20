<script lang="ts">
    import { gradeStore } from "~/assets/stores.svelte.js";
    import Sidebar from "./components/Sidebar.svelte";
    import CourseHeader from "./components/CourseHeader.svelte";
    import GradeCutoffs from "./components/GradeCutoffs.svelte";
    import GradesTable from "./components/GradesTable.svelte";
    import GradeStats from "./components/GradeStats.svelte";
    import EmptyState from "./components/EmptyState.svelte";
</script>

<div class="flex">
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 p-6">
        {#if gradeStore.selectedCourse}
            {@const courseItem = gradeStore.selectedCourse}
            {@const currentGrade = gradeStore.calculateCourseGrade(courseItem)}

            <CourseHeader {courseItem} {currentGrade} />
            <GradeCutoffs {courseItem} />
            <GradesTable {courseItem} />
            <GradeStats {courseItem} />
        {:else}
            <EmptyState />
        {/if}
    </div>
</div>
