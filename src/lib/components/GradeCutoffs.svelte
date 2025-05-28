<script lang="ts">
    import type { Course } from '$lib/types.js';
    import {gradeStore} from "$lib/stores.svelte";

    interface Props {
        courseItem: Course;
    }

    let { courseItem }: Props = $props();
    let curveToB = $state(false);
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
    <h2 class="font-semibold mb-3">Cutoffs</h2>

    <div class="mb-3">
        <label class="text-sm text-gray-600">
            Scale:
            <select class="ml-2 p-1 border border-gray-300 rounded text-sm">
                {#each gradeStore.gradeScales as scale}
                    <option selected={scale.name === courseItem.gradeScale}>{scale.name}</option>
                {/each}
            </select>
        </label>
    </div>

    <div class="mb-3">
        <label class="flex items-center text-sm">
            <input type="checkbox" bind:checked={curveToB} class="mr-2">
            Increase the points of assignments with averages so that the average earns a
            <select class="mx-1 p-1 border border-gray-300 rounded text-sm">
                {#each gradeStore.gradeScales.find(scale => scale.name === courseItem.gradeScale)?.scale ?? [] as grade}
                    <option selected={grade === courseItem.curve}>{grade}</option>
                {/each}
            </select>
        </label>
    </div>

    <div class="flex gap-4 text-sm">
        {#each gradeStore.gradeScales.find(scale => scale.name === courseItem.gradeScale)?.scale ?? [] as grade}
            <div>{grade} <input class="grade-input w-16" value={courseItem.gradeCutoffs[grade]} readonly> %</div>
        {/each}
    </div>
</div>