// game.js
console.log("Loaded game.js!");

// Camera Class
class Camera {
  constructor(viewWidth, viewHeight, mapWidth, mapHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  centerOn(player) {
    // Center on player's center
    this.x = player.x + player.width / 2 - this.viewWidth / 2;
    this.y = player.y + player.height / 2 - this.viewHeight / 2;

    // Clamp horizontally
    if (this.mapWidth > this.viewWidth) {
      if (this.x < 0) this.x = 0;
      if (this.x + this.viewWidth > this.mapWidth) {
        this.x = this.mapWidth - this.viewWidth;
      }
    } else {
      this.x = Math.max((this.mapWidth - this.viewWidth) / 2, 0);
    }

    // Clamp vertically
    if (this.mapHeight > this.viewHeight) {
      if (this.y < 0) this.y = 0;
      if (this.y + this.viewHeight > this.mapHeight) {
        this.y = this.mapHeight - this.viewHeight;
      }
    } else {
      this.y = Math.max((this.mapHeight - this.viewHeight) / 2, 0);
    }
  }
}

// Game Class
class Game {
  constructor() {
    // Grab canvas
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.TILE_SIZE = 32;

    // Generate Maze (from generatePerfectMaze function)
    this.mapLayout = generatePerfectMaze(44, 44);

    this.MAP_ROWS = this.mapLayout.length;
    this.MAP_COLS = this.mapLayout[0].length;
    this.mapWidth = this.MAP_COLS * this.TILE_SIZE;
    this.mapHeight = this.MAP_ROWS * this.TILE_SIZE;

    // Player starts near top-left corridor (e.g. tile (1,1))
    this.player = {
      x: 1 * this.TILE_SIZE,
      y: 1 * this.TILE_SIZE,
      width: 16,
      height: 16,
      speed: 2,
      dx: 0,
      dy: 0
    };

    // Just for fun, put a monster near bottom-right
    this.monster = {
      x: (this.MAP_COLS - 2) * this.TILE_SIZE,
      y: (this.MAP_ROWS - 2) * this.TILE_SIZE,
      width: 16,
      height: 16
    };

    // Put a chest somewhere in the middle
    this.chest = {
      x: Math.floor(this.MAP_COLS / 2) * this.TILE_SIZE,
      y: Math.floor(this.MAP_ROWS / 2) * this.TILE_SIZE,
      width: 16,
      height: 16
    };

    // Input
    this.keys = { up: false, down: false, left: false, right: false };

    // Camera
    this.camera = new Camera(
      this.canvas.width,
      this.canvas.height,
      this.mapWidth,
      this.mapHeight
    );
  }

  init() {
    console.log("Game init fired! Starting game...");

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "w") this.keys.up = true;
      if (e.key === "ArrowDown" || e.key === "s") this.keys.down = true;
      if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d") this.keys.right = true;

      if (e.key === " " || e.key === "e") {
        console.log("Interact pressed (stub).");
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === "ArrowUp" || e.key === "w") this.keys.up = false;
      if (e.key === "ArrowDown" || e.key === "s") this.keys.down = false;
      if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") this.keys.right = false;
    });

    requestAnimationFrame(() => this.gameLoop());
  }

  gameLoop() {
    this.update();
    this.draw();

    // Debug log
    console.log(
      `camera=(${this.camera.x.toFixed(0)},${this.camera.y.toFixed(0)}), player=(${this.player.x.toFixed(0)},${this.player.y.toFixed(0)})`
    );

    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.player.dx = 0;
    this.player.dy = 0;

    if (this.keys.up) this.player.dy = -this.player.speed;
    if (this.keys.down) this.player.dy = this.player.speed;
    if (this.keys.left) this.player.dx = -this.player.speed;
    if (this.keys.right) this.player.dx = this.player.speed;

    const newX = this.player.x + this.player.dx;
    const newY = this.player.y + this.player.dy;

    // Collision
    if (!this.hitsWall(newX, this.player.y, this.player.width, this.player.height)) {
      this.player.x = newX;
    }
    if (!this.hitsWall(this.player.x, newY, this.player.width, this.player.height)) {
      this.player.y = newY;
    }

    // Update camera
    this.camera.centerOn(this.player);
  }

  draw() {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Outside is green
    this.ctx.fillStyle = "green";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw map
    for (let row = 0; row < this.MAP_ROWS; row++) {
      for (let col = 0; col < this.MAP_COLS; col++) {
        if (this.mapLayout[row][col] === 1) {
          // wall
          this.ctx.fillStyle = "#888";
        } else {
          // floor
          this.ctx.fillStyle = "#66BB66";
        }
        this.ctx.fillRect(
          col * this.TILE_SIZE,
          row * this.TILE_SIZE,
          this.TILE_SIZE,
          this.TILE_SIZE
        );
      }
    }

    // Monster (purple)
    this.ctx.fillStyle = "purple";
    this.ctx.fillRect(
      this.monster.x,
      this.monster.y,
      this.monster.width,
      this.monster.height
    );

    // Chest (gold)
    this.ctx.fillStyle = "gold";
    this.ctx.fillRect(
      this.chest.x,
      this.chest.y,
      this.chest.width,
      this.chest.height
    );

    // Player (white)
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height
    );

    this.ctx.restore();

    // Fog of War (optional)
    /*
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let px = (this.player.x - this.camera.x) + this.player.width / 2;
    let py = (this.player.y - this.camera.y) + this.player.height / 2;

    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.beginPath();
    this.ctx.arc(px, py, 100, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
    */
  }

  // Collision: treat 1 as wall, 0 as floor
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
    // Out-of-bounds -> treat as wall
    if (r < 0 || r >= this.MAP_ROWS || c < 0 || c >= this.MAP_COLS) {
      return true;
    }
    return this.mapLayout[r][c] === 1;
  }
}

// Expose classes to the global scope (if not using modules)
window.Camera = Camera;
window.Game = Game;
