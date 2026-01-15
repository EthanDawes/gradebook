<script lang="ts">
    import { gradeStore } from "~/assets/stores.svelte.js";
    import type { Course } from "~/assets/types.js";
    import { formatPercentage2 as formatPercentage } from "~/assets";
    import { tick } from "svelte";

    interface Props {
        courseItem: Course;
    }

    let { courseItem }: Props = $props();

    // References to input elements for auto-selection
    let categoryInputs: HTMLInputElement[] = [];
    let gradeInputRefs: { [key: string]: HTMLInputElement } = {};

    function handleClassAverageEdit(
        categoryIndex: number,
        gradeIndex: number,
        currentAverage: number | undefined,
    ) {
        const currentValue =
            currentAverage !== undefined
                ? formatPercentage(currentAverage)
                : "";
        const newAverage = prompt(
            "Enter class average percentage (0-100):",
            currentValue,
        );
        if (newAverage !== null && newAverage !== "") {
            const avg = parseFloat(newAverage);
            if (!isNaN(avg) && avg >= 0 && avg <= 100) {
                gradeStore.updateGrade(
                    categoryIndex,
                    gradeIndex,
                    "classAverage",
                    avg,
                );
            }
        } else if (newAverage === "") {
            gradeStore.updateGrade(
                categoryIndex,
                gradeIndex,
                "classAverage",
                undefined,
            );
        }
    }

    function handleClassAverageSet(categoryIndex: number, gradeIndex: number) {
        const average = prompt("Enter class average percentage (0-100):");
        if (average !== null && average !== "") {
            const avg = parseFloat(average);
            if (!isNaN(avg) && avg >= 0 && avg <= 100) {
                gradeStore.updateGrade(
                    categoryIndex,
                    gradeIndex,
                    "classAverage",
                    avg,
                );
            } else {
                alert("Please enter a valid percentage between 0 and 100.");
            }
        }
    }

    function calculateCurvedGrade(
        originalGrade: number,
        classAverage: number,
    ): number {
        if (!courseItem.curve || classAverage === undefined) {
            return originalGrade;
        }

        const curveCutoff = courseItem.gradeCutoffs[courseItem.curve];
        if (curveCutoff === undefined) {
            return originalGrade;
        }

        const curveAdjustment = curveCutoff - classAverage;
        return originalGrade + curveAdjustment;
    }

    function shouldShowCurve(grade: any): boolean {
        return !!(
            courseItem.curve &&
            courseItem.curve !== "" &&
            grade.classAverage !== undefined
        );
    }

    function updateReleased(categoryIndex: number, gradeIndex: number) {
        gradeStore.updateGrade(
            categoryIndex,
            gradeIndex,
            "released",
            Date.now(),
        );
    }

    function isGradeInputDisabled(
        categoryIndex: number,
        gradeIndex: number,
    ): boolean {
        return gradeStore.isGradeInputDisabled(
            courseItem.name,
            categoryIndex,
            gradeIndex,
        );
    }

    // Auto-select functions
    async function addCategoryAndSelect(name: string) {
        const initialCategoryCount = courseItem.categories.length;
        gradeStore.addCategory(name);

        await tick(); // Wait for DOM to update

        // Focus and select the newly added category input
        const newCategoryIndex = courseItem.categories.length - 1;
        if (categoryInputs[newCategoryIndex]) {
            categoryInputs[newCategoryIndex].focus();
            categoryInputs[newCategoryIndex].select();
        }
    }

    async function addGradeAndSelect(categoryIndex: number) {
        gradeStore.addGrade(categoryIndex);

        await tick(); // Wait for DOM to update

        // Focus and select the newly added grade input
        const newGradeIndex =
            courseItem.categories[categoryIndex].grades.length - 1;
        const gradeKey = `${categoryIndex}-${newGradeIndex}`;
        if (gradeInputRefs[gradeKey]) {
            gradeInputRefs[gradeKey].focus();
        }
    }

    function parseInput(target: HTMLInputElement) {
        return target.value.length === 0
            ? undefined
            : parseFloat(target.value) || 0;
    }
</script>

<div
    class="bg-white rounded-lg border border-gray-200 p-4 min-w-fit {gradeStore.whatIfMode
        ? 'ring-2 ring-orange-300 bg-orange-50'
        : ''}"
>
    <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-lg flex items-center gap-2">
            Grades
            {#if gradeStore.whatIfMode}
                <span
                    class="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-medium"
                >
                    What If Mode Active
                </span>
            {/if}
        </h2>
        <label
            class="flex items-center text-sm cursor-pointer {gradeStore.whatIfMode
                ? 'text-orange-700 font-medium'
                : ''}"
        >
            <input
                type="checkbox"
                checked={gradeStore.whatIfMode}
                onchange={() => gradeStore.toggleWhatIfMode()}
                class="mr-2 accent-orange-500"
            />
            "What If" mode
        </label>
    </div>

    <!-- Single unified table -->
    <div>
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b-2 border-gray-300">
                    <th class="text-left py-3 px-2 text-gray-700 font-medium"
                        >Grade Item</th
                    >
                    <th class="text-center py-3 px-2 text-gray-700 font-medium"
                        >Points</th
                    >
                    <th class="text-center py-3 px-2 text-gray-700 font-medium"
                        >Weight Achieved</th
                    >
                    <th class="text-center py-3 px-2 text-gray-700 font-medium"
                        >Category Grade</th
                    >
                </tr>
            </thead>
            <tbody>
                {#each courseItem.categories as category, categoryIndex}
                    <!-- Category header row -->
                    <tr
                        class={`bg-gray-50 border-b border-gray-200 sticky ${gradeStore.whatIfMode ? "top-20" : "-top-6"} z-50 group`}
                    >
                        <td class="py-2 px-2">
                            <div class="flex items-center gap-2">
                                <input
                                    bind:this={categoryInputs[categoryIndex]}
                                    class="font-medium text-base border-none outline-none bg-transparent"
                                    value={category.name}
                                    oninput={(e) =>
                                        gradeStore.updateCategory(
                                            categoryIndex,
                                            "name",
                                            (e.target as HTMLInputElement)
                                                .value,
                                        )}
                                />
                                <button
                                    class="text-blue-600 hover:text-blue-800 text-lg font-bold"
                                    onclick={() =>
                                        addGradeAndSelect(categoryIndex)}
                                    title="Add grade to this category"
                                >
                                    +
                                </button>
                                <button
                                    class="text-red-600 hover:text-red-800 text-lg font-bold"
                                    onclick={() =>
                                        gradeStore.removeCategory(
                                            categoryIndex,
                                        )}
                                    title="Remove this category"
                                >
                                    ×
                                </button>
                                <!-- category drops button/indicator -->
                                <div
                                    class="ml-2 w-5 h-5 flex items-center justify-center"
                                >
                                    {#if category.drops}
                                        <!-- Show category drops if set -->
                                        <button
                                            class="text-xs text-gray-600 bg-gray-100 px-1 rounded cursor-pointer border-none"
                                            title="Category drops: {category.drops} - Click to edit"
                                            onclick={() =>
                                                gradeStore.updateDrops(
                                                    categoryIndex,
                                                )}
                                        >
                                            🆓&nbsp;{category.drops}
                                        </button>
                                    {:else}
                                        <!-- Set drops button (hidden by default, shown on hover) -->
                                        <button
                                            class="opacity-0 group-hover:opacity-100 hover:bg-gray-100 focus:opacity-100 focus:bg-gray-100 transition-opacity duration-200 rounded p-1"
                                            onclick={() =>
                                                gradeStore.updateDrops(
                                                    categoryIndex,
                                                )}
                                            title="Set category assignment drops"
                                        >
                                            🆓&nbsp;0
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </td>
                        <td class="py-2 px-2 text-center">
                            Total: {gradeStore.calculateRawPoints(category)}
                            /
                            {gradeStore.calculateRawPointsPossible(category)}
                        </td>
                        <td class="py-2 px-2 text-center">
                            <div
                                class="flex items-center justify-center gap-1 text-sm"
                            >
                                {#if category.grades.some( (g) => shouldShowCurve(g), )}
                                    {@const uncurvedSum =
                                        gradeStore.calculateCategorySum(
                                            category,
                                        )}
                                    {@const validGrades =
                                        category.grades.filter(
                                            (g) =>
                                                g.pointsPossible &&
                                                g.pointsPossible > 0 &&
                                                g.pointsEarned !== undefined,
                                        )}
                                    {@const weightPerAssignment =
                                        validGrades.length > 0
                                            ? category.weight /
                                              validGrades.length
                                            : 0}
                                    {@const curvedSum =
                                        validGrades.reduce((sum, grade) => {
                                            const gradePercent =
                                                (grade.pointsEarned! /
                                                    grade.pointsPossible!) *
                                                100;
                                            const curvedPercent =
                                                shouldShowCurve(grade)
                                                    ? calculateCurvedGrade(
                                                          gradePercent,
                                                          grade.classAverage!,
                                                      )
                                                    : gradePercent;
                                            return (
                                                sum +
                                                (curvedPercent / 100) *
                                                    weightPerAssignment
                                            );
                                        }, 0) * 100}
                                    {formatPercentage(uncurvedSum)} → {formatPercentage(
                                        curvedSum,
                                    )}
                                {:else}
                                    {formatPercentage(
                                        gradeStore.calculateCategorySum(
                                            category,
                                        ),
                                    )}
                                {/if}
                                /
                                <input
                                    class="grade-input w-14 text-center text-xs"
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={Math.trunc(category.weight * 100)}
                                    oninput={(e) =>
                                        gradeStore.updateCategory(
                                            categoryIndex,
                                            "weight",
                                            (parseFloat(
                                                (e.target as HTMLInputElement)
                                                    .value,
                                            ) || 0) / 100,
                                        )}
                                />
                                <span class="text-xs">%</span>
                            </div>
                        </td>
                        <td class="py-2 px-2 text-center text-sm">
                            {#if category.grades.some( (g) => shouldShowCurve(g), )}
                                {@const uncurvedAverage =
                                    gradeStore.calculateCategoryAverage(
                                        category,
                                    )}
                                {@const validGrades = category.grades.filter(
                                    (g) =>
                                        g.pointsPossible &&
                                        g.pointsPossible > 0 &&
                                        g.pointsEarned !== undefined,
                                )}
                                {@const curvedTotal = validGrades.reduce(
                                    (sum, grade) => {
                                        const gradePercent =
                                            (grade.pointsEarned! /
                                                grade.pointsPossible!) *
                                            100;
                                        const curvedPercent = shouldShowCurve(
                                            grade,
                                        )
                                            ? calculateCurvedGrade(
                                                  gradePercent,
                                                  grade.classAverage!,
                                              )
                                            : gradePercent;
                                        return sum + curvedPercent / 100;
                                    },
                                    0,
                                )}
                                {@const curvedAverage =
                                    validGrades.length > 0
                                        ? (curvedTotal / validGrades.length) *
                                          100
                                        : 0}
                                {formatPercentage(uncurvedAverage)} → {formatPercentage(
                                    curvedAverage,
                                )} %
                            {:else}
                                {formatPercentage(
                                    gradeStore.calculateCategoryAverage(
                                        category,
                                    ),
                                )} %
                            {/if}
                        </td>
                    </tr>

                    <!-- Grade rows for this category -->
                    {#each category.grades as grade, gradeIndex}
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                            <td class="py-2 px-2 pl-6">
                                <div class="flex items-center gap-2">
                                    <input
                                        bind:this={
                                            gradeInputRefs[
                                                `${categoryIndex}-${gradeIndex}`
                                            ]
                                        }
                                        class="grade-input"
                                        value={grade.title}
                                        placeholder={String(gradeIndex + 1)}
                                        oninput={(e) =>
                                            gradeStore.updateGrade(
                                                categoryIndex,
                                                gradeIndex,
                                                "title",
                                                (e.target as HTMLInputElement)
                                                    .value,
                                            )}
                                    />
                                    <button
                                        class="text-red-600 hover:text-red-800"
                                        onclick={() =>
                                            gradeStore.removeGrade(
                                                categoryIndex,
                                                gradeIndex,
                                            )}
                                        title="Remove grade"
                                    >
                                        ×
                                    </button>
                                </div>
                            </td>
                            <td class="py-2 px-2 text-center">
                                <div
                                    class="flex items-center justify-center gap-1 group relative"
                                >
                                    <input
                                        class="grade-input w-16 text-center {isGradeInputDisabled(
                                            categoryIndex,
                                            gradeIndex,
                                        )
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : ''}"
                                        type="number"
                                        value={grade.pointsEarned}
                                        disabled={isGradeInputDisabled(
                                            categoryIndex,
                                            gradeIndex,
                                        )}
                                        oninput={(e) => {
                                            updateReleased(
                                                categoryIndex,
                                                gradeIndex,
                                            );
                                            gradeStore.updateGrade(
                                                categoryIndex,
                                                gradeIndex,
                                                "pointsEarned",
                                                parseInput(e.target),
                                            );
                                        }}
                                    />
                                    <span>/</span>
                                    <input
                                        class="grade-input w-16 text-center {isGradeInputDisabled(
                                            categoryIndex,
                                            gradeIndex,
                                        )
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : ''}"
                                        type="number"
                                        value={grade.pointsPossible}
                                        disabled={isGradeInputDisabled(
                                            categoryIndex,
                                            gradeIndex,
                                        )}
                                        oninput={(e) => {
                                            updateReleased(
                                                categoryIndex,
                                                gradeIndex,
                                            );
                                            gradeStore.updateGrade(
                                                categoryIndex,
                                                gradeIndex,
                                                "pointsPossible",
                                                parseInput(e.target),
                                            );
                                        }}
                                    />

                                    <!-- Bell curve button/indicator -->
                                    <div
                                        class="ml-2 w-5 h-5 flex items-center justify-center"
                                    >
                                        {#if grade.classAverage !== undefined}
                                            <!-- Show class average if set -->
                                            <button
                                                class="text-xs text-gray-600 bg-gray-100 px-1 rounded cursor-pointer border-none"
                                                title="Class Average: {formatPercentage(
                                                    grade.classAverage,
                                                )}% - Click to edit"
                                                onclick={() =>
                                                    handleClassAverageEdit(
                                                        categoryIndex,
                                                        gradeIndex,
                                                        grade.classAverage,
                                                    )}
                                            >
                                                {formatPercentage(
                                                    grade.classAverage,
                                                )}%
                                            </button>
                                        {:else}
                                            <!-- Bell curve button (hidden by default, shown on hover) -->
                                            <button
                                                class="opacity-0 group-hover:opacity-100 hover:bg-gray-100 focus:opacity-100 focus:bg-gray-100 transition-opacity duration-200 rounded p-1"
                                                onclick={() =>
                                                    handleClassAverageSet(
                                                        categoryIndex,
                                                        gradeIndex,
                                                    )}
                                                title="Set class average"
                                            >
                                                <img
                                                    src="/bell-curve-icon.png"
                                                    alt="Bell curve"
                                                    class="w-4 h-4"
                                                />
                                            </button>
                                        {/if}
                                    </div>
                                </div>
                            </td>
                            <td class="py-2 px-2 text-center">
                                <!-- Weight achieved column -->
                                {#if category.weight > 0 && grade.pointsPossible && grade.pointsPossible > 0 && grade.pointsEarned !== undefined}
                                    {@const validGradesCount =
                                        category.grades.filter(
                                            (g) =>
                                                g.pointsPossible &&
                                                g.pointsPossible > 0,
                                        ).length}
                                    {@const itemWeight =
                                        validGradesCount > 0
                                            ? (grade.pointsPossible /
                                                  gradeStore.calculateRawPointsPossibleEver(
                                                      category,
                                                  )) *
                                              category.weight
                                            : 0}
                                    {@const uncurvedWeight =
                                        (grade.pointsEarned /
                                            grade.pointsPossible) *
                                        itemWeight *
                                        100}
                                    {#if shouldShowCurve(grade)}
                                        {@const userGradePercent =
                                            (grade.pointsEarned /
                                                grade.pointsPossible) *
                                            100}
                                        {@const curvedGradePercent =
                                            calculateCurvedGrade(
                                                userGradePercent,
                                                grade.classAverage!,
                                            )}
                                        {@const curvedWeight =
                                            (curvedGradePercent / 100) *
                                            itemWeight *
                                            100}
                                        {formatPercentage(uncurvedWeight)} → {formatPercentage(
                                            curvedWeight,
                                        )} / {formatPercentage(
                                            itemWeight * 100,
                                        )}
                                    {:else}
                                        {formatPercentage(uncurvedWeight)} / {formatPercentage(
                                            itemWeight * 100,
                                        )}
                                    {/if}
                                {:else if category.weight > 0 && !!grade.pointsEarned}
                                    <!-- Extra credit -->
                                    {formatPercentage(
                                        (grade.pointsEarned /
                                            gradeStore.calculateRawPointsPossible(
                                                category,
                                            )) *
                                            category.weight *
                                            100,
                                    )} / -
                                {:else}
                                    - / -
                                {/if}
                            </td>
                            <td class="py-2 px-2 text-center">
                                <!-- Percent column -->
                                {#if grade.pointsPossible && grade.pointsPossible > 0 && grade.pointsEarned !== undefined}
                                    {@const uncurvedPercent =
                                        (grade.pointsEarned /
                                            grade.pointsPossible) *
                                        100}
                                    {#if shouldShowCurve(grade)}
                                        {@const curvedPercent =
                                            calculateCurvedGrade(
                                                uncurvedPercent,
                                                grade.classAverage!,
                                            )}
                                        {formatPercentage(uncurvedPercent)}% → {formatPercentage(
                                            curvedPercent,
                                        )}%
                                    {:else}
                                        {formatPercentage(uncurvedPercent)}%
                                    {/if}
                                {:else}
                                    -%
                                {/if}
                            </td>
                        </tr>
                    {/each}
                {/each}
            </tbody>
        </table>
    </div>

    <!-- Add Category Button -->
    <div class="mt-4">
        <button
            class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            onclick={() => addCategoryAndSelect("New Category")}
        >
            + Add Category
        </button>
    </div>
</div>
