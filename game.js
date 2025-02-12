// game.js
class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.TILE_SIZE = 32;

    // Generate the maze layout using generatePerfectMaze
    this.mapLayout = window.generatePerfectMaze(40, 40, 4,1);
    this.MAP_ROWS = this.mapLayout.length;
    this.MAP_COLS = this.mapLayout[0].length;
    this.mapWidth = this.MAP_COLS * this.TILE_SIZE;
    this.mapHeight = this.MAP_ROWS * this.TILE_SIZE;

    // Instead of a separate player object, we use the Tank as our player.
    this.tank = new Tank(this, 1 * this.TILE_SIZE, 1 * this.TILE_SIZE);

    // Create a monster and a chest for demonstration
    this.monster = {
      x: (this.MAP_COLS - 2) * this.TILE_SIZE,
      y: (this.MAP_ROWS - 2) * this.TILE_SIZE,
      width: 16,
      height: 16,
    };

    this.chest = {
      x: Math.floor(this.MAP_COLS / 2) * this.TILE_SIZE,
      y: Math.floor(this.MAP_ROWS / 2) * this.TILE_SIZE,
      width: 16,
      height: 16,
    };

    // Input keys
    this.keys = { up: false, down: false, left: false, right: false };

    // Create a Camera to follow the Tank (player)
    this.camera = new Camera(this.canvas.width, this.canvas.height, this.mapWidth, this.mapHeight);

    // For calculating the delta time (clock tick)
    this.lastTime = performance.now();
    this.clockTick = 0;
  }

  init() {
    console.log("Game init() called!");
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "w") this.keys.up = true;
      if (e.key === "ArrowDown" || e.key === "s") this.keys.down = true;
      if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d") this.keys.right = true;
      if (e.key === "r") this.keys.melee = true;
      if (e.key === "t") this.keys.shoot = true;
      if (e.key === " " || e.key === "e") {
        console.log("Interact pressed (stub).");
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === "ArrowUp" || e.key === "w") this.keys.up = false;
      if (e.key === "ArrowDown" || e.key === "s") this.keys.down = false;
      if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") this.keys.right = false;
      if (e.key === "r") this.keys.melee = false;
      if (e.key === "t") this.keys.shoot = false;
    });

    requestAnimationFrame(() => this.gameLoop());
  }

  gameLoop() {
    // Compute the time since the last frame in seconds.
    let currentTime = performance.now();
    this.clockTick = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Determine movement based on keys
    let dx = 0, dy = 0;
    if (this.keys.up)    dy = -this.tank.speed;
    if (this.keys.down)  dy =  this.tank.speed;
    if (this.keys.up && this.keys.down) dy = 0;
    if (this.keys.left)  dx = -this.tank.speed;
    if (this.keys.right) dx =  this.tank.speed;
    if (this.keys.left && this.keys.right) dx = 0;

    // Check collisions for horizontal movement.
    let newX = this.tank.x + dx;
    if (!this.hitsWall(newX, this.tank.y, 35, 30)) {
      this.tank.x = newX;
    }
    // Check collisions for vertical movement.
    let newY = this.tank.y + dy;
    if (!this.hitsWall(this.tank.x, newY, 35, 30)) {
      this.tank.y = newY;
    }

    // Update animation state, etc.
    this.tank.update();

    // Update the camera to follow the tank.
    this.camera.update(this.tank);
  }

  draw() {
    // Clear the canvas.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background.
    this.ctx.fillStyle = "green";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply camera translation.
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw maze (walls and floor).
    for (let row = 0; row < this.MAP_ROWS; row++) {
      for (let col = 0; col < this.MAP_COLS; col++) {
        this.ctx.fillStyle = this.mapLayout[row][col] === 1 ? "#888" : "#66BB66";
        this.ctx.fillRect(col * this.TILE_SIZE, row * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
      }
    }

    // Draw monster and chest for demo purposes.
    this.ctx.fillStyle = "purple";
    this.ctx.fillRect(this.monster.x, this.monster.y, this.monster.width, this.monster.height);

    this.ctx.fillStyle = "gold";
    this.ctx.fillRect(this.chest.x, this.chest.y, this.chest.width, this.chest.height);

    // Draw the Tank (player character) at its world coordinates.
    this.tank.draw(this.ctx);

    this.ctx.restore();
  }

  // Simple collision detection: treat 1 as wall, 0 as floor.
  hitsWall(xPos, yPos, w, h) {
    const leftTile = Math.floor(xPos / this.TILE_SIZE);
    const rightTile = Math.floor((xPos + w - 1) / this.TILE_SIZE);
    const topTile = Math.floor(yPos / this.TILE_SIZE);
    const bottomTile = Math.floor((yPos + h - 1) / this.TILE_SIZE);

    return (
      this.isWallTile(topTile, leftTile) ||
      this.isWallTile(topTile, rightTile) ||
      this.isWallTile(bottomTile, leftTile) ||
      this.isWallTile(bottomTile, rightTile)
    );
  }

  isWallTile(r, c) {
    if (r < 0 || r >= this.MAP_ROWS || c < 0 || c >= this.MAP_COLS) {
      return true;
    }
    return this.mapLayout[r][c] === 1;
  }
}

window.Game = Game;
