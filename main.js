const events = (() => {
    const allEvents = {}

    const sub = (eventName, callback) => {
        if (!allEvents[eventName]) allEvents[eventName] = []
        allEvents[eventName].push(callback)
    }

    const pub = (eventName, value) => {
        if (allEvents[eventName]) {
            for(const callback of allEvents[eventName]) callback(value)
        }
    }

    return { sub, pub }
})()

const board = (() => {
    const tiles = [ ['', '', ''], ['', '', ''], ['', '', ''] ]
    events.pub('board', tiles)

    const getTile = (row, col) => tiles[row][col] 
    const getRow = row => tiles[row]
    const getCol = col => tiles.map(arr => arr[col])
    const getDiag1 = () => tiles.map((arr, ind) => arr[ind])
    const getDiag2 = () => tiles.toReversed().map((arr, ind) => arr[ind])
    const setTile = (mark, row, col) => {
        tiles[row][col] = mark
        events.pub('board', tiles)
    }
    const reset = () => {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                tiles[i][j] = ''
            }
        }
        console.log(tiles)
    }

    return { getTile, getRow, getCol, getDiag1, getDiag2, setTile, reset }
})()

const players = (() => {
    const players = []

    const make = (nombre) => {
        if (players.length > 1) return
        players.push({ 
            name: nombre ? nombre : `Jugador ${players.length + 1}`, 
            mark: !players.length ? 'X' : 'O',
            score: 0
        })
    }
    const getMark = (player) => players[player].mark
    const getName = (player) => players[player].name
    const getScore = (player) => players[player].score
    const setScore = (player) => players[player].score++

    return { make, getMark, getName, getScore, setScore }
})()

const gameFlow = (() => {
    const state = { moment: '', round: 0, turn: 0 }
    const set = (moment, round, turn) => {
        state.moment = moment
        state.round = round
        state.turn = turn
        events.pub('state', state)
    }

    const start = () => set('start', 0, 0)
    const play = () => set('play', state.round, state.turn + 1)
    const playTurn = () => (state.turn - 1 ) % 2
    const endRound = () => { set('endRound', state.round + 1, 0) }
    const endGame = () => set('endGame', state.round, 0)

    function evalMatch(mark, row, col) {
        if (board.getRow(row).every(cell => cell === mark)) {
            return { end: true, winnigGame: 'row', value: row }
        }
        if (board.getCol(col).every(cell => cell === mark)) {
            return { end: true, winnigGame: 'col', value: col }
        }
        if (board.getDiag1().every(cell => cell === mark)) {
            return { end: true, winnigGame: 'diag1', value: '' }
        }
        if (board.getDiag2().every(cell => cell === mark)) {
            return { end: true, winnigGame: 'diag2', value: '' }
        }
        if (state.round === 9) {
            return { end: true, winnigGame: 'tie', value: '' }
        }
    }

    return { start, play, playTurn, endRound, endGame, evalMatch }
})()

const interfase = (() => {
    const playersForm = document.querySelector('.formulario')
    const playersInput = document.querySelectorAll('.jugador__input')
    const playersSubmit = playersForm.lastElementChild

    const playersBoard = document.querySelector('.jugadores')
    const playersName = playersBoard.querySelectorAll('.jugador__nombre')

    const gameBoard = document.querySelectorAll('.board > button')
    const mainMessage = document.getElementById('mainMessage')
    
    const modal = document.querySelector('.modal')

    const drawBoard = ( { moment, round, turn } ) => {
        if (moment === 'start') {
            board.reset()
            playersForm.classList.remove('hidden')
            playersBoard.classList.add('hidden')
            mainMessage.textContent = '¿Quienes van a jugar?'
            for (const tile of gameBoard) tile.disabled = true
        }

        if (moment === 'play') {
            playersForm.classList.add('hidden')
            playersBoard.classList.remove('hidden')

            mainMessage.textContent = `¡${players.getName(gameFlow.playTurn())}, tu turno!`
            for (const [index, tile] of gameBoard.entries()) {
                const row = Math.floor(index / 3)
                const col = index % 3

                if (!board.getTile(row, col)) {
                    setTimeout(() => {
                        tile.textContent = players.getMark(gameFlow.playTurn())
                    }, 300)
                    tile.disabled = false
                } else {
                    tile.textContent = board.getTile(row, col)
                    tile.disabled = true
                }
            }
        }
        
        if (moment === 'endRound') {
            modal.showModal()
            board.reset()
            mainMessage.textContent = '¡Fin de la ronda!'
            for (const tile of gameBoard) {
                if (!tile.disabled) tile.textContent = ''
                tile.disabled = true
            }
        }

        console.log ('moment:', moment, 'round:', round, 'turn', turn)
    }
    events.sub('state', drawBoard)

    playersSubmit.addEventListener('click', () => {
        players.make(playersInput[0].value)
        players.make(playersInput[1].value)
        playersName[0].textContent = players.getName(0)
        playersName[1].textContent = players.getName(1)
        gameFlow.play()
    })

    for (const tile of gameBoard) {
        tile.addEventListener('click', () => {
            const row = tile.getAttribute('data-tile')[0]
            const col = tile.getAttribute('data-tile')[2]
            tile.disabled = true
            board.setTile(tile.textContent, row, col)

            const victory = gameFlow.evalMatch(tile.textContent, row, col)
            if (victory) {
                tile.classList.add('tile--ganadora')
                if (victory.winnigGame === 'row') {
                    const winnerRow = Array.from(gameBoard)
                        .filter(celda => celda.getAttribute('data-tile')[0] === row)
                    winnerRow.forEach(til => til.classList.add('tile--ganadora'))
                }

                gameFlow.endRound()
                return
            }

            gameFlow.play()
        })
    }

    return { drawBoard }
})()

gameFlow.start()

