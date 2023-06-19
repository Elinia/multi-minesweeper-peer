<script lang="ts">
  import type Client from '$lib/client'
  import { getContext } from 'svelte'

  const { getGame } = getContext<{ getGame: () => Client }>('game')
  const { chatHistory, chat } = getGame()

  let myChat = ''
  let chatBox: HTMLDivElement

  $: if ($chatHistory) {
    setTimeout(
      () => chatBox?.scroll({ top: chatBox.scrollHeight, behavior: 'smooth' }),
      300
    )
  }
</script>

<input
  bind:value={myChat}
  on:keypress={(e) => {
    if (e.key === 'Enter') chat(myChat)
  }}
/>
<button on:click={() => chat(myChat)}>发送</button>
<div class="chatbox" bind:this={chatBox}>
  {$chatHistory}
</div>

<style>
  .chatbox {
    @apply m-2 p-2 rounded-8px whitespace-pre-line h-120px overflow-auto;
    border: 1px solid gray;
  }
</style>
