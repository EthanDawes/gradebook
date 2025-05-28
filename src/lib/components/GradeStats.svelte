<script lang="ts">
    interface Props {
        classItem: any;
    }

    let { classItem }: Props = $props();
</script>

<div class="mt-6 bg-gray-50 rounded-lg p-4">
    <h3 class="font-semibold mb-3">Stats</h3>
    <div class="text-sm text-gray-600 mb-2">Grade over time</div>

    <!-- Simple Grade Chart Placeholder -->
    <div class="h-32 bg-white border border-gray-200 rounded flex items-center justify-center">
        <div class="text-gray-400 text-sm">Grade trend chart would go here</div>
    </div>
</div>
