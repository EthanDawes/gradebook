<script lang="ts">
    import { gradeStore } from "~/assets/stores.svelte.js";
    import type { Course } from "~/assets/types.js";

    interface Props {
        courseItem: Course;
    }

    let { courseItem }: Props = $props();

    function formatPercentage(num: number): string {
        return (Math.round(num * 100) / 100).toString();
    }

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

    function updateReleased(categoryIndex: number, gradeIndex: number): void {
        gradeStore.updateGrade(
            categoryIndex,
            gradeIndex,
            "released",
            new Date().getTime(),
        );
    }
</script>

<div
    class="bg-white rounded-lg border border-gray-200 p-4 {gradeStore.whatIfMode
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
    <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
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
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <td class="py-2 px-2">
                            <div class="flex items-center gap-2">
                                <input
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
                                        gradeStore.addGrade(categoryIndex)}
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
                            </div>
                        </td>
                        <td class="py-2 px-2"></td>
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
                                    class="grade-input w-12 text-center text-xs"
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={category.weight * 100}
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
                                        class="grade-input"
                                        value={grade.title}
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
                                        class="grade-input w-16 text-center"
                                        type="number"
                                        value={grade.pointsEarned}
                                        oninput={(e) => {
                                            updateReleased(
                                                categoryIndex,
                                                gradeIndex,
                                            );
                                            gradeStore.updateGrade(
                                                categoryIndex,
                                                gradeIndex,
                                                "pointsEarned",
                                                parseFloat(
                                                    (
                                                        e.target as HTMLInputElement
                                                    ).value,
                                                ) || 0,
                                            );
                                        }}
                                    />
                                    <span>/</span>
                                    <input
                                        class="grade-input w-16 text-center"
                                        type="number"
                                        value={grade.pointsPossible}
                                        oninput={(e) => {
                                            updateReleased(
                                                categoryIndex,
                                                gradeIndex,
                                            );
                                            gradeStore.updateGrade(
                                                categoryIndex,
                                                gradeIndex,
                                                "pointsPossible",
                                                parseFloat(
                                                    (
                                                        e.target as HTMLInputElement
                                                    ).value,
                                                ) || 0,
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
                                                class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 rounded p-1"
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
                                {#if category.weight > 0 && grade.pointsPossible && grade.pointsPossible > 0 && grade.pointsEarned !== undefined}
                                    {@const validGradesCount =
                                        category.grades.filter(
                                            (g) =>
                                                g.pointsPossible &&
                                                g.pointsPossible > 0,
                                        ).length}
                                    {@const itemWeight =
                                        validGradesCount > 0
                                            ? category.weight / validGradesCount
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
                                {:else}
                                    - / -
                                {/if}
                            </td>
                            <td class="py-2 px-2 text-center">
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
            onclick={() => gradeStore.addCategory("New Category")}
        >
            + Add Category
        </button>
    </div>
</div>
