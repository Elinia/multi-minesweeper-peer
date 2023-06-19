<script lang="ts">
  import { goto } from '$app/navigation'
  import { confetti } from '@neoconfetti/svelte'
  import ScoreBoard from './ScoreBoard.svelte'
  import Chat from '../Chat.svelte'
  import { getContext, onMount } from 'svelte'
  import type Client from '$lib/client'

  const { getGame } = getContext<{ getGame: () => Client }>('game')
  const { board, config, tmpAction, action, gameOnGoing } = getGame()

  let currentTimer = -1
  let interval: ReturnType<typeof setInterval> | null = null

  board.subscribe(() => {
    currentTimer = $config.roundTime
    if (interval) clearInterval(interval)
    setTimeout(() => (interval = setInterval(() => currentTimer--, 1000)), 500)
  })
  function clickCell(index: number) {
    const lastAction = $tmpAction
    if (index !== lastAction.xy) action({ xy: index, k: 1 })
    else action({ xy: index, k: -lastAction.k })
  }
  function renderCell(cell: number) {
    if (cell === -2 || cell === 0) return ''
    if (cell === -1) return '💣'
    return cell
  }

  onMount(() => {
    if (!$gameOnGoing) {
      goto('.')
    }
  })
</script>

<div>
  {#if !$gameOnGoing}
    <button on:click={() => goto('.')}>Back</button>
  {/if}
  {#if $board}
    {@const players = $board.players}
    <ScoreBoard {players} />
    <div class="board relative">
      {#if !$gameOnGoing}
        <div class="absolute top-1/2 left-1/2" use:confetti />
      {/if}
      {#each $board.board as cell, index}
        <div
          class="cell select-none"
          class:occupied={cell >= -1}
          class:!bg-green-500={$tmpAction.xy === index && $tmpAction.k === 1}
          class:!bg-red-500={$tmpAction.xy === index && $tmpAction.k === -1}
          on:click={() => cell === -2 && clickCell(index)}
          on:keypress={() => undefined}
        >
          <span
            class="text-2xl text-white"
            class:hidden={cell === -2 || cell === 0}>{renderCell(cell)}</span
          >
          <span class="absolute w-full h-full grid grid-cols-4 gap-0">
            {#each players as player}
              {#if player.xy === index}
                <span class={`action-log ${player.color}`}
                  >{player.scoreChange > 0 ? '+' : '-'}</span
                >
              {/if}
            {/each}
          </span>
        </div>
      {/each}
    </div>
    {#if currentTimer >= 0}
      <div class="text-3xl" class:text-red-500={currentTimer < 5}>
        Timer: {currentTimer}
      </div>
    {/if}
    <div class="text-3xl">Remain mine count: {$board.remainMine}</div>
    <div class="gameover" class:hidden={$gameOnGoing}>Game over!</div>
  {/if}
  <Chat />
</div>

<style>
  .board {
    @apply my-2 grid place-content-center gap-1;
    grid: repeat(8, 48px) / repeat(8, 48px);
  }
  .cell {
    @apply grid place-content-center relative bg-[#87CEEB];
  }
  .occupied {
    @apply bg-[#6A5ACD];
  }
  .action-log {
    @apply text-xs text-white w-4 h-4 flex items-center justify-center;
  }
  .gameover {
    font-weight: 700;
    font-size: 64px;
  }
</style>
