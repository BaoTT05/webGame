/**
 * monster.js
 * Base Monster class only. Slime & Goblin both extend this.
 */

class Monster {
  constructor(game, x, y, width, height, speed, maxHealth, damage) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.currentHealth = maxHealth;
    this.maxHealth = maxHealth;
    this.damage = damage;

    // For controlling how often it hits player
    this.damageTimer = 0;
    this.damageCooldown = 1; // seconds
  }

  update(deltaTime) {
    // By default, do nothing. Subclasses (Slime, Goblin) override as needed.
  }

  draw(ctx) {
    // Draw a placeholder purple rectangle if no sprite:
    ctx.fillStyle = "purple";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Simple health bar
    ctx.fillStyle = "red";
    const hpWidth = this.width * (this.currentHealth / this.maxHealth);
    ctx.fillRect(this.x, this.y - 10, hpWidth, 5);

    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x, this.y - 10, this.width, 5);
  }

  takeDamage(amount) {
    this.currentHealth -= amount;
    if (this.currentHealth <= 0) {
      this.onDeath();
    }
  }

  onDeath() {
    // Remove from the game's monsters array
    const idx = this.game.monsters.indexOf(this);
    if (idx > -1) {
      this.game.monsters.splice(idx, 1);
    }
  }

  checkCollisionWithPlayer() {
    const player = this.game.activeHero;
    if (!player) return false;

    return (
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y
    );
  }

  dealDamageToPlayer(deltaTime) {
    // If we have a damage cooldown, count it down
    if (this.damageTimer > 0) {
      this.damageTimer -= deltaTime;
    }

    // If colliding with player and cooldown is 0, deal damage
    const player = this.game.activeHero;
    if (player && this.checkCollisionWithPlayer() && this.damageTimer <= 0) {
      player.currentHealth -= this.damage;
      this.damageTimer = this.damageCooldown;
      console.log(`${this.constructor.name} deals ${this.damage} damage to the player!`);
    }
  }
}

// Expose globally (if not using modules)
window.Monster = Monster;
