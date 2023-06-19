<script lang="ts">
  import { cubicOut } from 'svelte/easing'
  import { tweened } from 'svelte/motion'
  export let progress: number
  export let text: string
  $: myProgress = tweened(0, { duration: 500, easing: cubicOut })
  $: $myProgress = progress
</script>

<div class="relative overflow-hidden">
  <div
    class={`h-5 origin-left ${$$props.class}`}
    style={`transform: scaleX(${$myProgress});`}
  />
  <div
    class="absolute ml-1 w-full top-0"
    style={`transform: translateX(${$myProgress * 100}%);`}
  >
    {text}
  </div>
</div>

<style>
</style>
