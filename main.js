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
    
    const shuffle = () => {
        if(Math.floor(Math.random() * 2 )) {
            [allPlayers[0], allPlayers[1]] = [allPlayers[1], allPlayers[0]];
            console.log('rand')
            console.log(allPlayers)
        }
    }

    return { make, readyToPlay, getById, getByMark, shuffle }
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

        if (stats.turn > 8) {
            set('scoreTie')
            restart = true
        }
        if (board.getRow(row).every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark)}`)
            restart = true
        }
        if (board.getCol(col).every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark)}`)
            restart = true
        }
        if (board.getDiag1().every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark)}`)
            restart = true
        }
        if (board.getDiad2().every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark)}`)
            restart = true
        }

        if (restart) { 
            if (prompt('seguir', 'y') === 'y') board.reset()
        }
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

    return { get, set, roundResult }
})()

//Módulo del juego () (tomar nombres y registrarlos, correr turnos )
const interfase = (() => {
    const playersInput = document.querySelector('.formulario')
    const playersSubmit = document.querySelector('#submit')
    const playersBoard = document.querySelector('.jugadores')
    const gameBoard = document.querySelectorAll('.board > button')

    const startGame = readyToPlay => {
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
    events.subscribe('readyToPlay', startGame)

    const gameStats = ({ scorePlayer1, scorePlayer2 }) => {
        const player1 = document.querySelectorAll('.jugador')[0]
        const player2 = document.querySelectorAll('.jugador')[1]
        
        player1.firstElementChild.textContent = players.getById(1).name
        player2.firstElementChild.textContent = players.getById(2).name

        player1.lastElementChild.textContent = `${scorePlayer1} / 5`
        player2.lastElementChild.textContent = `${scorePlayer2} / 5`
    }
    events.subscribe('stats', gameStats)

    // tablero


    // botones
    playersSubmit.addEventListener('click', () => {
        players.make(document.querySelector('#player1').value)
        players.make(document.querySelector('#player2').value)
        board.reset()
        gameStats({ scorePlayer1: 0, scorePlayer2: 0 })
    })


})()





//Módulo de Acciones (puente entre interfase y juego)
