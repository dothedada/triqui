const events = (() => {
    const allEvents = {}

    const publish = (eventName, eventValue) => {
        if (allEvents[eventName]){
            for(const callback of allEvents[eventName]) callback(eventValue)
        }
    }

    const subscribe = (eventName, callback) => {
        if (!allEvents[eventName]) allEvents[eventName] = []
        allEvents[eventName].push(callback)
    }

    return { publish, subscribe}
})()

//Módulo del tablero (dibujo del tablero y reporte del estado del tablero, )
const board = (() => {
    let grid = [['','',''],['','',''],['','','']]
    
    const getTile = (row, col) => grid[row][col]
    const getRow = row => grid[row]
    const getCol = col => grid.map(row => row[col])
    const getDiag1 = () => grid.map((row, index) => row[index])
    const getDiad2 = () => grid.toReversed().map((row, index) => row[index])

    const setTile = (mark, row, col) => {
        grid[row][col] = mark
        gameFlow.roundResult(mark, row, col)
        events.publish('board', grid)
    }
    
    const reset = () => {
        grid = [['','',''],['','',''],['','','']]
        events.publish('board', grid)
    }

    return { getTile, getRow, getCol, getDiag1, getDiad2, setTile, reset}
})()

//Módulo de jugadores (nombres, signos y puntajes acumulados, asignar turnos)
const players = (() => {
    const allPlayers = []

    const make = name => {
        if (allPlayers.length > 1) return
        allPlayers.push( {
            id: !allPlayers.length ? 1 : 2,
            name: name ? name : `Jugador@ ${allPlayers.length +1}`,
            mark: !allPlayers.length ? 'X' : 'O',
        })
        events.publish('readyToPlay', readyToPlay())
    }

    const readyToPlay = () => allPlayers.length === 2
    const getById = id => allPlayers.find(player => player.id === id)
    const getByMark = mark => allPlayers.find(player => player.mark === mark).id
    const getByTurn = turn => allPlayers[turn] 
    
    return { make, readyToPlay, getById, getByMark, getByTurn }
})()

//módulo de juego (evaluar tablero, declarar victoria de rondas, declarar victoria del juego)
const gameFlow = (() => {
    const stats = {
        turn: 0,
        scorePlayer1: 0,
        scorePlayer2: 0,
        scoreTie: 0,
        round: 0,
    }

    const get = (stat) => stats[stat]
    const getTurn = () => stats.turn % 2 

    const set = (stat) => {
        if (stat.match(/^score/)) {
            stats.round++
            stats.turn = 0
        }
        stats[stat]++
        events.publish('stats', stats)
    }
    
    const roundResult = (mark, row, col) => {
        let restart = false

        if (stats.turn === 8) {
            set('scoreTie')
            restart = true
        }
        if (board.getRow(row).every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark)}`)
            events.publish('winningGame', { game: 'row', winner: mark ,value: row })
            restart = true
        }
        if (board.getCol(col).every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark)}`)
            events.publish('winningGame', { game: 'col', winner: mark ,value: row })
            restart = true
        }
        if (board.getDiag1().every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark)}`)
            events.publish('winningGame', { game: 'diag1', winner: mark ,value: row })
            restart = true
        }
        if (board.getDiad2().every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark)}`)
            events.publish('winningGame', { game: 'diag2', winner: mark ,value: row })
            restart = true
        }

        if (!restart) gameFlow.set('turn')
    }

    const gameResult = ( {scorePlayer1, scorePlayer2, round} ) => {
        console.table(stats)
        if (scorePlayer1 === 3){
            console.log('ganó', players.getById(1).name)
        }
        if (scorePlayer2 === 3){
            console.log('ganó', players.getById(2).name)
        }
        if (round === 5) {
            if (scorePlayer1 > scorePlayer2) console.log('ganó', players.getById(1).name)
            if (scorePlayer1 < scorePlayer2) console.log('ganó', players.getById(2).name)
            if (scorePlayer1 === scorePlayer2) console.log('empate')
        }
    }
    events.subscribe('stats', gameResult)

    return { get, getTurn, set, roundResult }
})()

//Módulo del juego () (tomar nombres y registrarlos, correr turnos )
const interfase = (() => {
    const playersInput = document.querySelector('.formulario')
    const playersBoard = document.querySelector('.jugadores')
    const gameBoard = document.querySelectorAll('.board > button')
    const message = document.querySelector('#mainMessage')
    const modal = document.querySelector('#finPartida')

    const startGame = (readyToPlay = false) => {
        if (readyToPlay) {
            playersInput.classList.add('hidden')
            playersInput.setAttribute('aria-hidden', 'true')
            playersBoard.classList.remove('hidden')
            playersBoard.removeAttribute('aria-hidden')
        } else {
            playersInput.classList.remove('hidden')
            playersInput.removeAttribute('aria-hidden')
            playersBoard.classList.add('hidden')
            playersBoard.setAttribute('aria-hidden', 'true')
        }
    }
    startGame()
    events.subscribe('readyToPlay', startGame)

    const gameStats = ({ turn, scorePlayer1, scorePlayer2 }) => {
        const player1 = document.querySelectorAll('.jugador')[0]
        const player2 = document.querySelectorAll('.jugador')[1]
        
        player1.firstElementChild.textContent = players.getById(1).name
        player2.firstElementChild.textContent = players.getById(2).name

        player1.lastElementChild.textContent = `${scorePlayer1} de 5 juegos`
        player2.lastElementChild.textContent = `${scorePlayer2} de 5 juegos`
        
        if (turn === 0) {
            player1.classList.add('jugador__turno')
            player2.classList.remove('jugador__turno')
        } else {
            player1.classList.toggle('jugador__turno')
            player2.classList.toggle('jugador__turno')
        }

    }
    events.subscribe('stats', gameStats)

    // tablero
    const drawBoard = (readyToPlay = false) => {
        for (const tile of gameBoard) {
            const row = tile.getAttribute('data-tile')[0]
            const col = tile.getAttribute('data-tile')[2]
            tile.disabled = true
            message.textContent = '¿Quienes van a jugar?'
            if (!readyToPlay) continue 

            if (!board.getTile(row,col)) {
                tile.disabled = false
                tile.textContent = players.getByTurn(gameFlow.getTurn()).mark
            }
            
            message.textContent = `${players.getByTurn(gameFlow.getTurn()).name}, tu turno...`
        }
    }
    drawBoard()
    events.subscribe('readyToPlay', drawBoard)
    events.subscribe('board', drawBoard)

    const drawWinner = ( { game, value } ) => {
        const winningTiles = (() => {
            if (!game.match(/\d/)) {
                const direction = game === 'row' ? '^' : '$'
                return document.querySelectorAll(`[data-tile${direction}="${value}"]`)
            }
            const diagonal = []
            for (let i = 0; i < 3; i++) {
                if (game === 'diag1') {
                    diagonal.push(document.querySelector(`[data-tile="${i}-${i}"]`))
                }
                if (game === 'diag2') {
                    diagonal.push(document.querySelector(`[data-tile="${i}-${(i-2)*-1}"]`))
                }
            }
            return diagonal
        })()

        for (const tile of winningTiles) {
            tile.classList.add('tile--ganadora')
            console.log(tile)
        }

        modal.showModal()
    }
    events.subscribe('winningGame', drawWinner)


    // botones
    document.querySelector('#submit').addEventListener('click', () => {
        players.make(document.querySelector('#player1').value)
        players.make(document.querySelector('#player2').value)
        board.reset()
        gameStats({ scorePlayer1: 0, scorePlayer2: 0 })
    })
    
    for (const tileBtn of gameBoard) {
        tileBtn.addEventListener('click', () => {
            const row = tileBtn.getAttribute('data-tile')[0]
            const col = tileBtn.getAttribute('data-tile')[2]

            board.setTile(tileBtn.textContent, row, col)
        })
    }
})()
