<script lang="ts">
    import { gradeStore } from '$lib/stores.svelte.js';
    import type { Course } from '$lib/types.js';

    interface Props {
        courseItem: Course;
        currentGrade: number;
    }

    let { courseItem, currentGrade }: Props = $props();

    function formatPercentage(num: number): string {
        return Math.round(num).toString();
    }
</script>

<div class="mb-6 {gradeStore.whatIfMode ? 'p-4 bg-orange-50 border border-orange-200 rounded-lg' : ''}">
    <h1 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        {courseItem.name}
        {#if gradeStore.whatIfMode}
            <span class="text-orange-600 bg-orange-100 px-3 py-1 rounded text-sm font-medium">
                What If Mode Active
            </span>
        {/if}
    </h1>
    <div class="text-lg">
        Current Grade: <span class="font-semibold">{formatPercentage(currentGrade)}%</span>
        <span class="ml-2 text-xl font-bold">
            {gradeStore.getLetterGrade(currentGrade, courseItem.gradeCutoffs)}
        </span>
        {#if gradeStore.whatIfMode}
            <span class="ml-3 text-sm text-orange-600 font-medium">
                (Preview - changes not saved)
            </span>
        {/if}
    </div>
</div>
