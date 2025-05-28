<script lang="ts">
    import type { Class } from '$lib/types.js';

    interface Props {
        classItem: Class;
    }

    let { classItem }: Props = $props();
    let curveToB = $state(false);
</script>

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