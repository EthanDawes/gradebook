<script lang="ts">
    import { gradeStore } from '$lib/stores.svelte.js';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import CourseHeader from '$lib/components/CourseHeader.svelte';
    import GradeCutoffs from '$lib/components/GradeCutoffs.svelte';
    import GradesTable from '$lib/components/GradesTable.svelte';
    import GradeStats from '$lib/components/GradeStats.svelte';
    import EmptyState from '$lib/components/EmptyState.svelte';
</script>

<div class="flex h-screen">
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