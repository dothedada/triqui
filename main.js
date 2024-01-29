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

    return { getTile, getRow, getCol, getDiag1, getDiad2, setTile, reset, grid}
})()

const players = (() => {
    const allPlayers = []

    const make = name => {
        if (allPlayers.length > 1) return
        allPlayers.push( {
            id: !allPlayers.length ? 1 : 2,
            name: name ? name : `Jugador@ ${allPlayers.length +1}`,
            mark: !allPlayers.length ? 'X' : 'O',
        })
        events.publish('readyToPlay', true)
    }

    const readyToPlay = () => allPlayers.length === 2
    const getById = id => allPlayers.find(player => player.id === id)
    const getByMark = mark => allPlayers.find(player => player.mark === mark)
    const getByTurn = turn => allPlayers[turn] 
    const reset = () => { allPlayers.length = 0 }

    return { make, readyToPlay, getById, getByMark, getByTurn, reset }
})()

const gameFlow = (() => {
    const stats = {
        turn: 0,
        scorePlayer1: 0,
        scorePlayer2: 0,
        scoreTie: 0,
        round: 0,
    }

    const get = (stat) => stats[stat]
    const getPlayerTurn = () => stats.turn % 2 

    const set = (stat) => {
        if (stat.match(/^score/)) {
            stats.round++
            stats.turn = 0
        }
        stats[stat]++
        events.publish('stats', stats)
    }

    const reset = () => {
        for (const key in stats) stats[key] = 0 
    }
    
    const roundResult = (mark, row, col) => {
        if (stats.turn === 8) {
            set('scoreTie')
            events.publish('winningGame', {game: 'tie', winner: '' ,value: '' })
            return
        }
        if (board.getRow(row).every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark).id}`)
            events.publish('winningGame', {game: 'row', winner: mark ,value: row })
            return
        }
        if (board.getCol(col).every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark).id}`)
            events.publish('winningGame', {game: 'col', winner: mark ,value: col })
            return
        }
        if (board.getDiag1().every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark).id}`)
            events.publish('winningGame', {game: 'diag1', winner: mark ,value: ''})
            return
        }
        if (board.getDiad2().every(tile => tile === mark)) {
            set(`scorePlayer${players.getByMark(mark).id}`)
            events.publish('winningGame', {game: 'diag2', winner: mark ,value: ''})
            return
        }

        gameFlow.set('turn')
    }

    const gameResult = ( {scorePlayer1, scorePlayer2, round} ) => {
        console.table(stats)
        let winner
        let score
        if (scorePlayer1 === 3){
            winner = players.getById(1).name
            score = 3
        }
        if (scorePlayer2 === 3){
            winner = players.getById(2).name
            score = 3
        }
        if (round === 5) {
            if (scorePlayer1 > scorePlayer2) {
                winner = players.getById(1).name
                score = scorePlayer1
            }
            if (scorePlayer1 < scorePlayer2) {
                winner = players.getById(2).name
                score = scorePlayer2
            }
            if (scorePlayer1 === scorePlayer2) {
                winner = 'tie'
                score = ''
            } 
        }
        if (winner) events.publish('gameWinner', { winner, score })
    }
    events.subscribe('stats', gameResult)


    return { get, getPlayerTurn, set, reset, roundResult }
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
        
        if(gameFlow.get('turn') === 0) {
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
                tile.textContent = players.getByTurn(gameFlow.getPlayerTurn()).mark
            }
            
            message.textContent = `${players.getByTurn(gameFlow.getPlayerTurn()).name}, tu turno...`
        }
    }
    drawBoard()
    events.subscribe('readyToPlay', drawBoard)
    events.subscribe('board', drawBoard)

    const drawWinner = ( { game, winner, value } ) => {
        if (game === 'tie') {
            modal.showModal()
            return
        }

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

        for (const tile of winningTiles) tile.classList.add('tile--ganadora')
        modal.querySelector('h2').textContent = `¡Ganaste ${players.getByMark(winner).name}!`
        modal.querySelector('p').textContent = `${players.getByMark(winner).name}`

        modal.showModal()
    }
    events.subscribe('winningGame', drawWinner)
    //
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

    document.querySelector('#nextRound').addEventListener('click', () => {
        board.reset()
        modal.close()
        for (const tile of gameBoard) tile.classList.remove('tile--ganadora')
    })

    document.querySelector('#endGame').addEventListener('click', () => {
        board.reset()
        gameFlow.reset()
        players.reset()
        for (const tile of gameBoard) {
            tile.classList.remove('tile--ganadora')
            tile.textContent = ''
        }
        events.publish('readyToPlay', false)
        modal.close()
    })
})()
