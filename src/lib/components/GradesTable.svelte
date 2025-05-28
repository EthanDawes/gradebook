<script lang="ts">
    import { gradeStore } from '$lib/stores.svelte.js';
    import type { Course } from '$lib/types.js';

    interface Props {
        courseItem: Course;
    }

    let { courseItem }: Props = $props();
    let whatIfMode = $state(false);

    function formatPercentage(num: number): string {
        return Math.round(num).toString();
    }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-lg">Grades</h2>
        <label class="flex items-center text-sm">
            <input type="checkbox" bind:checked={whatIfMode} class="mr-2">
            "What If" mode
        </label>
    </div>

    <!-- Single unified table -->
    <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
            <thead>
            <tr class="border-b-2 border-gray-300">
                <th class="text-left py-3 px-2 text-gray-700 font-medium">Grade Item</th>
                <th class="text-center py-3 px-2 text-gray-700 font-medium">Points</th>
                <th class="text-center py-3 px-2 text-gray-700 font-medium">Weight Achieved</th>
                <th class="text-center py-3 px-2 text-gray-700 font-medium">Grade</th>
            </tr>
            </thead>
            <tbody>
            {#each courseItem.categories as category, categoryIndex}
                <!-- Category header row -->
                <tr class="bg-gray-50 border-b border-gray-200">
                    <td class="py-2 px-2">
                        <div class="flex items-center gap-2">
                            <input
                                    class="font-medium text-base border-none outline-none bg-transparent"
                                    value={category.name}
                                    oninput={(e) => gradeStore.updateCategory(categoryIndex, 'name', e.target.value)}
                            >
                            <button
                                    class="text-blue-600 hover:text-blue-800 text-lg font-bold"
                                    onclick={() => gradeStore.addGrade(categoryIndex)}
                                    title="Add grade to this category"
                            >
                                +
                            </button>
                            <button
                                    class="text-red-600 hover:text-red-800 text-lg font-bold"
                                    onclick={() => gradeStore.removeCategory(categoryIndex)}
                                    title="Remove this category"
                            >
                                ×
                            </button>
                        </div>
                    </td>
                    <td class="py-2 px-2"></td>
                    <td class="py-2 px-2 text-center">
                        <div class="flex items-center justify-center gap-1 text-sm">
                            <input
                                    class="grade-input w-12 text-center text-xs"
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={category.weight * 100}
                                    oninput={(e) => gradeStore.updateCategory(categoryIndex, 'weight', (parseFloat(e.target.value) || 0) / 100)}
                            >
                            <span class="text-xs">%</span>
                        </div>
                    </td>
                    <td class="py-2 px-2 text-center text-sm">
                        {formatPercentage(category.weight * 100)} %
                    </td>
                </tr>

                <!-- Grade rows for this category -->
                {#each category.grades as grade, gradeIndex}
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-2 px-2 pl-6">
                            <div class="flex items-center gap-2">
                                <input
                                        class="grade-input"
                                        value={grade.source}
                                        oninput={(e) => gradeStore.updateGrade(categoryIndex, gradeIndex, 'source', e.target.value)}
                                >
                                <button
                                        class="text-red-600 hover:text-red-800"
                                        onclick={() => gradeStore.removeGrade(categoryIndex, gradeIndex)}
                                        title="Remove grade"
                                >
                                    ×
                                </button>
                            </div>
                        </td>
                        <td class="py-2 px-2 text-center">
                            <div class="flex items-center justify-center gap-1">
                                <input
                                        class="grade-input w-16 text-center"
                                        type="number"
                                        value={grade.pointsEarned}
                                        oninput={(e) => gradeStore.updateGrade(categoryIndex, gradeIndex, 'pointsEarned', parseFloat(e.target.value) || 0)}
                                >
                                <span>/</span>
                                <input
                                        class="grade-input w-16 text-center"
                                        type="number"
                                        value={grade.pointsPossible}
                                        oninput={(e) => gradeStore.updateGrade(categoryIndex, gradeIndex, 'pointsPossible', parseFloat(e.target.value) || 0)}
                                >
                            </div>
                        </td>
                        <td class="py-2 px-2 text-center">
                            {#if category.weight > 0 && grade.pointsPossible > 0}
                                {formatPercentage((grade.pointsEarned / grade.pointsPossible) * category.weight * 100)} / {formatPercentage(category.weight * 100)}
                            {:else}
                                - / -
                            {/if}
                        </td>
                        <td class="py-2 px-2 text-center">
                            {#if grade.pointsPossible > 0}
                                {formatPercentage((grade.pointsEarned / grade.pointsPossible) * 100)}%
                            {:else}
                                -%
                            {/if}
                        </td>
                    </tr>
                {/each}

                <!-- Empty category message -->
                {#if category.grades.length === 0}
                    <tr class="border-b border-gray-100">
                        <td class="py-2 px-2 pl-6 text-gray-500 text-sm">
                            - / {formatPercentage(category.weight * 100)}
                        </td>
                        <td class="py-2 px-2"></td>
                        <td class="py-2 px-2 text-center text-gray-500">- / -</td>
                        <td class="py-2 px-2 text-center text-gray-500">-%</td>
                    </tr>
                {/if}
            {/each}
            </tbody>
        </table>
    </div>

    <!-- Add Category Button -->
    <div class="mt-4">
        <button
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onclick={() => gradeStore.addCategory()}
        >
            + Add Category
        </button>
    </div>
</div>