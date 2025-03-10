/**
 * slime.js
 * Slime class extends the base Monster class.
 * Uses a 7-frame "run" animation from slime.png, each frame is 128×80 at y=380–460.
 * Slimes are now bigger by default (64×64).
 */

class Slime extends Monster {
  /**
   * @param {Game} game  Reference to the main game.
   * @param {number} x    Spawn X coordinate.
   * @param {number} y    Spawn Y coordinate.
   * @param {number} size Default 64 for bigger slimes.
   * @param {number} level Slime level (affects health, etc.).
   */
  constructor(game, x, y, size = 64, level = 1) {
    // e.g. speed=20, maxHealth=30*level, damage=2
    super(game, x, y, size, size, 20, 30 * level, 2);
    this.level = level;

    // Basic roam/chase logic
    this.dir = { 
      x: (Math.random() < 0.5 ? -1 : 1),
      y: (Math.random() < 0.5 ? -1 : 1)
    };
    this.chaseRadius = 150;
    this.changeDirTimer = 0;

    // Reference the Slime spritesheet from AssetManager
    this.spritesheet = ASSET_MANAGER.getAsset("./slime.png");

    // Create an object to hold possible animations (run, idle, etc.)
    this.animations = {};
    this.loadAnimations();

    // For now, always use the "run" animation
    this.currentAnimation = this.animations.run;
  }

  loadAnimations() {
    // We have 7 frames across, each is 128px wide × 80px tall
    // The row starts at (0, 380). 
    // So the frames go: (0..128,380..460), (128..256,380..460), ..., (768..896,380..460)

    this.animations.run = new Animator(
      this.spritesheet,
      0,    // xStart
      380,  // yStart
      138,  // width per frame
      80,   // height per frame
      7,    // total frames
      0.1,  // frameDuration in seconds => ~10 FPS
      0,    // framePadding (0 if frames are contiguous)
      false, // reverse
      true   // loop
    );
  }

  update(deltaTime) {
    // Movement AI: roam or chase
    this.changeDirTimer -= deltaTime;
    if (this.changeDirTimer <= 0) {
      this.dir.x = (Math.random() < 0.5 ? -1 : 1);
      this.dir.y = (Math.random() < 0.5 ? -1 : 1);
      this.changeDirTimer = 2 + Math.random() * 3;
    }

    const player = this.game.activeHero;
    if (player) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // If player is within chase range, move toward them
      if (dist < this.chaseRadius) {
        const chaseSpeed = this.speed * 1.5;
        let newX = this.x + (dx / dist) * chaseSpeed * deltaTime;
        let newY = this.y + (dy / dist) * chaseSpeed * deltaTime;
        if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
          this.x = newX;
        }
        if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
          this.y = newY;
        }
      } else {
        // Otherwise roam in a random direction
        let roamX = this.x + this.dir.x * this.speed * deltaTime;
        if (!this.game.hitsWall(roamX, this.y, this.width, this.height)) {
          this.x = roamX;
        }
        let roamY = this.y + this.dir.y * this.speed * deltaTime;
        if (!this.game.hitsWall(this.x, roamY, this.width, this.height)) {
          this.y = roamY;
        }
      }
    }

    // Collision damage if near hero
    this.dealDamageToPlayer(deltaTime);
  }

  draw(ctx) {
    // Each sprite frame is 128×80 in the texture.
    // Our Slime is 64×64 in the game. So we scale by (64/128)=0.5 horizontally.
    // The vertical dimension is also scaled by 0.5 (=> final ~40px tall).
    let scale = this.width / 128; // or you can do 0.5 directly

    // Draw the current animation
    this.currentAnimation.drawFrame(
      this.game.clockTick,
      ctx,
      this.x,
      this.y,
      scale
    );

    // Then draw the health bar above it
    let hpRatio = this.currentHealth / this.maxHealth;
    let hpWidth = this.width;
    let hpX = this.x;
    let hpY = this.y - 10;

    ctx.fillStyle = "red";
    ctx.fillRect(hpX, hpY, hpWidth * hpRatio, 5);
    ctx.strokeStyle = "black";
    ctx.strokeRect(hpX, hpY, hpWidth, 5);
  }

  onDeath() {
    // If level < 3, split into 2 smaller Slimes
    if (this.level < 3) {
      const newLevel = this.level + 1;
      // e.g. new size is 70% of the old
      const newSize = this.width * 0.7;
      const slime1 = new Slime(this.game, this.x, this.y, newSize, newLevel);
      const slime2 = new Slime(this.game, this.x, this.y, newSize, newLevel);
      this.game.monsters.push(slime1, slime2);
    }
    super.onDeath();
  }
}

// Expose globally
window.Slime = Slime;
