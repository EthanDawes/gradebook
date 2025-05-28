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

    function calculateUncurvedGrade(): number {
        let totalWeightedPoints = 0;
        let totalWeight = 0;

        for (const category of courseItem.categories) {
            if (category.grades.length === 0) continue;

            const categoryTotal = category.grades.reduce((sum, grade) => {
                if (
                    grade.pointsEarned !== undefined &&
                    grade.pointsPossible !== undefined &&
                    grade.pointsPossible > 0
                ) {
                    return sum + grade.pointsEarned / grade.pointsPossible;
                }
                return sum;
            }, 0);
            
            const validGrades = category.grades.filter(
                (grade) =>
                    grade.pointsEarned !== undefined &&
                    grade.pointsPossible !== undefined &&
                    grade.pointsPossible > 0,
            );
            
            const categoryAverage =
                validGrades.length > 0 ? categoryTotal / validGrades.length : 0;

            totalWeightedPoints += categoryAverage * category.weight;
            totalWeight += category.weight;
        }

        return totalWeight > 0 ? (totalWeightedPoints / totalWeight) * 100 : 0;
    }

    function hasCurve(): boolean {
        if (!courseItem.curve) return false;
        
        // Check if any grades have class averages set
        return courseItem.categories.some(category =>
            category.grades.some(grade => grade.classAverage !== undefined)
        );
    }

    function isCurveEnabled(): boolean {
        // Check if the curve checkbox is checked in GradeCutoffs
        return !!(courseItem.curve && courseItem.curve !== '');
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
        Current Grade: 
        {#if isCurveEnabled() && hasCurve()}
            {@const uncurvedGrade = calculateUncurvedGrade()}
            <span class="font-semibold">{formatPercentage(uncurvedGrade)}% → {formatPercentage(currentGrade)}%</span>
            <span class="ml-2 text-xl font-bold">
                {gradeStore.getLetterGrade(uncurvedGrade, courseItem.gradeCutoffs)} → {gradeStore.getLetterGrade(currentGrade, courseItem.gradeCutoffs)}
            </span>
        {:else}
            <span class="font-semibold">{formatPercentage(currentGrade)}%</span>
            <span class="ml-2 text-xl font-bold">
                {gradeStore.getLetterGrade(currentGrade, courseItem.gradeCutoffs)}
            </span>
        {/if}
        {#if gradeStore.whatIfMode}
            <span class="ml-3 text-sm text-orange-600 font-medium">
                (Preview - changes not saved)
            </span>
        {/if}
    </div>
</div>
