<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation'
  import Client from '$lib/client'
  import { createRoomConnection, createRoomPeer, roomExists } from '$lib/peer'
  import Room from '$lib/room'
  import type { DataConnection } from 'peerjs'
  import type Peer from 'peerjs'
  import { getContext, setContext, onMount, onDestroy } from 'svelte'
  import type { LayoutData } from './$types'

  export let data: LayoutData

  const playerPeer = getContext<Peer>('playerPeer')
  const roomName = data.roomName
  let game: Client | null = null
  setContext('game', {
    getGame: () => game,
  })

  let roomPeer: Peer | null = null
  let roomConn: DataConnection | null = null
  onMount(async () => {
    console.log('mount')
    const isRoomHost = !(await roomExists(playerPeer, roomName))

    if (isRoomHost) {
      roomPeer = await createRoomPeer(roomName)
      const room = new Room(roomPeer)
    }
    const roomConn = createRoomConnection(playerPeer, roomName)
    game = new Client(roomConn)
  })

  onDestroy(() => {
    console.log('destroy')
    roomConn?.close()
    roomPeer?.destroy()
  })
</script>

{#if game !== null}
  <slot />
{/if}
