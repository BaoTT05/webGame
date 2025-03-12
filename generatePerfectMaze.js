// ===================
// generatePerfectMaze.js
// ===================
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

  // 3) DFS to carve out the maze
  while (stack.length > 0) {
    const [cr, cc] = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(cr, cc);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
      visited[nr][nc] = true;
      stack.push([nr, nc]);

      // Carve a path between (cr,cc) and (nr,nc)
      const row1 = 2 * cr + 1;
      const col1 = 2 * cc + 1;
      if (nr === cr - 1) maze[row1 - 1][col1] = 0;
      else if (nr === cr + 1) maze[row1 + 1][col1] = 0;
      else if (nc === cc - 1) maze[row1][col1 - 1] = 0;
      else if (nc === cc + 1) maze[row1][col1 + 1] = 0;
    }
  }

  // 4) Inflate the maze so walls and corridors have thickness
  function inflateMaze(smallMaze, corridor = 3, boundary = 1) {
    const smallRows = smallMaze.length;
    const smallCols = smallMaze[0].length;

    let bigRows = 0;
    for (let r = 0; r < smallRows; r++) {
      bigRows += (r % 2 === 0) ? boundary : corridor;
    }
    let bigCols = 0;
    for (let c = 0; c < smallCols; c++) {
      bigCols += (c % 2 === 0) ? boundary : corridor;
    }

    const thickMaze = Array.from({ length: bigRows }, () => Array(bigCols).fill(0));

    function fillBlock(rStart, cStart, rSize, cSize, val) {
      for (let rr = 0; rr < rSize; rr++) {
        for (let cc = 0; cc < cSize; cc++) {
          thickMaze[rStart + rr][cStart + cc] = val;
        }
      }
    }

    let rowOffset = 0;
    for (let r = 0; r < smallRows; r++) {
      const rowBlockSize = (r % 2 === 0) ? boundary : corridor;
      let colOffset = 0;
      for (let c = 0; c < smallCols; c++) {
        const colBlockSize = (c % 2 === 0) ? boundary : corridor;
        fillBlock(rowOffset, colOffset, rowBlockSize, colBlockSize, smallMaze[r][c]);
        colOffset += colBlockSize;
      }
      rowOffset += rowBlockSize;
    }
    return thickMaze;
  }

  const thickMaze = inflateMaze(maze, corridorSize, wallSize);
  console.log("Generated Maze:");
  thickMaze.forEach((row) => console.log(row.join(" ")));
  return thickMaze;
}

window.generatePerfectMaze = generatePerfectMaze;
