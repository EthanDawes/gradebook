<script lang="ts">
    import { gradeStore } from "../stores.svelte";

    let { title, score }: { title: string; score: string } = $props();

    const [earned, possible] = score.split("/").map(Number.parseFloat);
</script>

<button>hi~</button>
