<script lang="ts">
  const radius = 6;
  let circumference: number = radius;
  let dashoffset: number;

  function setProgress(percent: number) {
    circumference = radius * 2 * Math.PI;
    dashoffset = circumference - (percent / 100) * circumference;
  }

  export let value = 0;

  $: setProgress(value);
</script>

<svg class="progress-ring h-6 w-6">
  <circle
    class="progress-ring__circle"
    stroke="white"
    stroke-width="2"
    r={radius}
    cy="12"
    cx="12"
    style:stroke-dasharray="{circumference}
    {circumference}"
    style:stroke-dashoffset={dashoffset}
  />
</svg>

<style>
  .progress-ring__circle {
    transition: 0.35s stroke-dashoffset;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }
</style>
