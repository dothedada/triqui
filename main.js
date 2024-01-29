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

    return { getTile, getRow, getCol, getDiag1, getDiad2, setTile, reset }
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
    const reset = () => { for (const key in stats) stats[key] = 0 }
    
    const roundResult = (mark, row, col) => {
        const result = {}
        if (stats.turn === 8) {
            result.roundWinner = 'tie'
        }
        if (board.getRow(row).every(tile => tile === mark)) {
            result.game = 'row'
            result.value = row
        }
        if (board.getCol(col).every(tile => tile === mark)) {
            result.game = 'col'
            result.value = col
        }
        if (board.getDiag1().every(tile => tile === mark)) {
            result.game = 'diag1'
            result.value = ''
        }
        if (board.getDiad2().every(tile => tile === mark)) {
            result.game = 'diag2'
            result.value = ''
        }
        if (result.game) {
            result.roundWinner = `${players.getByMark(mark).name}`
            events.publish('winningGame', result)
            set(`scorePlayer${players.getByMark(mark).id}`)
            return
        }
        if (result.roundWinner === 'tie') {
            events.publish('winningGame', result)
            set('scoreTie')
            return
        }
        set('turn')
    }

    const gameResult = ( {scorePlayer1, scorePlayer2, round} ) => {
        let gameWinner
        let score
        if (scorePlayer1 === 3){
            gameWinner = players.getById(1).name
            score = 3
        }
        if (scorePlayer2 === 3){
            gameWinner = players.getById(2).name
            score = 3
        }
        if (round === 5) {
            if (scorePlayer1 > scorePlayer2) {
                gameWinner = players.getById(1).name
                score = scorePlayer1
            }
            if (scorePlayer1 < scorePlayer2) {
                gameWinner = players.getById(2).name
                score = scorePlayer2
            }
            if (scorePlayer1 === scorePlayer2) {
                gameWinner = 'tie'
                score = ''
            } 
        }
        if (gameWinner) {
            events.publish('winningGame', { gameWinner, score })
        }
    }
    events.subscribe('stats', gameResult)

    return { get, getPlayerTurn, set, reset, roundResult }
})()

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

    const gameStats = ({ scorePlayer1, scorePlayer2 }) => {
        const player1 = document.querySelectorAll('.jugador')[0]
        const player2 = document.querySelectorAll('.jugador')[1]
        player1.firstElementChild.textContent = players.getById(1).name
        player1.lastElementChild.textContent = 'X '.repeat(scorePlayer1)
        player2.firstElementChild.textContent = players.getById(2).name
        player2.lastElementChild.textContent = 'O '.repeat(scorePlayer2)
        
        if(gameFlow.get('turn') === 0) {
            player1.classList.add('jugador__turno')
            player2.classList.remove('jugador__turno')
        } else {
            player1.classList.toggle('jugador__turno')
            player2.classList.toggle('jugador__turno')
        }
    }
    events.subscribe('stats', gameStats)

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

    const drawWinner = ( { game, value } ) => {
        if (!game) return
        const getWinTiles = () => {
            if (!game.match(/\d/)) {
                const dir = game === 'row' ? '^' : '$'
                return document.querySelectorAll(`[data-tile${dir}="${value}"]`)
            }

            const diag = []
            for (let i = 0; i < 3; i++) {
                if (game === 'diag1') {
                    diag.push(document.querySelector(`[data-tile="${i}-${i}"]`))
                }
                if (game === 'diag2') {
                    diag.push(document.querySelector(`[data-tile="${i}-${(i-2)*-1}"]`))
                }
            }
            return diag
        }
        for (const tile of getWinTiles()) tile.classList.add('tile--ganadora')
    }
    events.subscribe('winningGame', drawWinner)

    const drawModal = ({ roundWinner, gameWinner, score }) => {
        if (roundWinner) modal.showModal()
        let modalWinner = gameWinner ? gameWinner : roundWinner
        if (modalWinner === 'tie') modalWinner = 'Empate'

        if (gameWinner) {
            modal.querySelector('#nextRound').classList.add('hidden')
            modal.querySelector('.reset').classList.remove('modal__btn--shy')
            modal.querySelector('h2').textContent = `¡Ganaste el juego ${modalWinner}!`
            modal.querySelector('p').textContent = '♪┏(・o・)┛♪┗ ( ・o・) ┓♪ '
        } else {
            modal.querySelector('#nextRound').classList.remove('hidden')
            modal.querySelector('.reset').classList.add('modal__btn--shy')
            modal.querySelector('h2').textContent = `¡Ganaste la ronda ${modalWinner}!`
            modal.querySelector('p').textContent = 'veamos en la siguiente ronda si fue suerte...'
        }
    }
    events.subscribe('winningGame', drawModal)



    
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

    for(const resetBtn of document.querySelectorAll('.reset')) {
        resetBtn.addEventListener('click', () => {
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
    }
})()
