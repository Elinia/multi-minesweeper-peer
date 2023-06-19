<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getContext } from 'svelte'
  import type { Readable } from 'svelte/store'

  const roomNameList = getContext<Readable<string[]>>('roomNameList')

  let selectedRoomName: string | null = null
  let inputRoomName: string = ''

  $: path = $page.url.pathname
</script>

<div class="flex flex-col gap-2">
  <select size={4} bind:value={selectedRoomName}>
    {#each $roomNameList as roomName}
      <option value={roomName}>{roomName}</option>
    {/each}
  </select>
  <button
    on:click={() => goto(`${path}/r/${selectedRoomName}`)}
    disabled={selectedRoomName === null}>Join room</button
  >
  <input bind:value={inputRoomName} />
  <button
    on:click={() => goto(`${path}/r/${inputRoomName}`)}
    disabled={inputRoomName.length <= 0}>Create room</button
  >
</div>

<style>
</style>
