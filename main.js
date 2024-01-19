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
    const promtBoard = () => console.log(tiles)

    events.sub('board', promtBoard)
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

    return { getTile, getRow, getCol, getDiag1, getDiag2, getBoard, setTile }
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
    // const shuffleOrder = () => {
        // if(Math.floor(Math.random() * 2)) {
            // [players[0], players[1]] = [players[1], players[0]]
            // console.log('ver')
        // }
    // }

    return { make, getMark, getName, getScore, setScore }
})()

players.make('MMejia')
players.make('Andrea')

const gameFlow = (() => {
    const state = { moment: '', round: '', turn: '' }
    const set = (moment, round, turn) => {
        state.moment = moment
        state.round = round
        state.turn = turn
        events.pub('state', state)
    }

    const start = () => set('start', 0, 0)
    const play = () => set('play', state.round, state.turn + 1)
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

    return { start, play, endRound, endGame, evalMatch, state }
})()

const interfase = (() => {
    const gameBoard = document.querySelectorAll('.board > button')
    const mainMessage = document.getElementById('mainMessage')
    
    const drawBoard = ( { moment, round, turn } ) => {

        console.log (moment, round, turn)
        if (moment === 'start') {
            mainMessage.textContent = '¿Quienes van a jugar?'
            for (const tile of gameBoard) tile.disabled = true
        }

        if (moment === 'endRound') {
            mainMessage.textContent = '¡Fin de la ronda!'
            for (const tile of gameBoard) tile.disabled = true
        }

        if (moment === 'play') {
            mainMessage.textContent = `¡${players.getName(state)}, tu turno!`
            for (const [index, tile] of gameBoard.entries()) {
                const row = Math.floor(index / 3)
                const col = index % 3

                if (!board.getTile(row, col)) {
                    tile.textContent = players.getMark(state)
                } else {
                    tile.textContent = board.getTile(row, col)
                    tile.disabled = true
                }
            }
        }
    }
    events.sub('state', drawBoard)

    for (const tile of gameBoard) {
        tile.addEventListener('click', () => {
            const row = tile.getAttribute('data-tile')[0]
            const col = tile.getAttribute('data-tile')[2]
            board.setTile(tile.textContent, row, col)
            players.shuffleOrder()
            // events.pub('state', gameFlow.nextState())

            if (gameFlow.evalMatch(tile.textContent, row, col)) {
                window.alert('final')
            }

        })
    }

    return { drawBoard }
})()

gameFlow.start()

