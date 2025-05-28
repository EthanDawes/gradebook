<script lang="ts">
    import { gradeStore } from '$lib/stores.svelte.js';
    import type { Course } from '$lib/types.js';

    function formatPercentage(num: number): string {
        return Math.round(num).toString();
    }
    debugger
</script>

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

    <!-- Courses List -->
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
