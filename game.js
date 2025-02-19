// ===================
// game.js
// ===================
class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.TILE_SIZE = 32;

    // Generate the maze layout
    this.mapLayout = window.generatePerfectMaze(20, 20, 4, 1);
    this.MAP_ROWS = this.mapLayout.length;
    this.MAP_COLS = this.mapLayout[0].length;
    this.mapWidth = this.MAP_COLS * this.TILE_SIZE;
    this.mapHeight = this.MAP_ROWS * this.TILE_SIZE;

    // Create the player
    this.tank = new Tank(this, 1 * this.TILE_SIZE, 1 * this.TILE_SIZE);

    // Entity Holder
    this.entities = [];

    // Demo chest (if needed)
    this.chest = {
      x: Math.floor(this.MAP_COLS / 2) * this.TILE_SIZE,
      y: Math.floor(this.MAP_ROWS / 2) * this.TILE_SIZE,
      width: 16,
      height: 16,
    };

    // Input keys
    this.keys = { up: false, down: false, left: false, right: false, melee: false, shoot: false };

    // Create the camera
    this.camera = new Camera(this.canvas.width, this.canvas.height, this.mapWidth, this.mapHeight);

    this.lastTime = performance.now();
    this.clockTick = 0;
    this.activeHero = this.tank;

    // Array to hold all monsters
    this.monsters = [];

    // Flag to prevent further updates once the game is over.
    this.gameOverFlag = false;
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
      if (e.key === " " || e.key === "e") console.log("Interact pressed (stub).");
    });
    document.addEventListener("keyup", (e) => {
      if (e.key === "ArrowUp" || e.key === "w") this.keys.up = false;
      if (e.key === "ArrowDown" || e.key === "s") this.keys.down = false;
      if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") this.keys.right = false;
    });

    // Disable context menu on right-click (for shooting, etc.)
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) { // Left-click for melee
        console.log("Melee triggered!");
        this.keys.melee = true;
        if (this.activeHero && this.activeHero.meleeAttack) {
          this.activeHero.meleeAttack();
        }
      } else if (e.button === 2) { // Right-click for shoot (if implemented)
        console.log("Shoot triggered!");
        this.keys.shoot = true;
        // if (this.activeHero && this.activeHero.shootAttack) { this.activeHero.shootAttack(); }
      }
    });
    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.keys.melee = false;
      else if (e.button === 2) this.keys.shoot = false;
    });

    // Spawn 8 of each enemy type (total 24)
    this.spawnMonsters();

    requestAnimationFrame(() => this.gameLoop());
  }

  spawnMonsters() {
    const enemyTypes = ["Goblin", "Slime", "Ghost"];
    enemyTypes.forEach(type => {
      for (let i = 0; i < 15; i++) {
        let placed = false;
        while (!placed) {
          const row = Math.floor(Math.random() * this.MAP_ROWS);
          const col = Math.floor(Math.random() * this.MAP_COLS);
          // Only place on floor tiles and away from the player’s start.
          if (!this.isWallTile(row, col) && (row > 2 || col > 2)) {
            const x = col * this.TILE_SIZE;
            const y = row * this.TILE_SIZE;
            let monster;
            if (type === "Goblin") monster = new Goblin(this, x, y);
            else if (type === "Slime") monster = new Slime(this, x, y);
            else if (type === "Ghost") monster = new Ghost(this, x, y);
            this.monsters.push(monster);
            placed = true;
          }
        }
      }
    });
  }

  gameLoop() {
    const currentTime = performance.now();
    this.clockTick = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (!this.gameOverFlag) {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  update() {
    // Check for game over
    if (this.activeHero.currentHealth <= 0 && !this.gameOverFlag) {
      this.gameOver();
      return;
    }

    let dx = 0, dy = 0;
    if (this.keys.up) dy = -this.tank.speed;
    if (this.keys.down) dy = this.tank.speed;
    if (this.keys.up && this.keys.down) dy = 0;
    if (this.keys.left) dx = -this.tank.speed;
    if (this.keys.right) dx = this.tank.speed;
    if (this.keys.left && this.keys.right) dx = 0;

    let newX = this.tank.x + dx;
    if (!this.hitsWall(newX, this.tank.y, this.tank.width, this.tank.height)) {
      this.tank.x = newX;
    }
    let newY = this.tank.y + dy;
    if (!this.hitsWall(this.tank.x, newY, this.tank.width, this.tank.height)) {
      this.tank.y = newY;
    }

    this.tank.update();
    this.monsters.forEach(monster => monster.update(this.clockTick));
    this.camera.update(this.tank);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw maze tiles
    for (let row = 0; row < this.MAP_ROWS; row++) {
      for (let col = 0; col < this.MAP_COLS; col++) {
        if (this.mapLayout[row][col] === 1) {
          this.ctx.drawImage(
            ASSET_MANAGER.getAsset("./tree.png"),
            col * this.TILE_SIZE,
            row * this.TILE_SIZE,
            this.TILE_SIZE,
            this.TILE_SIZE
          );
        } else {
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

    // Draw all monsters
    this.monsters.forEach(monster => monster.draw(this.ctx));

    // Draw chest (if any)
    this.ctx.fillStyle = "gold";
    this.ctx.fillRect(this.chest.x, this.chest.y, this.chest.width, this.chest.height);

    // Draw the player
    this.tank.draw(this.ctx);
    this.ctx.restore();
  }

  // Simple collision detection (treat 1 as wall, 0 as floor)
  hitsWall(xPos, yPos, w, h) {
    const leftTile = Math.floor(xPos / this.TILE_SIZE);
    const rightTile = Math.floor((xPos + w - 1) / this.TILE_SIZE);
    const topTile = Math.floor(yPos / this.TILE_SIZE);
    const bottomTile = Math.floor((yPos + h - 1) / this.TILE_SIZE);

    for (let row = topTile; row <= bottomTile; row++) {
      for (let col = leftTile; col <= rightTile; col++) {
        if (this.isWallTile(row, col)) return true;
      }
    }
    return false;
  }

  isWallTile(r, c) {
    if (r < 0 || r >= this.MAP_ROWS || c < 0 || c >= this.MAP_COLS) return true;
    return this.mapLayout[r][c] === 1;
  }

  // When the player's health hits 0, stop the game and ask to restart.
  gameOver() {
    this.gameOverFlag = true;
    setTimeout(() => {
      if (confirm("Game Over! Restart?")) {
        location.reload();
      }
    }, 0);
  }
}

window.Game = Game;
