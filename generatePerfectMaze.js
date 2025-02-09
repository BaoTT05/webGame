console.log("Loaded generatePerfectMaze.js!");

function generatePerfectMaze(cellRows, cellCols, corridorSize = 3, wallSize = 1) {
  const rows = 2 * cellRows + 1;
  const cols = 2 * cellCols + 1;
  const maze = Array.from({ length: rows }, () => Array(cols).fill(1));

  // 1) Initialize maze (small grid)
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      maze[2 * r + 1][2 * c + 1] = 0;
    }
  }

  // 2) Keep track of visited cells for DFS
  const visited = Array.from({ length: cellRows }, () => Array(cellCols).fill(false));
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

  // 3) Depth-first search to carve out the maze
  while (stack.length > 0) {
    const [cr, cc] = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(cr, cc);

    if (neighbors.length === 0) {
      // Backtrack
      stack.pop();
    } else {
      // Choose a random neighbor
      const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
      visited[nr][nc] = true;
      stack.push([nr, nc]);

      // Carve a path
      const row1 = 2 * cr + 1;
      const col1 = 2 * cc + 1;
      const row2 = 2 * nr + 1;
      const col2 = 2 * nc + 1;

      if (nr === cr - 1) {
        // Carve upward
        maze[row1 - 1][col1] = 0;
      } else if (nr === cr + 1) {
        // Carve downward
        maze[row1 + 1][col1] = 0;
      } else if (nc === cc - 1) {
        // Carve left
        maze[row1][col1 - 1] = 0;
      } else if (nc === cc + 1) {
        // Carve right
        maze[row1][col1 + 1] = 0;
      }
    }
  }

  // 4) Inflate the maze so walls and corridors have thickness
  function inflateMaze(smallMaze, corridor = 3, boundary = 1) {
    const smallRows = smallMaze.length;
    const smallCols = smallMaze[0].length;

    // Calculate inflated dimensions
    let bigRows = 0;
    for (let r = 0; r < smallRows; r++) {
      bigRows += (r % 2 === 0) ? boundary : corridor;
    }
    let bigCols = 0;
    for (let c = 0; c < smallCols; c++) {
      bigCols += (c % 2 === 0) ? boundary : corridor;
    }

    // Create the inflated maze
    const thickMaze = Array.from({ length: bigRows }, () => Array(bigCols).fill(0));

    // Helper to fill a rectangular block in the inflated grid
    function fillBlock(rStart, cStart, rSize, cSize, val) {
      for (let rr = 0; rr < rSize; rr++) {
        for (let cc = 0; cc < cSize; cc++) {
          thickMaze[rStart + rr][cStart + cc] = val;
        }
      }
    }

    // Fill the inflated maze
    let rowOffset = 0;
    for (let r = 0; r < smallRows; r++) {
      const rowBlockSize = (r % 2 === 0) ? boundary : corridor;
      let colOffset = 0;
      for (let c = 0; c < smallCols; c++) {
        const colBlockSize = (c % 2 === 0) ? boundary : corridor;
        // Use the same value as the small maze (NO inversion)
        const newVal = smallMaze[r][c];
        fillBlock(rowOffset, colOffset, rowBlockSize, colBlockSize, newVal);
        colOffset += colBlockSize;
      }
      rowOffset += rowBlockSize;
    }

    return thickMaze;
  }

  // 5) Generate the final, "thick" maze
  const thickMaze = inflateMaze(maze, corridorSize, wallSize);

  // 6) Print the inflated maze in the console, row by row
  console.log("Generated Maze:");
  thickMaze.forEach((row) => {
    console.log(row.join(" "));
  });

  // Return the final inflated maze array
  return thickMaze;
}

window.generatePerfectMaze = generatePerfectMaze;
