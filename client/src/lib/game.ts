export interface Action {
  xy: number
  k: number
}

export interface PlayerBaseInfo {
  id: string
  name: string
  isAI?: boolean
}

export interface PlayerInfo extends Action, Required<PlayerBaseInfo> {
  score: number
  scoreChange: number
  combo: number
  negcombo: number
}

export interface BoardUpdate {
  board: number[]
  players: PlayerInfo[]
  remainMine: number
  finish?: boolean
}

const AI: PlayerBaseInfo[] = [
  { id: 'ai_89757', name: 'Lazarus', isAI: true },
  { id: 'ai_89758', name: 'TokyoCronos', isAI: true },
  { id: 'ai_89759', name: 'SmartRibbit', isAI: true },
  { id: 'ai_89760', name: '可怕的泰迪98', isAI: true },
  { id: 'ai_89761', name: '😍', isAI: true },
  { id: 'ai_89762', name: 'Linux', isAI: true },
]

const N = 8
const M = 8
const MINE = 25
const DX = [1, 1, 1, 0, 0, -1, -1, -1]
const DY = [1, 0, -1, 1, -1, 1, 0, -1]

export default class Game {
  aiNum = 2
  roundTime = 10

  private board: number[] = []
  private mineMap: number[] = []

  private playersInfo: PlayerInfo[] = []

  private tmpActions: Record<string, Action> = {}

  get ais() {
    return AI.slice(0, this.aiNum)
  }

  private initGame = () => {
    this.board = []
    this.mineMap = []
    for (let i = 1; i <= N * M; i++) {
      let k = 0
      if (i <= MINE) {
        k = 1
      }
      this.board.push(-2)
      this.mineMap.push(k)
    }
    for (let i = 0; i < N * M - 1; i++) {
      const d = Math.floor(Math.random() * (N * M - i - 1))
      const tmp = this.mineMap[i]
      this.mineMap[i] = this.mineMap[i + d]
      this.mineMap[i + d] = tmp
    }
  }

  private initPlayer = ({
    id,
    name,
    isAI,
  }: {
    id: string
    name: string
    isAI?: boolean
  }): PlayerInfo => {
    return {
      id,
      name,
      isAI: isAI ?? false,
      score: 0,
      scoreChange: 0,
      xy: -1,
      k: 1,
      combo: 0,
      negcombo: 0,
    }
  }

  start = (config: {
    roundTime: number
    aiNum: number
    players: PlayerBaseInfo[]
  }) => {
    this.initGame()
    this.roundTime = config.roundTime
    this.aiNum = config.aiNum

    this.playersInfo = [...config.players, ...this.ais].map(this.initPlayer)
    this.boardUpdate({
      board: this.board,
      players: this.playersInfo,
      remainMine: MINE,
    })
    setTimeout(this.ai, 0)
    setTimeout(this.moves, config.roundTime * 1000)
  }

  private getInfo = (xx: number) => {
    const x = Math.floor(xx / M)
    const y = xx % M
    if (this.mineMap[x * M + y] == 1) {
      return -1
    }
    let ret = 0
    for (let i = 0; i < 8; i++) {
      const tx = x + DX[i]
      const ty = y + DY[i]
      if (0 <= tx && tx < N && 0 <= ty && ty < M) {
        ret += this.mineMap[tx * M + ty]
      }
    }
    return ret
  }

  action = (id: string, action: Action) => {
    this.tmpActions[id] = action
  }

  private moves = () => {
    console.log(this.tmpActions)
    this.playersInfo = this.playersInfo.map((info) => ({
      ...info,
      xy: this.tmpActions[info.id]?.xy ?? -1,
      k: this.tmpActions[info.id]?.k ?? -1,
    }))
    this.tmpActions = {}

    const counter_pos = new Array(64).fill(0)
    const counter_neg = new Array(64).fill(0)
    this.playersInfo.forEach(({ xy, k }) => {
      if (xy === -1) return
      if (k === 1) {
        // 1 guess no mine
        counter_pos[xy] += 1
      } else {
        counter_neg[xy] += 1
      }
      this.board[xy] = this.getInfo(xy)
      if (this.board[xy] === 0) {
        // open safe blocks
        const q: number[] = []
        let h = 0
        let t = 1
        q.push(xy)
        while (h < t) {
          const xx = q[h]
          h += 1
          const x = Math.floor(xx / M)
          const y = xx % M
          if (this.mineMap[x * M + y] == 1) {
            continue
          }
          for (let j = 0; j < 8; j++) {
            const tx = x + DX[j]
            const ty = y + DY[j]
            if (
              0 <= tx &&
              tx < N &&
              0 <= ty &&
              ty < M &&
              this.board[tx * M + ty] == -2
            ) {
              this.board[tx * M + ty] = this.getInfo(tx * M + ty)
              if (this.board[tx * M + ty] == 0) {
                q.push(tx * M + ty)
                t += 1
              }
            }
          }
        }
      }
    })

    this.playersInfo = this.playersInfo.map((info) => {
      const { xy, k, score, combo, negcombo } = info
      let scoreChange = 0
      if (xy === -1) {
        scoreChange = -6
      } else if (k === 1) {
        // 1 guess no mine
        if (this.mineMap[xy] === 1) {
          scoreChange = -6
        } else {
          scoreChange = Math.max(Math.floor(6 / counter_pos[xy]), 1)
        }
      } else {
        if (this.mineMap[xy] === 0) {
          scoreChange = -6
        } else {
          scoreChange = Math.max(Math.floor(6 / counter_neg[xy]), 1)
        }
      }
      return {
        ...info,
        scoreChange,
        score: Math.max(score + scoreChange, 0),
        combo: scoreChange > 0 ? combo + 1 : 0,
        negcombo: scoreChange <= 0 ? negcombo + 1 : 0,
      }
    })

    this.playersInfo.forEach(({ xy, k, name, combo, negcombo }) => {
      if (xy !== -1) {
        if (counter_pos[xy] > 1 || counter_neg[xy] > 1) {
          const acNames = this.playersInfo
            .filter((info) => info.xy === xy && info.k === k)
            .map((info) => info.name)
          this.chat(
            `${
              acNames.length > 2 ? '大型' : ''
            }撞车现场！参与者：${acNames.join(' ')}`
          )
          counter_pos[xy] = 0
          counter_neg[xy] = 0
        }
      }
      if (combo > 0 && combo % 5 === 0) {
        this.chat(`震惊！ ${name} 已经达到 ${combo} 连击了！`)
      }
      if (negcombo > 0 && negcombo % 3 === 0) {
        this.chat(`震惊！ ${name} 已经惨遭 ${negcombo} 连失误了！`)
      }
    })

    const hasEmpty = this.board.some((b) => b === -2)
    const remainMine = this.board.reduce(
      (acc, curr, i) => (curr === -2 && this.mineMap[i] === 1 ? acc + 1 : acc),
      0
    )
    this.boardUpdate({
      board: this.board,
      players: this.playersInfo,
      remainMine,
      finish: !hasEmpty,
    })
    if (hasEmpty) {
      setTimeout(this.moves, this.roundTime * 1000)
      setTimeout(this.ai, 0)
    } else {
      const winner = this.playersInfo.reduce(
        (acc, { id, name, score, isAI }) => {
          if (score > acc.score) {
            return {
              id,
              name: isAI ? `黑恶势力${name}` : name,
              score,
            }
          }
          return acc
        },
        { id: '', score: -1, name: 'defined' }
      )
      this.gameOverCallback(winner)
    }
  }

  boardUpdate: (msg: BoardUpdate) => void
  gameOverCallback: (winner: {
    id: string
    name: string
    score: number
  }) => void
  chat: (msg: string) => void

  constructor(
    boardUpdate: (msg: BoardUpdate) => void,
    gameOverCallback: (winner: {
      id: string
      name: string
      score: number
    }) => void,
    chat: (msg: string) => void
  ) {
    this.boardUpdate = boardUpdate
    this.gameOverCallback = gameOverCallback
    this.chat = chat
  }

  private ai = () => {
    // boardold  = "!!3..1.1"
    // boardold += ".4!.4.!2"
    // boardold += "..4....!"
    // boardold += "2..4..4."
    // boardold += ".!.!!..!"
    // boardold += ".4!.7!.2"
    // boardold += "2..!...2"
    // boardold += ".3..3.3."
    console.log(this.board)
    const mine_debug: number[] = new Array(64).fill(0)
    let ret = ''
    function gcd(a: number, b: number): number {
      if (b == 0) return a
      return gcd(b, a % b)
    }
    let all = -1
    const ans = new Array(64).fill(-1)
    let first_round = 1
    for (let i = 0; i < 64; i++) if (this.board[i] != -2) first_round = 0
    let can: Action[] = []
    if (first_round == 1) {
      for (let i = 0; i < 64; i++) {
        ans[i] = 25 / 64.0
        can.push({ xy: i, k: 1 })
      }
    } else {
      let spcell = -10
      for (let i = 0; i < 64; i++) {
        const tboard = this.board.concat()
        if (tboard[i] == -2) {
          const x = Math.floor(i / 8)
          const y = i % 8
          let flag = 0
          for (let k = 0; k < 8; k++) {
            if (
              0 <= x + DX[k] &&
              x + DX[k] < 8 &&
              0 <= y + DY[k] &&
              y + DY[k] < 8 &&
              tboard[i] > -1
            ) {
              flag = 1
              break
            }
          }
          if (flag && spcell > -1) {
            ret += spcell.toFixed(4) + ' \t'
            ans[i] = spcell
            continue
          }
          tboard[i] = -1
          const t1 = getsol(tboard, 25)
          tboard[i] = -3
          let t2 = 0
          if (all == -1) {
            t2 = getsol(tboard, 25)
            all = t1 + t2
          }
          t2 = all - t1
          let g = gcd(t1, t2)
          if (g == 0) g = 1
          // console.log(t1 + "?" + t2)
          ret += (t1 / (t2 + t1)).toFixed(4) + ' \t'
          ans[i] = t1 / (t2 + t1)
          tboard[i] = -2
          if (flag) spcell = t1 / (t2 + t1)
          //ret += t1 / g + "/" + t2 / g + " \t"
        } else {
          if (tboard[i] == -1) ret += '1.00 \t'
          else ret += '0.00 \t'
        }
        // ret += "0/0 \t"
        if (i % 8 == 7) ret += '\n'
      }
      const tboard = this.board.concat()
      let best = 0.49
      for (let i = 0; i < 64; i++) {
        if (tboard[i] == -2 && ans[i] > best) {
          best = ans[i]
          can = []
          can.push({ xy: i, k: -1 })
        } else if (tboard[i] == -2 && ans[i] > best - 0.000001) {
          can.push({ xy: i, k: -1 })
        }
        if (tboard[i] == -2 && 1 - ans[i] > best) {
          best = 1 - ans[i]
          can = []
          can.push({ xy: i, k: 1 })
        } else if (tboard[i] == -2 && 1 - ans[i] > best - 0.000001) {
          can.push({ xy: i, k: 1 })
        }
      }
      if (can.length < this.aiNum) {
        const pcan = can.concat()
        const pbest = best
        best = 0.49
        can = []
        for (let i = 0; i < 64; i++) {
          if (tboard[i] == -2 && ans[i] > best && ans[i] < pbest) {
            best = ans[i]
            can = []
            can.push({ xy: i, k: -1 })
          } else if (
            tboard[i] == -2 &&
            ans[i] > best - 0.000001 &&
            ans[i] < pbest
          ) {
            can.push({ xy: i, k: -1 })
          }
          if (tboard[i] == -2 && 1 - ans[i] > best && 1 - ans[i] < pbest) {
            best = 1 - ans[i]
            can = []
            can.push({ xy: i, k: 1 })
          } else if (
            tboard[i] == -2 &&
            1 - ans[i] > best - 0.000001 &&
            1 - ans[i] < pbest
          ) {
            can.push({ xy: i, k: 1 })
          }
        }
        for (let i = 0; i < can.length; i++) {
          pcan.push(can[i])
          if (pcan.length >= this.aiNum) break
        }
        can = pcan
      }
      console.log(ret)
    }
    console.log(can)
    let last = -1
    this.ais.forEach(({ id }) => {
      let d
      do {
        d = Math.floor(Math.random() * can.length)
        this.action(id, can[d])
      } while (Math.random() <= 0.618 && d === last)
      last = d
    })

    function getsol(tboard: number[], mm: number) {
      let all_pos = 0
      const dy = [1, -1, 0, 1, -1, 1, -1, 0]
      const d: Record<string, number> = {}
      dfs(0, 0, mm, tboard)
      //console.log("record " + Object.keys(d).length)
      function check(x: number, y: number, s: number[]) {
        if (x < 0 || y < 0) return true
        if (1 <= s[x * 8 + y] && s[x * 8 + y] <= 9) return false
        if (x == 6) {
          if (1 <= s[8 + x * 8 + y] && s[8 + x * 8 + y] <= 9) return false
        }
        if (y == 6) {
          if (1 <= s[x * 8 + y + 1] && s[x * 8 + y + 1] <= 9) return false
        }
        if (x == 6 && y == 6)
          if (1 <= s[8 + x * 8 + y + 1] && s[8 + x * 8 + y + 1] <= 9)
            return false
        return true
      }
      function dfs(x: number, y: number, m: number, s: number[]) {
        if (m < 0 || (x == 7 && 8 - y < m)) return
        // console.log(x +"," + y + " " + m + " " )
        //console.log(mine_debug)
        // //return
        if (y == 8) {
          if (x == 7) {
            if (m == 0) {
              // console.log(s)
              // console.log(mine_debug)
              all_pos += 1
            }
          } else {
            dfs(x + 1, 0, m, s)
          }
          return
        }
        const tmp = d[`${x}_${y}_${m}_${s.toString()}`]
        if (!(tmp === undefined)) {
          //console.log("record " + [x, y, m, s] + "?" + tmp.up + " " + tmp.tot + " " + tmp)
          all_pos += tmp
          return
        }
        let now_all_pos = all_pos
        const news = s.concat()
        if (s[x * 8 + y] == -1) {
          let flag = 0
          for (let k = 0; k < 8; k++) {
            if (
              0 <= x + DX[k] &&
              x + DX[k] < 8 &&
              0 <= y + dy[k] &&
              y + dy[k] < 8 &&
              0 <= news[(x + DX[k]) * 8 + y + dy[k]] &&
              news[(x + DX[k]) * 8 + y + dy[k]] <= 9
            ) {
              if (news[(x + DX[k]) * 8 + y + dy[k]] == 0) {
                flag = 1
                break
              }
              news[(x + DX[k]) * 8 + y + dy[k]] -= 1
            }
          }
          mine_debug[x * 8 + y] = 1
          if (flag == 0 && check(x - 1, y - 1, news)) dfs(x, y + 1, m - 1, news)
          mine_debug[x * 8 + y] = 0
        } else if (s[x * 8 + y] == -2) {
          if (check(x - 1, y - 1, s)) dfs(x, y + 1, m, s)
          let flag = 0
          for (let k = 0; k < 8; k++) {
            if (
              0 <= x + DX[k] &&
              x + DX[k] < 8 &&
              0 <= y + dy[k] &&
              y + dy[k] < 8 &&
              0 <= news[(x + DX[k]) * 8 + y + dy[k]] &&
              news[(x + DX[k]) * 8 + y + dy[k]] <= 9
            ) {
              if (news[(x + DX[k]) * 8 + y + dy[k]] == 0) {
                flag = 1
                break
              }
              news[(x + DX[k]) * 8 + y + dy[k]] -= 1
            }
          }
          if (flag == 0 && check(x - 1, y - 1, news)) {
            mine_debug[x * 8 + y] = 1
            dfs(x, y + 1, m - 1, news)
            mine_debug[x * 8 + y] = 0
          }
        } else {
          if (check(x - 1, y - 1, s)) dfs(x, y + 1, m, s)
        }
        now_all_pos = all_pos - now_all_pos
        d[`${x}_${y}_${m}_${s.toString()}`] = now_all_pos
        //console.log("done" + [x, y, m, s] + " " + now_has_mine + " " + now_all_pos)
        return
      }
      return all_pos
    }
  }
}
