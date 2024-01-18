const board = (() => {
    const tiles = [ ['', '', ''], ['', '', ''], ['', '', ''] ]

    const getTile = (row, col) => tiles[row][col] 
    const getRow = row => tiles[row]
    const getCol = col => tiles.map(arr => arr[col])
    const getDiag1 = () => tiles.map((arr, ind) => arr[ind])
    const getDiag2 = () => tiles.toReversed().map((arr, ind) => arr[ind])
    const setTile = (mark, row, col) => { tiles[row][col] = mark }

    return { getTile, getRow, getCol, getDiag1, getDiag2, setTile, tiles}
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
    let state = 0
    const getState = () => state
    const setState = (value) => { state = value }

    function endGame(mark, row, col) {
        if (board.getRow(row).every(cell => cell === mark)) return true
        if (board.getCol(col).every(cell => cell === mark)) return true 
        if (board.getDiag1().every(cell => cell === mark) ||
            board.getDiag2().every(cell => cell === mark)) return true

        return false
    }

    // function play() {
    //     let round = 0
    //     while(round < 10) {
    //         if (round === 9) return window.alert('Es un empate')
    //
    //         const row = +window.prompt(`${players.getName(round % 2)} selecciona una fila`)
    //         const col = +window.prompt(`${players.getName(round % 2)} selecciona una columna`)
    //
    //         if (board.getTile(row, col)) {
    //             window.alert('la celda ya está ocupada')
    //             continue
    //
    //         }
    //
    //         board.setTile(players.getMark(round % 2), row, col)
    //
    //         if (endGame(players.getMark(round % 2), row, col)) {
    //             window.alert(`${players.getName(round % 2)} ganó.`)
    //             return
    //         }
    //
    //         round++
    //     }
    // }

    return { getState, setState, endGame }
})()
// Implementación de la interfase
const interfase = (() => {
    const playersFormName = document.querySelectorAll('.jugador__input')
    const playersSubmit = document.querySelector('.formulario button')
    const playersGame = document.querySelectorAll('.jugadores .jugador')
    const gameReset = document.querySelector('.header > button')
    
    const tiles = document.querySelectorAll('.tile')

    const formVisible = () => {
        document.querySelector('.formulario').classList.toggle('hidden')
        document.querySelector('.jugadores').classList.toggle('hidden')
    }

    const toggelTurn = () => {
        for(const jugador of playersGame) {
            jugador.classList.toggle('jugador__turno')
        }
    }

    const boardState = (bol = true, mark = '') => {
        for(const tile of tiles) {
            tile.disabled = bol
            setTimeout(() => {
                tile.lastElementChild.textContent = mark
            }, tile.lastElementChild.textContent ? 0 : 300 )
        }
    }
    boardState()

    playersSubmit.addEventListener('click', () => {
        players.make(playersFormName[0].value)
        players.make(playersFormName[1].value)

        playersGame[0].firstElementChild.textContent = players.getName(0)
        playersGame[1].firstElementChild.textContent = players.getName(1)

        formVisible()

        boardState(false, players.getMark(0))
    })

    gameReset.addEventListener('click', () => {
        boardState()
        formVisible()
    })

    for(const tile of tiles) {
        tile.addEventListener('click', () => {
            const row = +tile.getAttribute('data-tile')[0]
            const col = +tile.getAttribute('data-tile')[2]
            board.setTile(tile.lastElementChild.textContent, row, col)
            gameFlow.endGame(tile.lastElementChild.textContent, row, col)
            toggelTurn()

            
            tile.disabled = true

            console.log(board.tiles)
        } )
    }

})()

