<script lang="ts">
  import { createPlayerPeer, getRoomIdList } from '$lib/peer'
  import { onMount, setContext } from 'svelte'
  import { writable, type Readable } from 'svelte/store'
  import type { LayoutData } from './$types'

  export let data: LayoutData

  let ready = false
  const playerPeer = createPlayerPeer(data.playerName)
  setContext('playerPeer', playerPeer)
  playerPeer.on('open', () => (ready = true))

  const { subscribe, set } = writable<string[]>([])
  async function updateRoomNameList() {
    getRoomIdList(playerPeer).then((list) =>
      set(list.map((roomId) => roomId.split('_')[1]))
    )
  }
  const roomNameList: Readable<string[]> = { subscribe }
  setContext('roomNameList', roomNameList)

  onMount(() => {
    updateRoomNameList()
    const timer = setInterval(updateRoomNameList, 5000)
    return () => clearInterval(timer)
  })
</script>

{#if ready}
  <slot />
{/if}
