// Tablero
const gameBoard = (() => {
    const board = []
    for(let row = 0; row < 3; row++) {
        board[row] = []
        for(let col = 0; col < 3; col++){
            board[row].push('-')
        }
    }

    const get = () => board 

    const setMark = (mark, place) => {
        const [row, col] = [...place];
        if(board[row][col] !== '-') return
        board[row][col] = mark
    }

    return { get, setMark }
})()

// jugadores
const players = (() => {
    const players = []

    const make = (str) => {
        players.push({ 
            name: str ? str : `Computadora ${players.length + 1}`, 
            mark: !players.length ? 'X' : 'O'
        })
    }

    const get = (num) => players[num]

    return { make, get }
})()

players.make(window.prompt('Nombre jugador 1'))
players.make(window.prompt('Nombre jugador 2'))

// Flujo de juego
const gameFlow = (() => {
    let round = 0
    const getRound = () => round
    const nextRound = () => round++

    let winner = false

    const findWinner = (row, col, mark) => {
        // filas
        if(gameBoard.get()[row].every(cell => cell === mark)) {
            winner = true
            window.alert(`Ganó ${mark} por fila`)
            return
        }

        // columnas
        for(let fRow = 0; fRow < 3; fRow++){
            if(gameBoard.get()[fRow][col] !== mark) break
            if(fRow === 2) {
                winner = true
                window.alert(`Ganó ${mark} por columna`)
                return
            }
        }

        // diagonales
        for(let celda = 0; celda < 3; celda++) {
            if(gameBoard.get()[celda][celda] !== mark) break
            if(celda === 2) {
                winner = true
                window.alert(`Ganó ${mark} por diagonal 1`)
                return
            }
        }
        if(gameBoard.get()[0][2] === mark &&
            gameBoard.get()[1][1] === mark &&
            gameBoard.get()[2][0] === mark) {
            winner = true
            window.alert(`Ganó ${mark} por diagonal 2`)
            return
        }

        winner = false
    }

    do {
        const row = +window.prompt(`${players.get(round % 2).name} selecciona una fila`)
        const col = +window.prompt(`${players.get(round % 2).name} selecciona una columna`)
        if(gameBoard.get()[row][col] !== '-') {
            window.alert('esa casilla ya fue marcada, selecciona otra')
            continue
        } 
        gameBoard.setMark(players.get(round % 2).mark, [row, col])
        console.log(gameBoard.get())
        findWinner(row, col, players.get(round % 2).mark)
        nextRound()

    } while (!winner || round < 10)

    window.alert('alguien ganó')


    // tomar posicion jugador
    // evaluar
    // cambiar de jugador
    // tomar posicion jugador
    // evaluar
    // ...





    return { getRound, nextRound }

})()

// intefase
//
