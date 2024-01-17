const board = (() => {
    const tiles = [ ['', '', ''], ['', '', ''], ['', '', ''] ]

    const getTile = (row, col) => tiles[row][col] 
    const getRow = row => tiles[row]
    const getCol = col => tiles.map(arr => arr[col])
    const getDiag1 = () => tiles.map((arr, ind) => arr[ind])
    const getDiag2 = () => tiles.toReversed().map((arr, ind) => arr[ind])
    const setTile = (mark, row, col) => { tiles[row][col] = mark }

    return { getTile, getRow, getCol, getDiag1, getDiag2, setTile}
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
        if (board.getRow(row).every(cell => cell === mark)) return true
        if (board.getCol(col).every(cell => cell === mark)) return true 
        if (board.getDiag1().every(cell => cell === mark) ||
            board.getDiag2().every(cell => cell === mark)) return true

        return false
    }

    let round = 0
    while(round < 10) {
        if (round === 9) return window.alert('Es un empate')

        const row = +window.prompt(`${players.getName(round % 2)} selecciona una fila`)
        const col = +window.prompt(`${players.getName(round % 2)} selecciona una columna`)

        if (board.getTile(row, col)) {
            window.alert('la celda ya está ocupada')
            continue

        }

        board.setTile(players.getMark(round % 2), row, col)

        if (endGame(players.getMark(round % 2), row, col)) {
            window.alert(`${players.getName(round % 2)} ganó.`)
            return
        }

        round++
    }
})()
// Implementación de la interfase

