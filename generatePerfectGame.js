// generatePerfectGame.js
console.log("Loaded generatePerfectGame.js!");

// Maze Generation: Depth-First Search (Perfect Maze). Uses 1 and 0's for wall.
function generatePerfectMaze(cellRows, cellCols) {
  const rows = 2 * cellRows + 1;
  const cols = 2 * cellCols + 1;

  // Initialize all walls
  const maze = Array.from({ length: rows }, () =>
    Array(cols).fill(1)
  );

  // Mark each "cell" position as 0 floor (but keep walls around it),
  // i.e. each cell center is (2*r+1, 2*c+1).
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      maze[2 * r + 1][2 * c + 1] = 0;
    }
  }

  // We'll do a classic DFS over the "logical" cell grid
  // visited array for the cellRows x cellCols
  const visited = Array.from({ length: cellRows }, () =>
    Array(cellCols).fill(false)
  );

  // Random start
  const startRow = Math.floor(Math.random() * cellRows);
  const startCol = Math.floor(Math.random() * cellCols);

  visited[startRow][startCol] = true;
  const stack = [[startRow, startCol]];

  // Helper to get unvisited neighbors
  function getUnvisitedNeighbors(r, c) {
    const neighbors = [];
    // up
    if (r > 0 && !visited[r - 1][c]) neighbors.push([r - 1, c]);
    // down
    if (r < cellRows - 1 && !visited[r + 1][c]) neighbors.push([r + 1, c]);
    // left
    if (c > 0 && !visited[r][c - 1]) neighbors.push([r, c - 1]);
    // right
    if (c < cellCols - 1 && !visited[r][c + 1]) neighbors.push([r, c + 1]);
    return neighbors;
  }

  while (stack.length > 0) {
    const [cr, cc] = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(cr, cc);

    if (neighbors.length === 0) {
      // backtrack
      stack.pop();
    } else {
      // pick a random neighbor
      const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
      visited[nr][nc] = true;
      stack.push([nr, nc]);

      // carve passage between (cr, cc) and (nr, nc)
      // in "maze" coordinates:
      const row1 = 2 * cr + 1;
      const col1 = 2 * cc + 1;
      const row2 = 2 * nr + 1;
      const col2 = 2 * nc + 1;

      // If they're in the same column, the difference is in row
      if (nr === cr - 1) {
        // neighbor is above current
        maze[row1 - 1][col1] = 0;
      } else if (nr === cr + 1) {
        // neighbor is below
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

  // Return the final array (1=wall, 0=floor)
  return maze;
}

// Expose the function to the global scope (if not using modules)
window.generatePerfectMaze = generatePerfectMaze;
