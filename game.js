class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.TILE_SIZE = 32;

    // Generate the maze layout
    this.mapLayout = window.generatePerfectMaze(10, 10, 4, 1);
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

    // Win scenario properties
    this.win = false;
    // Define winArea as the bottom-right tile (adjust as needed)
    this.winArea = {
      x: (this.MAP_COLS - 2) * this.TILE_SIZE,
      y: (this.MAP_ROWS - 2) * this.TILE_SIZE,
      width: this.TILE_SIZE,
      height: this.TILE_SIZE,
    };

    this.confettiParticles = [];
    this.playAgainButton = null; // Will be defined upon winning.
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
      }
    });
    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.keys.melee = false;
      else if (e.button === 2) this.keys.shoot = false;
    });

    // Spawn monsters
    this.spawnMonsters();

    requestAnimationFrame(() => this.gameLoop());
  }

  spawnMonsters() {
    // Spawn 3 groups of goblins (each group: 1 leader + 4 followers)
    for (let i = 0; i < 3; i++) {
      this.spawnGoblinGroup();
    }
    
    // Spawn 10 slimes with chase behavior
    for (let i = 0; i < 10; i++) {
      let placed = false;
      while (!placed) {
        const row = Math.floor(Math.random() * this.MAP_ROWS);
        const col = Math.floor(Math.random() * this.MAP_COLS);
        if (!this.isWallTile(row, col) && (row > 2 || col > 2)) {
          const x = col * this.TILE_SIZE;
          const y = row * this.TILE_SIZE;
          let slime = new Slime(this, x, y);
          this.monsters.push(slime);
          placed = true;
        }
      }
    }
  }

  spawnGoblinGroup() {
    // Find a valid spawn location for the entire goblin group.
    let placed = false;
    let groupX, groupY;
    while (!placed) {
      const row = Math.floor(Math.random() * this.MAP_ROWS);
      const col = Math.floor(Math.random() * this.MAP_COLS);
      if (!this.isWallTile(row, col) && (row > 2 || col > 2)) {
        groupX = col * this.TILE_SIZE;
        groupY = row * this.TILE_SIZE;
        placed = true;
      }
    }
    
    // Create the leader goblin.
    let leader = new Goblin(this, groupX, groupY, true);
    this.monsters.push(leader);
    
    // Create 4 follower goblins that will follow the leader.
    for (let i = 0; i < 4; i++) {
      let follower = new Goblin(this, groupX + Math.random() * 10, groupY + Math.random() * 10, false);
      follower.groupLeader = leader;
      this.monsters.push(follower);
    }
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
    // Check for game over (player dead)
    if (this.activeHero.currentHealth <= 0 && !this.gameOverFlag) {
      this.gameOver();
      return;
    }

    // Check for win condition: player enters winArea
    if (
      this.tank.x + this.tank.width > this.winArea.x &&
      this.tank.y + this.tank.height > this.winArea.y
    ) {
      this.winGame();
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

    // Draw a golden flag in the winArea as a hint (if not won yet)
    if (!this.win) {
      this.ctx.fillStyle = "gold";
      this.ctx.fillRect(this.winArea.x, this.winArea.y, this.winArea.width, this.winArea.height);
      this.ctx.strokeStyle = "black";
      this.ctx.strokeRect(this.winArea.x, this.winArea.y, this.winArea.width, this.winArea.height);
    }

    // Draw monsters
    this.monsters.forEach(monster => monster.draw(this.ctx));

    // Draw chest (if any)
    this.ctx.fillStyle = "gold";
    this.ctx.fillRect(this.chest.x, this.chest.y, this.chest.width, this.chest.height);

    // Draw player
    this.tank.draw(this.ctx);
    this.ctx.restore();
  }

  winGame() {
    if (this.win) return; // Prevent multiple triggers
    this.win = true;
    this.gameOverFlag = true;
    console.log("Player has reached the win area! You win!");
    this.initConfetti();

    // Define the play again button area on the win screen
    this.playAgainButton = {
      x: this.canvas.width / 2 - 100,
      y: this.canvas.height / 2 + 100,
      width: 200,
      height: 50,
    };

    // Add click listener for the play again option
    this.canvas.addEventListener("click", this.handleWinClickBound = this.handleWinClick.bind(this));

    // Start the win screen animation loop.
    requestAnimationFrame(() => this.winScreenLoop());
  }

  initConfetti() {
    this.confettiParticles = [];
    for (let i = 0; i < 150; i++) {
      this.confettiParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: Math.random() * 3 + 2,
        dx: (Math.random() - 0.5) * 2,
        dy: Math.random() * 2 + 1,
        color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`,
      });
    }
  }

  winScreenLoop() {
    // Update confetti positions.
    for (let p of this.confettiParticles) {
      p.x += p.dx;
      p.y += p.dy;
      if (p.y > this.canvas.height) {
        p.y = 0;
        p.x = Math.random() * this.canvas.width;
      }
    }

    // Clear the canvas and draw the win screen.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw confetti.
    for (let p of this.confettiParticles) {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw celebratory win message.
    this.ctx.fillStyle = "gold";
    this.ctx.font = "60px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Congratulations!", this.canvas.width / 2, this.canvas.height / 2 - 30);
    this.ctx.fillText("You Win!", this.canvas.width / 2, this.canvas.height / 2 + 30);

    // Draw the play again button.
    if (this.playAgainButton) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(
        this.playAgainButton.x,
        this.playAgainButton.y,
        this.playAgainButton.width,
        this.playAgainButton.height
      );
      this.ctx.strokeStyle = "gold";
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        this.playAgainButton.x,
        this.playAgainButton.y,
        this.playAgainButton.width,
        this.playAgainButton.height
      );
      this.ctx.fillStyle = "gold";
      this.ctx.font = "30px Arial";
      this.ctx.fillText(
        "Play Again",
        this.canvas.width / 2,
        this.playAgainButton.y + this.playAgainButton.height / 2 + 10
      );
    }

    requestAnimationFrame(() => this.winScreenLoop());
  }

  // Handle click events on the win screen for the play again option.
  handleWinClick(e) {
    if (!this.win || !this.playAgainButton) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (
      mouseX >= this.playAgainButton.x &&
      mouseX <= this.playAgainButton.x + this.playAgainButton.width &&
      mouseY >= this.playAgainButton.y &&
      mouseY <= this.playAgainButton.y + this.playAgainButton.height
    ) {
      location.reload();
    }
  }

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
