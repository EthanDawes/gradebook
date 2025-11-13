<script lang="ts">
    import { gradeStore } from "~/assets/stores.svelte.js";
    import type { Course } from "~/assets/types.js";
    import { formatPercentage } from "~/assets";

    interface Props {
        courseItem: Course;
        currentGrade: number;
    }

    let { courseItem, currentGrade }: Props = $props();

    const calculateUncurvedGrade = () =>
        gradeStore.calculateCourseGrade(courseItem, false);

    function hasCurve(): boolean {
        if (!courseItem.curve) return false;

        // Check if any grades have class averages set
        return courseItem.categories.some((category) =>
            category.grades.some((grade) => grade.classAverage !== undefined),
        );
    }

    function isCurveEnabled(): boolean {
        // Check if the curve checkbox is checked in GradeCutoffs
        return !!(courseItem.curve && courseItem.curve !== "");
    }
</script>

<div
    class="mb-6 {gradeStore.whatIfMode
        ? 'p-4 bg-orange-50 border border-orange-200 rounded-lg'
        : ''}"
>
    <h1 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        {courseItem.name}
        {#if gradeStore.whatIfMode}
            <span
                class="text-orange-600 bg-orange-100 px-3 py-1 rounded text-sm font-medium"
            >
                What If Mode Active
            </span>
        {/if}
    </h1>
    <div class="text-lg">
        Current Grade:
        {#if isCurveEnabled() && hasCurve()}
            {@const uncurvedGrade = calculateUncurvedGrade()}
            <span class="font-semibold"
                >{formatPercentage(uncurvedGrade)}% → {formatPercentage(
                    currentGrade,
                )}%</span
            >
            <span class="ml-2 text-xl font-bold">
                {gradeStore.getLetterGrade(
                    uncurvedGrade,
                    courseItem.gradeCutoffs,
                )} → {gradeStore.getLetterGrade(
                    currentGrade,
                    courseItem.gradeCutoffs,
                )}
            </span>
        {:else}
            <span class="font-semibold">{formatPercentage(currentGrade)}%</span>
            <span class="ml-2 text-xl font-bold">
                {gradeStore.getLetterGrade(
                    currentGrade,
                    courseItem.gradeCutoffs,
                )}
            </span>
        {/if}
        {#if gradeStore.whatIfMode}
            <span class="ml-3 text-sm text-orange-600 font-medium">
                (Preview - changes not saved)
            </span>
        {/if}
    </div>
</div>
