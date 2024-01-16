// Tablero
const board = (() => {
    const tiles = [ ['', '', ''], ['', '', ''], ['', '', ''] ]

    const printTile = (row, col = 0) => tiles[row][col] 
    const printRow = row => tiles[row]
    const printCol = col => tiles.map(arr => arr[col])
    const printDiag1 = () => tiles.map((arr, index) => arr[index])
    const printDiag2 = () => tiles.toReversed().map((arr, index) => arr[index])

    const setMark = (mark, row, col) => {
        if(printTile(row, col)) {
            window.alert('La casilla ya está marcada, selecciona otra')
            return
        }
        tiles[row][col] = mark
    }

    return { printTile, printRow, printCol, printDiag1, printDiag2, setMark, tiles }
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

    const getMark = (num) => players[num].mark
    const getName = (num) => players[num].name

    return { make, getMark, getName }
})()

players.make('miguel')
players.make('andea')

// Flujo de juego
const gameFlow = (() => {

    function endGame(mark, row, col) {
        // Fila
        if (board.printRow(row).every(cell => cell === mark)) {
            window.alert(`${mark} ganó, fila`)
            return true
        }
        // Columna
        if (board.printCol(col).every(cell => cell === mark)) {
            window.alert(`${mark} ganó, columna`)
            return true
        }
        // Diagonal
        if (board.printDiag1().every(cell => cell === mark) ||
            board.printDiag2().every(cell => cell === mark)) {
            window.alert(`${mark} ganó, diagonal`)
            return true
        }

        return false
    }

    for(let round = 0; round < 9; round++) {
        const row = +window.prompt(`${players.getName(round % 2)} selecciona una fila`)
        const col = +window.prompt(`${players.getName(round % 2)} selecciona una columna`)

        board.setMark(players.getMark(round % 2), row, col)
        console.log(board.tiles)

        if(endGame(players.getMark(round % 2), row, col)) break
        

    }
})()
