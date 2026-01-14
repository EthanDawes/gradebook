<script lang="ts">
    import { gradeStore } from "../stores.svelte";

    let { title, score }: { title: string; score?: string } = $props();

    const [pointsEarned, pointsPossible] = score
        ?.split("/")
        .map(Number.parseFloat) ?? [undefined, undefined];
    let currentCategoryIdx = $derived(
        gradeStore.selectedCourse?.categories.findIndex((category) =>
            category.grades.find((grade) => grade.title === title),
        ) ?? -1,
    );
    let currentGradeIdx = $derived(
        gradeStore.selectedCourse?.categories[
            currentCategoryIdx
        ]?.grades.findIndex((grade) => grade.title === title) ?? -1,
    );

    // Yes, I only want to capture the initial value
    if (currentCategoryIdx !== -1 && currentGradeIdx !== -1) {
        gradeStore.updateGrade(
            currentCategoryIdx,
            currentGradeIdx,
            "pointsEarned",
            pointsEarned,
        );
        gradeStore.updateGrade(
            currentCategoryIdx,
            currentGradeIdx,
            "pointsPossible",
            pointsPossible,
        );
    }

    function handleChange(ev: Event) {
        const selectedValue = (ev.target as HTMLSelectElement).value;
        let newCategoryIndex = Number.parseInt(selectedValue);
        if (selectedValue == "_new") {
            gradeStore.addCategory(prompt("Category name:")!);
            newCategoryIndex = gradeStore.selectedCourse!.categories.length - 1;
        }

        if (currentGradeIdx !== -1 && currentCategoryIdx !== -1) {
            gradeStore.removeGrade(currentCategoryIdx, currentGradeIdx);
        }
        if (selectedValue === "_del") return;
        gradeStore.addGrade(newCategoryIndex, {
            title,
            pointsEarned,
            pointsPossible,
            source: location.href,
        });
    }
</script>

{#if gradeStore.selectedCourse}
    {#if currentGradeIdx === -1}
        <button class="fake-button" id="display">➕</button>
    {/if}
    <select
        class:hidden-select={currentGradeIdx === -1}
        onchange={handleChange}
    >
        <option disabled selected>Select a category</option>
        {#each gradeStore.selectedCourse.categories as category, index}
            <option value={index} selected={index === currentCategoryIdx}
                >{category.name}</option
            >
        {/each}
        <option value="_new">+ New Category</option>
        {#if currentGradeIdx !== -1}
            <option value="_del">- Remove</option>
        {/if}
    </select>
{/if}
