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
    const grid = [['','',''],['','',''],['','','']]
    
    const getTile = (row, col) => grid[row][col]
    const getRow = row => grid[row]
    const getCol = col => grid.map(row => row[col])
    const getDiag1 = () => grid.map((row, index) => row[index])
    const getDiad2 = () => grid.toReversed().map((row, index) => row[index])

    const setTile = (mark, row, col) => {
        if(grid[row][col]) return false
        grid[row][col] = mark
        events.publish('board', grid)
        events.publish('roundResult', [mark, row, col])
        return true
    }
    
    const reset = () => {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                grid[i][j] = ''
            }
        }
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
        } )
    }

    const getById = id => allPlayers.find(player => player.id === id)
    const getByMark = mark => allPlayers.find(player => player.mark === mark).id
    // const playerByMark = mark => allPlayers.indexOf(player => player.mark === mark)
    
    const shuffle = () => {
        if(Math.floor(Math.random() * 2 )) {
            [allPlayers[0], allPlayers[1]] = [allPlayers[1], allPlayers[0]];
            console.log('rand')
            console.log(allPlayers)
        }
    }

    return { make, getById, getByMark, shuffle, allPlayers}
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
    
    const roundResult = (valuesArray) => {
        const [mark, row, col] = valuesArray

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
            if (prompt('seguir', 'parar') === 'seguir') board.reset()
        }
    }
    events.subscribe('roundResult', roundResult)

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

    return { get, set }
})()

//Módulo del juego () (tomar nombres y registrarlos, correr turnos )
const interfase = (() => {
    const drawBoard = (grid) => {
        console.log(grid)
    }
    events.subscribe('board', drawBoard)

    const getPlayers = () => {
        players.make(prompt('player1'))
        players.make(prompt('player2'))

        console.log(players.allPlayers)
    }
    getPlayers()

    const playerMove = () => {
        const round = gameFlow.get('turn') % 2
        const cell = prompt(`${players.allPlayers[round].name}, selecciona la celda`)
        const [row, col] = [cell[0], cell[1]];
        
        if (board.setTile(players.allPlayers[round].mark, row, col)) {
            board.setTile(players.allPlayers[round].mark, row, col)
            gameFlow.set('turn')
        }
    }

    while (gameFlow.get('turn') < 9) {
        playerMove()
    }

})()





//Módulo de Acciones (puente entre interfase y juego)
