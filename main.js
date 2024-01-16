const board = (() => {
    const tiles = [ ['', '', ''], ['', '', ''], ['', '', ''] ]

    const printTile = (row, col) => tiles[row][col] 
    const printRow = row => tiles[row]
    const printCol = col => tiles.map(arr => arr[col])
    const printDiag1 = () => tiles.map((arr, index) => arr[index])
    const printDiag2 = () => tiles.toReversed().map((arr, index) => arr[index])
    const setMark = (mark, row, col) => { tiles[row][col] = mark }

    return { printTile, printRow, printCol, printDiag1, printDiag2, setMark }
})()

const players = (() => {
    const players = []

    const make = (nombre) => {
        players.push({ 
            name: nombre ? nombre : `Computadora ${players.length + 1}`, 
            mark: !players.length ? 'X' : 'O'
        })
    }
    const getMark = (player) => players[player].mark
    const getName = (player) => players[player].name

    return { make, getMark, getName }
})()

const gameFlow = (() => {
    function endGame(mark, row, col) {
        if (board.printRow(row).every(cell => cell === mark)) return true
        if (board.printCol(col).every(cell => cell === mark)) return true 
        if (board.printDiag1().every(cell => cell === mark) ||
            board.printDiag2().every(cell => cell === mark)) return true

        return false
    }

    let round = 0
    while(round < 10) {
        if (round === 9) return window.alert('Es un empate')

        const row = +window.prompt(`${players.getName(round % 2)} selecciona una fila`)
        const col = +window.prompt(`${players.getName(round % 2)} selecciona una columna`)

        if (board.printTile(row, col)) {
            window.alert('la celda ya está ocupada')
            continue
        }

        board.setMark(players.getMark(round % 2), row, col)

        if (endGame(players.getMark(round % 2), row, col)) {
            window.alert(`${players.getName(round % 2)} ganó.`)
            return
        }

        round++
    }
})()
// Implementación de la interfase

