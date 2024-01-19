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
    let tiles = [ ['', '', ''], ['', '', ''], ['', '', ''] ]
    events.pub('board', tiles)

    const getTile = (row, col) => tiles[row][col] 
    const getRow = row => tiles[row]
    const getCol = col => tiles.map(arr => arr[col])
    const getDiag1 = () => tiles.map((arr, ind) => arr[ind])
    const getDiag2 = () => tiles.toReversed().map((arr, ind) => arr[ind])
    const getBoard = () => tiles
    const setTile = (mark, row, col) => {
        tiles[row][col] = mark
        events.pub('board', tiles)
    }
    const reset = () => {
        tiles = [ ['', '', ''], ['', '', ''], ['', '', ''] ]
    }

    return { getTile, getRow, getCol, getDiag1, getDiag2, getBoard, setTile, reset}
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
    const playerTurn = () => (state.turn - 1 ) % 2
    const endRound = () => {
        players.shuffleOrder()
        set('endRound', state.round + 1, 0)
    }
    const endGame = () => set('endGame', state.round, 0)

    function evalMatch(mark, row, col) {
        // victoria
        if (board.getRow(row).every(cell => cell === mark)) return true
        if (board.getCol(col).every(cell => cell === mark)) return true 
        if (board.getDiag1().every(cell => cell === mark) ||
            board.getDiag2().every(cell => cell === mark)) return true
        // empate


        return false
    }

    return { start, play, playerTurn, endRound, endGame, evalMatch, state }
})()

const interfase = (() => {
    const playersForm = document.querySelector('.formulario')
    const playersInput = document.querySelectorAll('.jugador__input')
    const playersSubmit = playersForm.lastElementChild

    const playersBoard = document.querySelector('.jugadores')
    const playersName = playersBoard.querySelectorAll('.jugador__nombre')

    const gameBoard = document.querySelectorAll('.board > button')
    const mainMessage = document.getElementById('mainMessage')
    
    const drawBoard = ( { moment, round, turn } ) => {
        console.log ('moment:', moment, 'round:', round, 'turn', turn)

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

            mainMessage.textContent = `¡${players.getName(gameFlow.playerTurn())}, tu turno!`
            for (const [index, tile] of gameBoard.entries()) {
                const row = Math.floor(index / 3)
                const col = index % 3

                if (!board.getTile(row, col)) {
                    setTimeout(() => {
                        tile.textContent = players.getMark(gameFlow.playerTurn())
                    }, 300)
                    tile.disabled = false
                } else {
                    tile.textContent = board.getTile(row, col)
                    tile.disabled = true
                }
            }
        }
        
        if (moment === 'endRound') {
            mainMessage.textContent = '¡Fin de la ronda!'
            for (const tile of gameBoard) tile.disabled = true
        }
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
            board.setTile(tile.textContent, row, col)

            if (gameFlow.evalMatch(tile.textContent, row, col)) {
                window.alert('final')
                gameFlow.start()
                return
            }

            gameFlow.play()
        })
    }

    return { drawBoard }
})()

gameFlow.start()

