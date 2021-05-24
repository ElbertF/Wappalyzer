'use strict'
/* eslint-env browser */
/* eslint-disable no-labels */

const grid = document.body.querySelector('.ttt-grid')

const icons = {
  x: document.body.querySelector('.ttt-icon-x'),
  o: document.body.querySelector('.ttt-icon-o'),
}

let paused = true

const cells = {}
const axes = ['y', 'x']
const players = ['x', 'o']

function fill(cell, player) {
  cell.value = player

  cell.el.appendChild(icons[player].cloneNode(true))
}

function reset() {
  for (let y = 1; y <= 3; y++) {
    for (let x = 1; x <= 3; x++) {
      const cell = cells[y][x]

      cell.el.classList.remove('ttt-blink')

      cell.el.firstChild && cell.el.removeChild(cell.el.firstChild)

      cell.value = ''
    }
  }

  const { empty } = check()

  play(empty)
}

function checkLine(line, complete) {
  for (const player of players) {
    if (line[player].length === 3) {
      complete.player = player

      complete.cells.push(...line[player])
    }
  }
}

function check(dryrun) {
  const empty = []
  const complete = {
    player: null,
    cells: [],
  }

  for (const axis of axes) {
    const diagonal = { o: [], x: [] }

    for (let a = 1; a <= 3; a++) {
      const y = a
      const x = axis === 'y' ? y : 4 - y

      const cell = cells[y][x]

      cell.value && diagonal[cell.value].push(cell)

      const straight = { o: [], x: [] }

      for (let b = 1; b <= 3; b++) {
        const y = axis === 'y' ? a : b
        const x = axis === 'y' ? b : a

        const cell = cells[y][x]

        cell.value ? straight[cell.value].push(cell) : empty.push(cell)
      }

      checkLine(straight, complete)
    }

    checkLine(diagonal, complete)
  }

  if (!dryrun) {
    if (complete.player) {
      complete.cells.forEach(({ el }) => el.classList.add('ttt-blink'))

      setTimeout(() => {
        reset()
      }, 1200)
    } else if (!empty.length) {
      setTimeout(() => {
        reset()
      }, 1200)
    }
  }

  return { winner: complete.player, empty: [...new Set(empty)] }
}

function play(cells) {
  setTimeout(() => {
    let found = false

    search: for (const cell of cells) {
      for (const player of players) {
        cell.value = player

        const { winner, empty } = check(true)

        if (winner || !empty) {
          found = true

          fill(cell, 'x')

          break search
        } else {
          cell.value = ''
        }
      }
    }

    if (!found) {
      const cell = cells[Math.round(Math.random() * (cells.length - 1))]

      fill(cell, 'x')
    }

    const { winner, empty } = check()

    if (!winner && empty) {
      paused = false
    }
  }, 400)
}

for (let y = 1; y <= 3; y++) {
  for (let x = 1; x <= 3; x++) {
    const el = grid.querySelector(
      `.ttt-row:nth-child(${y}) .ttt-cell:nth-child(${x})`
    )

    el.addEventListener('click', () => {
      if (paused) {
        return
      }

      const cell = cells[y][x]

      if (!cell.value) {
        paused = true

        fill(cell, 'o')

        const { winner, empty } = check()

        !winner && play(empty)
      }
    })

    cells[y] = cells[y] || {}

    cells[y][x] = {
      x,
      y,
      el,
      value: '',
    }
  }
}

reset()
