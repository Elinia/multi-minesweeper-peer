import {
  Config,
  UserList,
  ErrorCode,
  Req,
  Resp,
  type BoardUpdateWithColor,
  type Action,
} from '$lib/type'
import type { DataConnection } from 'peerjs'
import { assert } from 'superstruct'
import { writable } from 'svelte/store'
import { ERROR_CODE } from './const'

export default class Client {
  conn: DataConnection

  userList = writable<UserList>([])
  config = writable<Config>({ aiNum: 0, roundTime: 10 })
  chatHistory = writable('')
  gameOnGoing = writable(false)
  board = writable<BoardUpdateWithColor | null>(null)
  error = writable<ErrorCode | null>(null)

  tmpAction = writable<Action>({ xy: -1, k: -1 })

  private handle(msg: Resp) {
    console.log('[Client.handle]', msg)
    switch (msg.type) {
      case 'userList':
        this.userList.set(msg.data)
        break
      case 'config':
        this.config.set(msg.data)
        break
      case 'chat':
        this.chatHistory.set(msg.data)
        break
      case 'gameStart':
        this.gameOnGoing.set(true)
        break
      case 'gameOver':
        this.gameOnGoing.set(false)
        break
      case 'boardUpdate':
        this.tmpAction.set({ xy: -1, k: -1 })
        this.board.set(msg.data)
        break
      case 'error':
        switch (msg.data) {
          case ERROR_CODE.ROOM_IS_FULL:
            this.error.set(msg.data)
            break
          default:
            //@ts-expect-error: all error codes should be properly handled
            alert(`[Client.handle] unexpected error code: ${msg.data}`)
        }
        break
      default:
        console.error('[Client.handle] unknown msg type')
    }
  }

  private send(msg: Req) {
    assert(msg, Req)
    this.conn.send(msg)
  }

  setConfig = (config: Config) => {
    this.send({ type: 'config', data: config })
  }

  ready = () => {
    this.send({ type: 'ready' })
  }

  chat = (msg: string) => {
    this.send({ type: 'chat', data: msg })
  }

  action = (action: Action) => {
    this.tmpAction.set(action)
    this.send({ type: 'action', data: action })
  }

  constructor(conn: DataConnection) {
    this.conn = conn
    conn.on('open', () => console.log('open'))
    conn.on('data', (data) => {
      assert(data, Resp)
      this.handle(data)
    })

    conn.on('iceStateChanged', (...a) => console.log(...a))
    conn.on('close', (...a) => console.error(...a))
    conn.on('error', (...a) => console.error(...a))

    console.log('[Client] initialized')
  }
}
