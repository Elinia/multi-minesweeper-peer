import { randomUUID } from 'crypto'
import { PeerServer } from 'peer'

const gen = () => `guest_${randomUUID()}`

const peerServer = PeerServer({
  port: 9000,
  path: '/',
  allow_discovery: true,
  generateClientId: gen,
})