import { Req, Resp } from '$lib/type'
import type { DataConnection } from 'peerjs'
import type Peer from 'peerjs'
import { assert } from 'superstruct'
import { ERROR_CODE } from './const'
import Game, { type BoardUpdate } from './game'

function getName(peerId: string) {
  return peerId.split('_')[1]
}

interface User {
  conn: DataConnection
  ready: boolean
}
function getUserName(user: User) {
  return getName(user.conn.peer)
}

export default class Room {
  private chatHistory = ''
  private config = {
    aiNum: 0,
    roundTime: 10,
  }
  private users: { conn: DataConnection; ready: boolean }[] = []
  private game = new Game(
    (boardUpdate) => this.boardUpdate(boardUpdate),
    ({ id, name, score }) => {
      this.broadcast({ type: 'gameOver', data: { winner: id } })
      this.chat(`游戏结束了，胜利者${name}得分高达${score}`, '【折线图】')
    },
    (msg) => this.chat(msg)
  )

  private get allReady() {
    return this.users.length > 0 && this.users.every((p) => p.ready)
  }

  private startGame() {
    this.updateUsers(this.users.map((u) => ({ ...u, ready: false })))
    if (this.users.length + this.config.aiNum > 8) {
      this.chat('人数过多(仅支持1~8人)，游戏开始失败')
      return
    }
    this.broadcast({ type: 'gameStart' })
    this.game.start({
      ...this.config,
      players: this.users.map((u) => ({
        id: u.conn.peer,
        name: getUserName(u),
      })),
    })
    this.chat('游戏开始了')
  }

  private boardUpdate(boardUpdate: BoardUpdate) {
    const boardUpdateWithColor = {
      ...boardUpdate,
      players: boardUpdate.players.map((p, i) => ({
        ...p,
        color: 'abcdefgh'[i],
      })),
    }
    this.broadcast({ type: 'boardUpdate', data: boardUpdateWithColor })
  }

  private send(peerId: string, msg: Resp) {
    console.log(`[Room.send] to: ${peerId}`, msg)
    assert(msg, Resp)
    this.users.find((u) => u.conn.peer === peerId)?.conn.send(msg)
  }

  private broadcast(msg: Resp) {
    console.log('[Room.broadcast]', msg)
    assert(msg, Resp)
    this.users.forEach((u) => u.conn.send(msg))
  }

  private updateUsers(users: User[]) {
    this.users = users
    this.broadcast({
      type: 'userList',
      data: this.users.map((u, i) => ({
        id: u.conn.peer,
        name: getUserName(u),
        ready: u.ready,
        color: 'abcdefgh'[i],
      })),
    })
  }

  private chat(...msgs: string[]) {
    this.chatHistory += msgs.join('\n') + '\n'
    this.broadcast({ type: 'chat', data: this.chatHistory })
  }

  private handle(peerId: string, msg: Req) {
    console.log('[Room.handle]', msg)
    switch (msg.type) {
      case 'config':
        this.config = msg.data
        this.broadcast({ type: 'config', data: this.config })
        break
      case 'ready':
        this.updateUsers(
          this.users.map((u) => ({
            ...u,
            ready: u.conn.peer === peerId ? true : u.ready,
          }))
        )
        this.chat(`用户${getName(peerId)}准备了`)
        if (this.allReady) this.startGame()
        break
      case 'action':
        this.game.action(peerId, msg.data)
        break
      case 'chat':
        this.chat(`${getName(peerId)}: ${msg.data}`)
        break
      default:
        console.error('[Room.handle] unknown msg type')
    }
  }

  constructor(peer: Peer) {
    peer.on('open', (...a) => console.log(...a))
    peer.on('close', (...a) => console.log(...a))
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        // console.log('[Room] connections:', peer.connections)
        if (this.users.length + this.config.aiNum >= 8) {
          const msg: Resp = { type: 'error', data: ERROR_CODE.ROOM_IS_FULL }
          conn.send(msg)
          return
        }
        this.updateUsers([...this.users, { conn, ready: false }])
        this.chat(`用户${getName(conn.peer)}进房了`)
      })

      conn.on('data', (msg) => {
        assert(msg, Req)
        this.handle(conn.peer, msg)
      })

      conn.on('close', () => {
        if (this.users.map((u) => u.conn).includes(conn)) {
          this.updateUsers(this.users.filter((u) => u.conn !== conn))
          this.chat(`用户${getName(conn.peer)}离开了`)
        }
      })

      conn.on('iceStateChanged', (...a) => console.log(...a))
      conn.on('error', (...a) => console.error(...a))
    })
    peer.on('disconnected', (...a) => console.log(...a))
    peer.on('error', (...a) => console.error(...a))
    peer.on('call', (...a) => console.log(...a))
  }
}
