console.log("Loaded generatePerfectMaze.js!");

/**
 * Generate a perfect maze with cellRows x cellCols "cells" using classic DFS.
 * Internally it first builds a "small" maze array with 1=wall, 0=passage
 * of dimension (2*cellRows+1) x (2*cellCols+1).
 *
 * Then it "inflates" that small maze so that corridors become corridorSize wide
 * and walls remain wallSize wide. By default corridorSize=3, wallSize=1.
 * Returns the "inflated" 2D array with 1=floor, 0=wall.
 */
function generatePerfectMaze(cellRows, cellCols, corridorSize = 3, wallSize = 1) {
  // --------------------------------------------------
  // STEP 1: Build the standard "small" maze via DFS
  //         using 1=wall, 0=floor in a (2*cellRows+1) x (2*cellCols+1) array
  // --------------------------------------------------
  
  const rows = 2 * cellRows + 1;
  const cols = 2 * cellCols + 1;

  // Initialize all as walls (1)
  const maze = Array.from({ length: rows }, () => Array(cols).fill(1));

  // Mark each "cell" center as 0 floor
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      maze[2 * r + 1][2 * c + 1] = 0;
    }
  }

  // Visited array for the DFS
  const visited = Array.from({ length: cellRows }, () => Array(cellCols).fill(false));

  // Pick random start
  const startRow = Math.floor(Math.random() * cellRows);
  const startCol = Math.floor(Math.random() * cellCols);
  visited[startRow][startCol] = true;
  const stack = [[startRow, startCol]];

  function getUnvisitedNeighbors(r, c) {
    const neighbors = [];
    if (r > 0 && !visited[r - 1][c]) neighbors.push([r - 1, c]);
    if (r < cellRows - 1 && !visited[r + 1][c]) neighbors.push([r + 1, c]);
    if (c > 0 && !visited[r][c - 1]) neighbors.push([r, c - 1]);
    if (c < cellCols - 1 && !visited[r][c + 1]) neighbors.push([r, c + 1]);
    return neighbors;
  }

  while (stack.length > 0) {
    const [cr, cc] = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(cr, cc);

    if (neighbors.length === 0) {
      // Backtrack
      stack.pop();
    } else {
      // Pick random neighbor
      const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
      visited[nr][nc] = true;
      stack.push([nr, nc]);

      // Carve a passage in the small maze
      // between (cr, cc) and (nr, nc)
      const row1 = 2 * cr + 1;
      const col1 = 2 * cc + 1;
      const row2 = 2 * nr + 1;
      const col2 = 2 * nc + 1;

      if (nr === cr - 1) {
        // neighbor above
        maze[row1 - 1][col1] = 0;
      } else if (nr === cr + 1) {
        // neighbor below
        maze[row1 + 1][col1] = 0;
      } else if (nc === cc - 1) {
        // neighbor left
        maze[row1][col1 - 1] = 0;
      } else if (nc === cc + 1) {
        // neighbor right
        maze[row1][col1 + 1] = 0;
      }
    }
  }

  // --------------------------------------------------
  // STEP 2: "Inflate" the small maze so corridors become (corridorSize) wide
  //         and walls remain (wallSize) wide.
  //         The final array will use 1=floor, 0=wall.
  // --------------------------------------------------

  function inflateMaze(smallMaze, corridor = 3, boundary = 1) {
    const smallRows = smallMaze.length;
    const smallCols = smallMaze[0].length;

    // Calculate final dimensions
    // We treat even indices as walls => they become boundary-thick
    // and odd indices as corridors => they become corridor-thick.
    let bigRows = 0;
    for (let r = 0; r < smallRows; r++) {
      bigRows += (r % 2 === 0) ? boundary : corridor;
    }
    let bigCols = 0;
    for (let c = 0; c < smallCols; c++) {
      bigCols += (c % 2 === 0) ? boundary : corridor;
    }

    // Initialize the "big" maze with zeros (we'll fill below)
    const thickMaze = Array.from({ length: bigRows }, () => Array(bigCols).fill(0));

    // Helper to fill a rectangular block
    function fillBlock(rStart, cStart, rSize, cSize, val) {
      for (let rr = 0; rr < rSize; rr++) {
        for (let cc = 0; cc < cSize; cc++) {
          thickMaze[rStart + rr][cStart + cc] = val;
        }
      }
    }

    // Iterate the small maze; map each cell to a block in the thickMaze
    let rowOffset = 0;
    for (let r = 0; r < smallRows; r++) {
      const rowBlockSize = (r % 2 === 0) ? boundary : corridor;

      let colOffset = 0;
      for (let c = 0; c < smallCols; c++) {
        const colBlockSize = (c % 2 === 0) ? boundary : corridor;
        // smallMaze[r][c] === 1 means "wall" in the small maze,
        // smallMaze[r][c] === 0 means "passage/floor" in the small maze.
        // We want the final thick maze to have 0=wall, 1=floor => so invert.
        const newVal = (smallMaze[r][c] === 0) ? 1 : 0;

        fillBlock(rowOffset, colOffset, rowBlockSize, colBlockSize, newVal);

        colOffset += colBlockSize;
      }
      rowOffset += rowBlockSize;
    }

    return thickMaze;
  }

  // Inflate to get 3-wide corridors, 1-wide walls
  const thickMaze = inflateMaze(maze, corridorSize, wallSize);

  // Return the thick maze (0=wall, 1=floor)
  return thickMaze;
}

// Make it accessible globally (if not using modules).
window.generatePerfectMaze = generatePerfectMaze;
