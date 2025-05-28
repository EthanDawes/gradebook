<script lang="ts">
    import { gradeStore } from '$lib/stores.svelte.js';
    import type { Course, Category, Grade } from '$lib/types.js';

    let whatIfMode = $state(false);
    let curveToB = $state(false);

    function formatPercentage(num: number): string {
        return Math.round(num).toString();
    }

    function addNewCategory() {
        if (!gradeStore.selectedClass) return;

        gradeStore.selectedClass.categories.push({
            name: 'New Category',
            weight: 0.1,
            grades: []
        });
    }
</script>

<div class="flex h-screen">
    <!-- Left Sidebar -->
    <div class="w-64 bg-white border-r border-gray-200 p-4">
        <!-- Semester Dropdown -->
        <div class="mb-6">
            <select
                    class="w-full p-2 border border-gray-300 rounded-md text-sm"
                    bind:value={gradeStore.currentSemester}
                    onchange={(e) => gradeStore.setSemester(e.target.value)}
            >
                {#each gradeStore.semesters as semester}
                    <option value={semester}>{semester.name}</option>
                {/each}
            </select>
        </div>

        <!-- Classes List -->
        <div class="space-y-2">
            {#each gradeStore.currentSemester.courses as classItem}
                {@const percentage = gradeStore.calculateClassGrade(classItem)}
                {@const letterGrade = gradeStore.getLetterGrade(percentage, classItem.gradeCutoffs)}

                <button
                        class="w-full text-left p-3 rounded-lg border-2 transition-colors
                           {gradeStore.selectedClass === classItem
                             ? 'border-blue-500 bg-blue-50'
                             : 'border-gray-200 hover:border-gray-300'}"
                        onclick={() => gradeStore.setSelectedClass(classItem)}
                >
                    <div class="font-medium text-sm text-gray-900 mb-1">
                        {classItem.name}
                    </div>
                    <div class="flex justify-between items-center text-xs text-gray-600">
                        <span>{formatPercentage(percentage)}%</span>
                        <span class="font-medium">{letterGrade}</span>
                    </div>
                </button>
            {/each}
        </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-6">
        {#if gradeStore.selectedClass}
            {@const classItem = gradeStore.selectedClass}
            {@const currentGrade = gradeStore.calculateClassGrade(classItem)}

            <!-- Header -->
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">{classItem.name}</h1>
                <div class="text-lg">
                    Current Grade: <span class="font-semibold">{formatPercentage(currentGrade)}%</span>
                    <span class="ml-2 text-xl font-bold">
                        {gradeStore.getLetterGrade(currentGrade, classItem.gradeCutoffs)}
                    </span>
                </div>
            </div>

            <!-- Cutoffs Section -->
            <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <h2 class="font-semibold mb-3">Cutoffs</h2>

                <div class="mb-3">
                    <label class="text-sm text-gray-600">Scale:</label>
                    <select class="ml-2 p-1 border border-gray-300 rounded text-sm">
                        <option>{classItem.gradeScale}</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="flex items-center text-sm">
                        <input type="checkbox" bind:checked={curveToB} class="mr-2">
                        Increase the points of assignments with averages so that the average earns a
                        <select class="mx-1 p-1 border border-gray-300 rounded text-sm">
                            <option>B</option>
                        </select>
                    </label>
                </div>

                <div class="flex gap-4 text-sm">
                    <div>A <input class="grade-input w-16" value="93" readonly> %</div>
                    <div>B <input class="grade-input w-16" value="83" readonly> %</div>
                    <div>C <input class="grade-input w-16" value="73" readonly> %</div>
                    <div>D <input class="grade-input w-16" value="63" readonly> %</div>
                    <div>F <input class="grade-input w-16" value="0" readonly> %</div>
                </div>
            </div>

            <!-- Grades Section -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="font-semibold text-lg">Grades</h2>
                    <label class="flex items-center text-sm">
                        <input type="checkbox" bind:checked={whatIfMode} class="mr-2">
                        "What If" mode
                    </label>
                </div>

                <div class="space-y-6">
                    {#each classItem.categories as category, categoryIndex}
                        <div class="border border-gray-200 rounded-lg p-4">
                            <!-- Category Header -->
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <input
                                            class="font-medium text-lg border-none outline-none bg-transparent"
                                            bind:value={category.name}
                                    >
                                    <button class="text-blue-600 hover:text-blue-800">+</button>
                                </div>
                                <div class="text-sm text-gray-600">
                                    Weight: <input
                                        class="grade-input w-16"
                                        type="number"
                                        step="0.01"
                                        bind:value={category.weight}
                                > %
                                </div>
                            </div>

                            <!-- Grades Table -->
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm">
                                    <thead>
                                    <tr class="border-b border-gray-200">
                                        <th class="text-left py-2 text-gray-600">Grade Item</th>
                                        <th class="text-center py-2 text-gray-600">Points</th>
                                        <th class="text-center py-2 text-gray-600">Weight Achieved</th>
                                        <th class="text-center py-2 text-gray-600">Grade</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {#each category.grades as grade, gradeIndex}
                                        <tr class="border-b border-gray-100">
                                            <td class="py-3">
                                                <input
                                                        class="grade-input"
                                                        bind:value={grade.source}
                                                >
                                            </td>
                                            <td class="py-3 text-center">
                                                <div class="flex items-center justify-center gap-1">
                                                    <input
                                                            class="grade-input w-16 text-center"
                                                            type="number"
                                                            bind:value={grade.pointsEarned}
                                                    >
                                                    <span>/</span>
                                                    <input
                                                            class="grade-input w-16 text-center"
                                                            type="number"
                                                            bind:value={grade.pointsPossible}
                                                    >
                                                </div>
                                            </td>
                                            <td class="py-3 text-center">
                                                {#if category.weight > 0}
                                                    {formatPercentage((grade.pointsEarned / grade.pointsPossible) * category.weight * 100)} / {formatPercentage(category.weight * 100)}
                                                {:else}
                                                    - / -
                                                {/if}
                                            </td>
                                            <td class="py-3 text-center">
                                                {#if grade.pointsPossible > 0}
                                                    {formatPercentage((grade.pointsEarned / grade.pointsPossible) * 100)}%
                                                {:else}
                                                    -%
                                                {/if}
                                            </td>
                                        </tr>
                                    {/each}

                                    <!-- Add Grade Button -->
                                    <tr>
                                        <td colspan="4" class="py-2">
                                            <button
                                                    class="text-blue-600 hover:text-blue-800 text-sm"
                                                    onclick={() => gradeStore.addGrade(categoryIndex)}
                                            >
                                                + Add Grade
                                            </button>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    {/each}

                    <!-- Add Category Button -->
                    <button
                            class="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                            onclick={addNewCategory}
                    >
                        + Add Category
                    </button>
                </div>

                <!-- Stats Section -->
                <div class="mt-8 bg-gray-50 rounded-lg p-4">
                    <h3 class="font-semibold mb-3">Stats</h3>
                    <div class="text-sm text-gray-600 mb-2">Grade over time</div>

                    <!-- Simple Grade Chart Placeholder -->
                    <div class="h-32 bg-white border border-gray-200 rounded flex items-center justify-center">
                        <div class="text-gray-400 text-sm">Grade trend chart would go here</div>
                    </div>
                </div>
            </div>
        {:else}
            <div class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500">
                    <h2 class="text-xl font-medium mb-2">Select a class to view grades</h2>
                    <p class="text-sm">Choose a class from the sidebar to get started</p>
                </div>
            </div>
        {/if}
    </div>
</div>
