<script lang="ts">
    import type { Course } from '$lib/types.js';
    import {gradeStore} from "$lib/stores.svelte";

    interface Props {
        courseItem: Course;
    }

    let { courseItem }: Props = $props();
    
    // Initialize course defaults when component loads
    gradeStore.initializeCourseDefaults(courseItem);
    
    // Check if curve is set and is a valid grade in the current scale
    function isCurveEnabled(): boolean {
        if (!courseItem.curve) return false;
        const gradeScale = gradeStore.gradeScales.find(scale => scale.name === courseItem.gradeScale);
        return gradeScale?.scale.includes(courseItem.curve) ?? false;
    }
    
    let curveToB = $state(isCurveEnabled());
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 mb-6 {gradeStore.whatIfMode ? 'ring-2 ring-orange-300 bg-orange-50' : ''}">
    <h2 class="font-semibold mb-3 flex items-center gap-2">
        Cutoffs
        {#if gradeStore.whatIfMode}
            <span class="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-medium">
                What If Mode Active
            </span>
        {/if}
    </h2>

    <div class="mb-3">
        <label class="text-sm text-gray-600">
            Scale:
            <select class="ml-2 p-1 border border-gray-300 rounded text-sm" onchange={(e) => gradeStore.updateCourseGradeScale((e.target as HTMLSelectElement).value)}>
                {#each gradeStore.gradeScales as scale}
                    <option value={scale.name} selected={scale.name === courseItem.gradeScale}>{scale.name}</option>
                {/each}
            </select>
        </label>
    </div>

    <div class="mb-3">
        <label class="flex items-center text-sm">
            <input type="checkbox" bind:checked={curveToB} class="mr-2" onchange={(e) => {
                if (!(e.target as HTMLInputElement).checked) {
                    gradeStore.updateCourseCurve('');
                } else {
                    // Set to grade scale's average as default
                    const gradeScale = gradeStore.gradeScales.find(scale => scale.name === courseItem.gradeScale);
                    const defaultCurve = gradeScale?.average || '';
                    gradeStore.updateCourseCurve(defaultCurve);
                }
            }}>
            Increase the points of assignments with averages so that the average earns a
            <select class="mx-1 p-1 border border-gray-300 rounded text-sm {!curveToB ? 'bg-gray-100 text-gray-400' : ''}" 
                    disabled={!curveToB}
                    onchange={(e) => gradeStore.updateCourseCurve((e.target as HTMLSelectElement).value)}>
                {#each gradeStore.gradeScales.find(scale => scale.name === courseItem.gradeScale)?.scale ?? [] as grade}
                    {@const gradeScale = gradeStore.gradeScales.find(scale => scale.name === courseItem.gradeScale)}
                    {@const selectedGrade = courseItem.curve || gradeScale?.average || ''}
                    <option value={grade} selected={grade === selectedGrade}>{grade}</option>
                {/each}
            </select>
        </label>
    </div>

    <div class="flex gap-4 text-sm flex-wrap">
        {#each gradeStore.gradeScales.find(scale => scale.name === courseItem.gradeScale)?.scale ?? [] as grade}
            <div class="flex items-center">
                <span class="mr-1">{grade}</span>
                <input 
                    class="grade-input w-16 p-1 border border-gray-300 rounded text-center" 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={courseItem.gradeCutoffs[grade]} 
                    oninput={(e) => gradeStore.updateGradeCutoff(grade, parseFloat((e.target as HTMLInputElement).value) || 0)}
                >
                <span class="ml-1">%</span>
            </div>
        {/each}
    </div>
</div>