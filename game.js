// game.js

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.TILE_SIZE = 32;

    // ===================[ NEW: MENU STATE ]===================
    this.gameState = "MENU"; // "MENU" or "PLAY"
    this.selectedDifficulty = null;

    // Maze defaults; changed once user picks difficulty.
    this.mazeRows = 10;
    this.mazeCols = 10;
    this.meleeDamage = 20;

    // Entities
    this.entities = [];

    // A demonstration chest in the center if needed
    this.chest = {
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    };
    // Menu buttons
    this.easyButton   = { x: 400, y: 200, width: 100, height: 40 };
    this.mediumButton = { x: 400, y: 250, width: 100, height: 40 };
    this.hardButton   = { x: 400, y: 300, width: 100, height: 40 };
    this.playButton   = { x: 400, y: 400, width: 100, height: 50 };

    // Input keys
    this.keys = { up: false, down: false, left: false, right: false, melee: false, shoot: false };

    // Main game world stuff: map layout, monsters, hero, camera
    this.mapLayout = null;
    this.MAP_ROWS = 0;
    this.MAP_COLS = 0;
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.tank = null;
    this.camera = null;
    this.activeHero = null;
    this.monsters = [];

    // For controlling the main loop
    this.lastTime = performance.now();
    this.clockTick = 0;
    this.gameOverFlag = false;
    this.win = false;

    // Win scenario
    this.winArea = null; 
    this.confettiParticles = [];
    this.playAgainButton = null;

    // ===== NEW: Projectiles array =====
    this.projectiles = []; // <--- We store Beam objects here
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

    // Prevent context menu on right-click
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Mouse handling for menu or in-game
    this.canvas.addEventListener("mousedown", (e) => {
      if (this.gameState === "MENU") {
        this.handleMenuClick(e);
      } else {
        // In-game
        if (e.button === 0) { 
          // Left-click => melee
          console.log("Melee triggered!");
          this.keys.melee = true;
          // If you want an immediate call to Tank's meleeAttack, do so here:
          if (this.activeHero && this.activeHero.meleeAttack) {
            this.activeHero.meleeAttack();
          }
        } else if (e.button === 2) {
          // Right-click => shoot
          console.log("Shoot triggered!");
          this.keys.shoot = true;
        }
      }
    });

    this.canvas.addEventListener("mouseup", (e) => {
      if (this.gameState === "MENU") {
        return;
      } else {
        // In-game
        if (e.button === 0) this.keys.melee = false;
        else if (e.button === 2) this.keys.shoot = false;
      }
    });

    // Start the main loop
    requestAnimationFrame(() => this.gameLoop());
  }

  // After user picks difficulty + hits Play
  initGameWorld() {
    console.log("initGameWorld with rows =", this.mazeRows, 
                "cols =", this.mazeCols, 
                "meleeDamage =", this.meleeDamage);

    // Generate the maze
    this.mapLayout = window.generatePerfectMaze(this.mazeRows, this.mazeCols, 4, 1);
    this.MAP_ROWS = this.mapLayout.length;
    this.MAP_COLS = this.mapLayout[0].length;
    this.mapWidth = this.MAP_COLS * this.TILE_SIZE;
    this.mapHeight = this.MAP_ROWS * this.TILE_SIZE;

    // Create the player tank
    this.tank = new Tank(this, 1 * this.TILE_SIZE, 1 * this.TILE_SIZE);
    this.tank.meleeAttackDamage = this.meleeDamage; 
    this.activeHero = this.tank;

    // Create the camera
    this.camera = new Camera(this.canvas.width, this.canvas.height, this.mapWidth, this.mapHeight);

    // Win area at bottom-right
    this.winArea = {
      x: (this.MAP_COLS - 2) * this.TILE_SIZE,
      y: (this.MAP_ROWS - 2) * this.TILE_SIZE,
      width: this.TILE_SIZE,
      height: this.TILE_SIZE,
    };

    // Spawn monsters
    this.spawnMonsters();
  }

  spawnMonsters() {
    // Goblin groups
    for (let i = 0; i < this.goblinGroupCount; i++) {
      this.spawnGoblinGroup();
    }
    // Slimes
    for (let i = 0; i < this.slimeCount; i++) {
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
    let placed = false;
    let groupX, groupY;
    let tries = 0;
    // We'll try up to 500 times to find a random corridor tile
    while (!placed && tries < 500) {
      const row = Math.floor(Math.random() * this.MAP_ROWS);
      const col = Math.floor(Math.random() * this.MAP_COLS);
      if (!this.isWallTile(row, col)) {
        groupX = col * this.TILE_SIZE;
        groupY = row * this.TILE_SIZE;
        placed = true;
      }
      tries++;
    }
    if (!placed) {
      console.log("Couldn't find a valid tile for Goblin group!");
      return; 
    }

    console.log(`Spawn Goblin Leader at (${groupX}, ${groupY})`);
    // Leader
    let leader = new Goblin(this, groupX, groupY, true);
    this.monsters.push(leader);
  
    // 4 followers
    for (let i = 0; i < 4; i++) {
      let fx = groupX + Math.random() * 10;
      let fy = groupY + Math.random() * 10;
      let follower = new Goblin(this, fx, fy, false);
      follower.groupLeader = leader;
      this.monsters.push(follower);
    }
  }

  // Main Loop
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
    if (this.gameState === "MENU") {
      return;
    }

    // Check if hero died
    if (this.activeHero.currentHealth <= 0 && !this.gameOverFlag) {
      this.gameOver();
      return;
    }

    // Check for win
    if (
      this.tank.x + this.tank.width > this.winArea.x &&
      this.tank.y + this.tank.height > this.winArea.y
    ) {
      this.winGame();
      return;
    }

    // Movement
    let dx = 0, dy = 0;
    if (this.keys.up) dy = -this.tank.speed;
    if (this.keys.down) dy = this.tank.speed;
    if (this.keys.left) dx = -this.tank.speed;
    if (this.keys.right) dx = this.tank.speed;

    let newX = this.tank.x + dx;
    if (!this.hitsWall(newX, this.tank.y, this.tank.width, this.tank.height)) {
      this.tank.x = newX;
    }
    let newY = this.tank.y + dy;
    if (!this.hitsWall(this.tank.x, newY, this.tank.width, this.tank.height)) {
      this.tank.y = newY;
    }

    // Update tank
    this.tank.update();

    // Update monsters
    this.monsters.forEach(m => m.update(this.clockTick));

    // Update projectiles (NEW)
    this.projectiles.forEach(p => p.update(this.clockTick));
    // Remove any beams marked for removal
    this.projectiles = this.projectiles.filter(p => !p.removeFromWorld);

    // Update camera
    this.camera.update(this.tank);
  }

  draw() {
    if (this.gameState === "MENU") {
      this.drawMenu();
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw maze
    for (let row = 0; row < this.MAP_ROWS; row++) {
      for (let col = 0; col < this.MAP_COLS; col++) {
        if (this.mapLayout[row][col] === 1) {
          // wall
          this.ctx.drawImage(
            ASSET_MANAGER.getAsset("./tree.png"),
            col * this.TILE_SIZE,
            row * this.TILE_SIZE,
            this.TILE_SIZE,
            this.TILE_SIZE
          );
        } else {
          // floor
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

    // Draw win area if not already won
    if (!this.win) {
      this.ctx.fillStyle = "gold";
      this.ctx.fillRect(this.winArea.x, this.winArea.y, this.winArea.width, this.winArea.height);
      this.ctx.strokeStyle = "black";
      this.ctx.strokeRect(this.winArea.x, this.winArea.y, this.winArea.width, this.winArea.height);
    }

    // Draw monsters
    this.monsters.forEach(m => m.draw(this.ctx));

    // Draw chest (if needed)
    // this.ctx.fillStyle = "gold";
    // this.ctx.fillRect(this.chest.x, this.chest.y, this.chest.width, this.chest.height);

    // Draw tank
    this.tank.draw(this.ctx);

    // ===== NEW: Draw projectiles =====
    this.projectiles.forEach(p => p.draw(this.ctx));

    this.ctx.restore();
  }

  // ============== MENU METHODS ==============
  drawMenu() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "white";
    this.ctx.font = "60px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Maze Game Menu", this.canvas.width / 2, 100);

    // Difficulty + Play buttons
    this.drawButton(this.easyButton,   "Easy");
    this.drawButton(this.mediumButton, "Medium");
    this.drawButton(this.hardButton,   "Hard");
    this.drawButton(this.playButton,   "Play");
  }

  drawButton(btn, label) {
    // highlight if selected
    if (
      (label === "Easy" && this.selectedDifficulty === "easy") ||
      (label === "Medium" && this.selectedDifficulty === "medium") ||
      (label === "Hard" && this.selectedDifficulty === "hard")
    ) {
      this.ctx.fillStyle = "yellow";
    } else {
      this.ctx.fillStyle = "white";
    }
    this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    this.ctx.strokeStyle = "black";
    this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    this.ctx.fillStyle = "black";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(label, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  handleMenuClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
  
    // Check which difficulty button is clicked
    if (this.isInsideButton(mx, my, this.easyButton)) {
      this.selectedDifficulty = "easy";
    }
    if (this.isInsideButton(mx, my, this.mediumButton)) {
      this.selectedDifficulty = "medium";
    }
    if (this.isInsideButton(mx, my, this.hardButton)) {
      this.selectedDifficulty = "hard";
    }
  
    // Check "Play" button
    if (this.isInsideButton(mx, my, this.playButton)) {
      if (this.selectedDifficulty) {
        switch (this.selectedDifficulty) {
          case "easy":
            this.mazeRows = 20;
            this.mazeCols = 20;
            this.meleeDamage = 20;
            this.goblinGroupCount = 30;
            this.slimeCount = 30;
            break;
  
          case "medium":
            this.mazeRows = 40;
            this.mazeCols = 40;
            this.meleeDamage = 10;
            this.goblinGroupCount = 65;
            this.slimeCount = 65;
            break;
  
          case "hard":
            this.mazeRows = 55;
            this.mazeCols = 55;
            this.meleeDamage = 5;
            this.goblinGroupCount = 100;
            this.slimeCount = 100;
            break;
        }
        // Start the game
        this.initGameWorld();
        this.gameState = "PLAY";
      } else {
        console.log("Please select a difficulty first!");
      }
    }
  }

  isInsideButton(mx, my, btn) {
    return (mx >= btn.x && mx <= btn.x + btn.width && 
            my >= btn.y && my <= btn.y + btn.height);
  }

  // ============== WALL/COLLISION + WIN/LOSE ==============
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

  winGame() {
    if (this.win) return;
    this.win = true;
    this.gameOverFlag = true;
    console.log("Player has reached the win area! You win!");
    this.initConfetti();

    this.playAgainButton = {
      x: this.canvas.width / 2 - 100,
      y: this.canvas.height / 2 + 100,
      width: 200,
      height: 50,
    };

    this.canvas.addEventListener("click", this.handleWinClickBound = this.handleWinClick.bind(this));
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
    for (let p of this.confettiParticles) {
      p.x += p.dx;
      p.y += p.dy;
      if (p.y > this.canvas.height) {
        p.y = 0;
        p.x = Math.random() * this.canvas.width;
      }
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let p of this.confettiParticles) {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = "gold";
    this.ctx.font = "60px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Congratulations!", this.canvas.width / 2, this.canvas.height / 2 - 30);
    this.ctx.fillText("You Win!", this.canvas.width / 2, this.canvas.height / 2 + 30);

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
}

// Expose globally
window.Game = Game;
