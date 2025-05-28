<script lang="ts">
    import '../app.css';

    let { children } = $props();
</script>

<main class="h-screen bg-gray-50">
    {@render children()}
</main>
