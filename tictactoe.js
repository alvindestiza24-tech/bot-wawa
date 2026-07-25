import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'tictactoe',
  alias: ['ttt', 'suit'],
  category: 'game',
  description: 'Main Tic-Tac-Toe dengan AI sederhana',
  usage: '.tictactoe',
  example: '.tictactoe',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const games = new Map()

function checkWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ]
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  if (board.every(c => c !== ' ')) return 'draw'
  return null
}

function minimax(board, depth, isMax) {
  const winner = checkWinner(board)
  if (winner === 'X') return 10 - depth
  if (winner === 'O') return depth - 10
  if (winner === 'draw') return 0
  if (isMax) {
    let best = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === ' ') {
        board[i] = 'X'
        best = Math.max(best, minimax(board, depth + 1, false))
        board[i] = ' '
      }
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === ' ') {
        board[i] = 'O'
        best = Math.min(best, minimax(board, depth + 1, true))
        board[i] = ' '
      }
    }
    return best
  }
}

function aiMove(board) {
  let best = -Infinity
  let move = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] === ' ') {
      board[i] = 'X'
      const score = minimax(board, 0, false)
      board[i] = ' '
      if (score > best) {
        best = score
        move = i
      }
    }
  }
  return move
}

function render(board) {
  let s = ''
  for (let i = 0; i < 9; i += 3) {
    s += `${board[i] || ' '} | ${board[i+1] || ' '} | ${board[i+2] || ' '}\n`
    if (i < 6) s += '---------\n'
  }
  return s
}

export async function handler(m, { sock }) {
  if (games.has(m.chat)) {
    return m.reply('⏳ Masih ada game berjalan. Selesaikan dulu!')
  }

  const board = Array(9).fill(' ')
  // Player = O, AI = X
  const game = { board, turn: 'player' }
  games.set(m.chat, game)

  await m.reply(`🎮 *Tic-Tac-Toe*\nKamu: O | AI: X\n\n${render(board)}\nKetik .ttt <1-9> untuk bermain.`)

  // Handler di messageHandler (global)
  global._tttSessions = global._tttSessions || new Map()
  global._tttSessions.set(m.chat, {
    board,
    turn: 'player',
    move: (pos) => {
      if (turn !== 'player') return 'Giliran AI'
      if (board[pos] !== ' ') return 'Kotak sudah terisi'
      board[pos] = 'O'
      const winner = checkWinner(board)
      if (winner) {
        games.delete(m.chat)
        return winner === 'O' ? '🎉 Kamu menang!' : winner === 'X' ? '🤖 AI menang!' : '🤝 Seri!'
      }
      // AI move
      const aiPos = aiMove(board)
      board[aiPos] = 'X'
      const winner2 = checkWinner(board)
      if (winner2) {
        games.delete(m.chat)
        return winner2 === 'O' ? '🎉 Kamu menang!' : winner2 === 'X' ? '🤖 AI menang!' : '🤝 Seri!'
      }
      return render(board) + '\nGiliran kamu!'
    }
  })

  await m.react('✅')
}