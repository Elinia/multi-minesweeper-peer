<script lang="ts">
  import { flip } from 'svelte/animate'
  import Progress from './Progress.svelte'
  export let players: {
    score: number
    scoreChange: number
    id: string
    xy: number
    k: number
    name: string
    color: string
  }[]
  $: scores = players.map((i) => i.score)
  $: min = Math.min(...scores) - 5
  $: max = Math.max(...scores, 15) + 30
  $: diff = max - min
  let stones = new Array(41).fill(0).map((v, i) => 10 * i - 200)
</script>

<div class="scores relative overflow-x-hidden pt-5">
  {#each stones as stone}
    <div
      class="stone"
      style={`--stone: '${stone}'; left: ${((stone - min) / diff) * 100}%;`}
    />
  {/each}
  {#each players.sort((a, b) => b.score - a.score) as player, i (player.id)}
    <div animate:flip class="mt-1">
      <Progress
        progress={(player.score - min) / diff}
        text={`${player.name}: ${player.score} (${
          player.scoreChange > 0 ? '+' : ''
        }${player.scoreChange})`}
        class={player.color}
      />
    </div>
  {/each}
</div>

<style>
  .stone {
    @apply absolute top-0 h-full w-1px bg-gray-200;
    transition: left 500ms;
  }
  .stone::after {
    @apply absolute text-xs;
    content: var(--stone);
    transform: translateX(-50%);
  }
</style>
