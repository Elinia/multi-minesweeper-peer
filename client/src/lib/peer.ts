import { PUBLIC_PEER_HOST, PUBLIC_PEER_PORT } from '$env/static/public'
import { Peer } from 'peerjs'

const DEFAULT_PEER_OPTIONS = {
  host: PUBLIC_PEER_HOST,
  port: Number(PUBLIC_PEER_PORT),
}

export const createPlayerPeer = (name: string) =>
  new Peer(`player_${name}`, DEFAULT_PEER_OPTIONS)

export const getRoomIdList = async (playerPeer: Peer) => {
  return new Promise<string[]>((resolve) =>
    playerPeer.listAllPeers((peers: string[]) =>
      resolve(peers.filter((peer) => peer.startsWith('room_')))
    )
  )
}

export const roomExists = async (playerPeer: Peer, name: string) => {
  if (!playerPeer.id.startsWith('player_')) {
    throw new Error('[roomExists]: invalid for guests')
  }
  const roomId = `room_${name}`
  const roomIdList = await getRoomIdList(playerPeer)
  return roomIdList.includes(roomId)
}

export const createRoomPeer = async (name: string) => {
  return new Peer(`room_${name}`, DEFAULT_PEER_OPTIONS)
}

export const createRoomConnection = (playerPeer: Peer, name: string) => {
  const roomId = `room_${name}`
  return playerPeer.connect(roomId)
}
