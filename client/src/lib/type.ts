import {
  number,
  boolean,
  union,
  object,
  literal,
  array,
  string,
  enums,
  optional,
  assign,
  type Describe,
  type Infer,
} from 'superstruct'
import { ERROR_CODE } from './const'
import type { Action, PlayerInfo, BoardUpdate } from './game'

const Action: Describe<Action> = object({
  xy: number(),
  k: number(),
})

const PlayerInfo: Describe<PlayerInfo> = object({
  id: string(),
  name: string(),
  isAI: boolean(),
  xy: number(),
  k: number(),
  score: number(),
  scoreChange: number(),
  combo: number(),
  negcombo: number(),
})

export { Action, PlayerInfo }

export const ErrorCode = enums(Object.values(ERROR_CODE))
export type ErrorCode = Infer<typeof ErrorCode>

export const PlayerInfoWithColor = assign(
  PlayerInfo,
  object({ color: string() })
)
export type PlayerInfoWithColor = Infer<typeof PlayerInfoWithColor>

export type BoardUpdateWithColor = BoardUpdate & {
  players: PlayerInfoWithColor[]
}
export const BoardUpdateWithColor: Describe<BoardUpdateWithColor> = object({
  board: array(number()),
  players: array(PlayerInfoWithColor),
  remainMine: number(),
  finish: optional(boolean()),
})

export const Config = object({
  aiNum: number(),
  roundTime: number(),
})
export type Config = Infer<typeof Config>

export const UserList = array(
  object({
    id: string(),
    name: string(),
    ready: boolean(),
    color: string(),
  })
)
export type UserList = Infer<typeof UserList>

export const Req = union([
  object({
    type: literal('config'),
    data: Config,
  }),
  object({
    type: literal('ready'),
  }),
  object({
    type: literal('action'),
    data: object({
      xy: number(),
      k: number(),
    }),
  }),
  object({
    type: literal('chat'),
    data: string(),
  }),
])
export type Req = Infer<typeof Req>

export const Resp = union([
  object({
    type: literal('userList'),
    data: UserList,
  }),
  object({
    type: literal('boardUpdate'),
    data: BoardUpdateWithColor,
  }),
  object({
    type: literal('chat'),
    data: string(),
  }),
  object({
    type: literal('config'),
    data: Config,
  }),
  object({
    type: literal('gameStart'),
  }),
  object({
    type: literal('gameOver'),
    data: object({ winner: string() }),
  }),
  object({
    type: literal('error'),
    data: ErrorCode,
  }),
])
export type Resp = Infer<typeof Resp>
