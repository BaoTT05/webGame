class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.TILE_SIZE = 32;

    // Generate the maze layout using generatePerfectMaze
    this.mapLayout = window.generatePerfectMaze(40, 40, 4, 1);
    this.MAP_ROWS = this.mapLayout.length;
    this.MAP_COLS = this.mapLayout[0].length;
    this.mapWidth = this.MAP_COLS * this.TILE_SIZE;
    this.mapHeight = this.MAP_ROWS * this.TILE_SIZE;

    // Use the Tank as our player (hero)
    this.tank = new Tank(this, 1 * this.TILE_SIZE, 1 * this.TILE_SIZE);

    // Entity Holder
    this.entities = [];

    // Demo objects
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

    // Input keys (including melee and shoot)
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      melee: false,
      shoot: false,
    };

    // Create a Camera to follow the hero
    this.camera = new Camera(this.canvas.width, this.canvas.height, this.mapWidth, this.mapHeight);

    // For delta time calculations
    this.lastTime = performance.now();
    this.clockTick = 0;

    // Set the active hero (to allow multiple heroes later)
    this.activeHero = this.tank;
  }

  addEntity(entity) {
      this.entities.push(entity);
  }

  init() {
    console.log("Game init() called!");

    // Keyboard listeners
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

    // Disable right-click context menu on the canvas
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Mouse listeners: Left-click for melee, right-click for shoot
    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) { // Left-click for melee
        console.log("Melee triggered!");
        this.keys.melee = true;
        if (this.activeHero && this.activeHero.meleeAttack) {
          this.activeHero.meleeAttack();
        }
      } else if (e.button === 2) { // Right-click for shoot
        console.log("Shoot triggered!");
        this.keys.shoot = true;
        if (this.activeHero && this.activeHero.shootAttack) {
          this.activeHero.shootAttack();
        }
      }
    });

    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.keys.melee = false;
      } else if (e.button === 2) {
        this.keys.shoot = false;
      }
    });

    requestAnimationFrame(() => this.gameLoop());
  }

  gameLoop() {
    let currentTime = performance.now();
    this.clockTick = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Basic movement logic based on keyboard input
    let dx = 0, dy = 0;
    if (this.keys.up)    dy = -this.tank.speed;
    if (this.keys.down)  dy =  this.tank.speed;
    if (this.keys.up && this.keys.down) dy = 0;
    if (this.keys.left)  dx = -this.tank.speed;
    if (this.keys.right) dx =  this.tank.speed;
    if (this.keys.left && this.keys.right) dx = 0;

    // Horizontal collision check
    let newX = this.tank.x + dx;
    if (!this.hitsWall(newX, this.tank.y, this.tank.width, this.tank.height)) {
      this.tank.x = newX;
    }
    // Vertical collision check
    let newY = this.tank.y + dy;
    if (!this.hitsWall(this.tank.x, newY, this.tank.width, this.tank.height)) {
      this.tank.y = newY;
    }

    this.tank.update();
    this.camera.update(this.tank);
  }

  draw() {
    // Clear the canvas.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
    // Apply camera translation.
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
  
    // Loop over the maze and draw tiles.
    for (let row = 0; row < this.MAP_ROWS; row++) {
      for (let col = 0; col < this.MAP_COLS; col++) {
        if (this.mapLayout[row][col] === 1) {
          // Draw tree tile for wall cells.
          this.ctx.drawImage(
            ASSET_MANAGER.getAsset("./tree.png"),
            col * this.TILE_SIZE,
            row * this.TILE_SIZE,
            this.TILE_SIZE,
            this.TILE_SIZE
          );
        } else {
          // Draw the grass tile for floor cells.
          // (If you want to zoom in on the grass, use the appropriate drawImage parameters.)
          this.ctx.drawImage(
            ASSET_MANAGER.getAsset("./grass.png"),
            col * this.TILE_SIZE,
            row * this.TILE_SIZE,
            this.TILE_SIZE,
            this.TILE_SIZE
          );
        }
      }
    }
  
    // Draw demo objects (monster and chest)
    this.ctx.fillStyle = "purple";
    this.ctx.fillRect(
      this.monster.x,
      this.monster.y,
      this.monster.width,
      this.monster.height
    );
  
    this.ctx.fillStyle = "gold";
    this.ctx.fillRect(
      this.chest.x,
      this.chest.y,
      this.chest.width,
      this.chest.height
    );
  
    // Draw the hero (tank)
    this.tank.draw(this.ctx);
  
    this.ctx.restore();
  }
  
  

  // Simple collision detection (treat 1 as wall, 0 as floor)
// Simple collision detection (treat 1 as wall, 0 as floor)
hitsWall(xPos, yPos, w, h) {
  const leftTile = Math.floor(xPos / this.TILE_SIZE);
  const rightTile = Math.floor((xPos + w - 1) / this.TILE_SIZE);
  const topTile = Math.floor(yPos / this.TILE_SIZE);
  const bottomTile = Math.floor((yPos + h - 1) / this.TILE_SIZE);

  // Check every tile in the bounding box
  for (let row = topTile; row <= bottomTile; row++) {
    for (let col = leftTile; col <= rightTile; col++) {
      if (this.isWallTile(row, col)) {
        return true; // We hit a wall tile
      }
    }
  }
  return false; // No wall in this bounding box
}

isWallTile(r, c) {
  // Treat out-of-bounds as walls
  if (r < 0 || r >= this.MAP_ROWS || c < 0 || c >= this.MAP_COLS) {
    return true;
  }
  return this.mapLayout[r][c] === 1;
}

}

// IMPORTANT: Expose the Game class globally so that main.js can use it.
window.Game = Game;
