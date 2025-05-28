<script lang="ts">
    import { gradeStore } from '$lib/stores.svelte.js';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import ClassHeader from '$lib/components/ClassHeader.svelte';
    import GradeCutoffs from '$lib/components/GradeCutoffs.svelte';
    import GradesTable from '$lib/components/GradesTable.svelte';
    import GradeStats from '$lib/components/GradeStats.svelte';
    import EmptyState from '$lib/components/EmptyState.svelte';
</script>

<div class="flex h-screen">
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 p-6">
        {#if gradeStore.selectedClass}
            {@const classItem = gradeStore.selectedClass}
            {@const currentGrade = gradeStore.calculateClassGrade(classItem)}

            <ClassHeader {classItem} {currentGrade} />
            <GradeCutoffs {classItem} />
            <GradesTable {classItem} />
            <GradeStats {classItem} />
        {:else}
            <EmptyState />
        {/if}
    </div>
</div>