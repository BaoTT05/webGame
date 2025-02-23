/**
 * slime.js
 * Slime class extends the base Monster class.
 */

class Slime extends Monster {
  constructor(game, x, y, size = 40, level = 1) {
    super(game, x, y, size, size, 20, 30 * level, 2);
    this.level = level;

    // Random direction for roaming
    this.dir = { x: (Math.random() < 0.5 ? -1 : 1), y: (Math.random() < 0.5 ? -1 : 1) };

    // Slime chase radius
    this.chaseRadius = 150;
    this.changeDirTimer = 0; // for changing roam direction occasionally
  }

  update(deltaTime) {
    this.changeDirTimer -= deltaTime;
    // occasionally pick a new random direction
    if (this.changeDirTimer <= 0) {
      this.dir.x = Math.random() < 0.5 ? -1 : 1;
      this.dir.y = Math.random() < 0.5 ? -1 : 1;
      this.changeDirTimer = 2 + Math.random() * 3;
    }

    const player = this.game.activeHero;
    if (player) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.chaseRadius) {
        // Chase the player
        const chaseSpeed = this.speed * 1.5; // faster speed while chasing
        let newX = this.x + (dx / dist) * chaseSpeed * deltaTime;
        let newY = this.y + (dy / dist) * chaseSpeed * deltaTime;

        if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
          this.x = newX;
        }
        if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
          this.y = newY;
        }
      } else {
        // Roam
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

    // Deal damage if colliding
    this.dealDamageToPlayer(deltaTime);
  }

  draw(ctx) {
    // Override base Monster's purple fill
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // A radial gradient from blue to black
    let grad = ctx.createRadialGradient(
      centerX, centerY, this.width * 0.1,
      centerX, centerY, this.width / 2
    );
    grad.addColorStop(0, "blue");
    grad.addColorStop(1, "black");
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Health bar
    ctx.fillStyle = "red";
    const hpWidth = this.width * (this.currentHealth / this.maxHealth);
    ctx.fillRect(this.x, this.y - 10, hpWidth, 5);

    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x, this.y - 10, this.width, 5);
  }

  onDeath() {
    // Example: if level < 3, split into 2 smaller slimes
    if (this.level < 3) {
      const newLevel = this.level + 1;
      const newSize = this.width * 0.7;
      const slime1 = new Slime(this.game, this.x, this.y, newSize, newLevel);
      const slime2 = new Slime(this.game, this.x, this.y, newSize, newLevel);
      this.game.monsters.push(slime1, slime2);
    }
    super.onDeath();
  }
}

window.Slime = Slime;
