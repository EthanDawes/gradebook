<script lang="ts">
    import { gradeStore } from "$lib/stores.svelte.js";
    import type { Course } from "$lib/types.js";

    function formatPercentage(num: number): string {
        return Math.round(num).toString();
    }
</script>

<div class="w-64 bg-white border-r border-gray-200 p-4">
    <!-- Semester Dropdown -->
    <div class="mb-6">
        <select
            class="w-full p-2 border border-gray-300 rounded-md text-sm"
            bind:value={gradeStore.currentSemester}
        >
            {#each gradeStore.semesters as semester}
                <option value={semester}>{semester.name}</option>
            {/each}
        </select>
    </div>

    <!-- Courses List -->
    <div class="space-y-2">
        {#each gradeStore.currentSemester.courses as classItem}
            {@const percentage = gradeStore.calculateCourseGrade(classItem)}
            {@const letterGrade = gradeStore.getLetterGrade(
                percentage,
                classItem.gradeCutoffs,
            )}

            <button
                class="w-full text-left p-3 rounded-lg border-2 transition-colors
                       {gradeStore.selectedCourse === classItem
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'}"
                onclick={() => gradeStore.setSelectedCourse(classItem)}
            >
                <div class="font-medium text-sm text-gray-900 mb-1">
                    {classItem.name}
                </div>
                <div
                    class="flex justify-between items-center text-xs text-gray-600"
                >
                    <span>{formatPercentage(percentage)}%</span>
                    <span class="font-medium">{letterGrade}</span>
                </div>
            </button>
        {/each}
    </div>

    <!-- Add Course Button -->
    <div class="mt-4">
        <button
            class="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm font-medium"
            onclick={() => gradeStore.addCourse()}
        >
            + Add Course
        </button>
    </div>
</div>
