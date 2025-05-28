<script lang="ts">
    import { gradeStore } from '$lib/stores.svelte.js';
    import type { Class } from '$lib/types.js';

    interface Props {
        classItem: Class;
        currentGrade: number;
    }

    let { classItem, currentGrade }: Props = $props();

    function formatPercentage(num: number): string {
        return Math.round(num).toString();
    }
</script>

<div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">{classItem.name}</h1>
    <div class="text-lg">
        Current Grade: <span class="font-semibold">{formatPercentage(currentGrade)}%</span>
        <span class="ml-2 text-xl font-bold">
            {gradeStore.getLetterGrade(currentGrade, classItem.gradeCutoffs)}
        </span>
    </div>
</div>
