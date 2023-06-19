<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import type Client from '$lib/client'
  import { ERROR_CODE } from '$lib/const'
  import { getContext } from 'svelte'
  import Chat from './Chat.svelte'

  const { getGame } = getContext<{ getGame: () => Client }>('game')
  const { gameOnGoing, config, userList, error, ready, setConfig } = getGame()

  $: path = $page.url.pathname
  $: {
    switch ($error) {
      case ERROR_CODE.ROOM_IS_FULL:
        alert('房间满了')
        goto(`${path}/../..`)
      default:
    }
  }
  $: if ($gameOnGoing) {
    goto(`${path}/g`)
  }

  let roundTime = $config.roundTime
  let aiNum = $config.aiNum
  $: console.log($userList, getGame())
</script>

<div>
  <button on:click={ready}>准备</button>
  <button on:click={() => goto(`${path}/../..`)}>退回大厅</button>
  <div>
    <span>回合时间(秒): {$config.roundTime}</span>
    <input type="number" bind:value={roundTime} />
  </div>
  <div>
    <span>黑恶势力数量: {$config.aiNum}</span>
    <input type="number" bind:value={aiNum} />
  </div>
  <div>
    <button on:click={() => setConfig({ roundTime, aiNum })}>修改配置</button>
  </div>
  <div class="grid grid-cols-4 gap-2">
    {#each $userList as { name, ready, color }}
      <span class={`text-white ${color}`}>{name}{ready ? ' (ready)' : ''}</span>
    {/each}
  </div>
  <Chat />
  <!-- <Common /> -->
</div>
