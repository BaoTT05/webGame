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
    this.state = "idle"; // For different behaviors (e.g., roaming, chasing)
    
    // Damage cooldown properties to avoid damaging the player too rapidly.
    this.damageTimer = 0;
    this.damageCooldown = 1; // In seconds
  }

  // Base update: to be overridden by subclasses
  update(deltaTime) {
    // Default behavior does nothing.
  }

  // Draw a placeholder rectangle and a simple health bar
  draw(ctx) {
    // Draw the monster's body
    ctx.fillStyle = "purple";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw health bar above the monster
    ctx.fillStyle = "red";
    const healthWidth = this.width * (this.currentHealth / this.maxHealth);
    ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x, this.y - 10, this.width, 5);
  }

  // Reduce health by the given amount and handle death
  takeDamage(amount) {
    this.currentHealth -= amount;
    if (this.currentHealth <= 0) {
      this.onDeath();
    }
  }

  // Remove the monster from the game when it dies
  onDeath() {
    const index = this.game.monsters.indexOf(this);
    if (index > -1) {
      this.game.monsters.splice(index, 1);
    }
  }

  // Simple AABB collision check with the player
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

  // Deal damage to the player if colliding and if the cooldown has elapsed
  dealDamageToPlayer(deltaTime) {
    if (this.damageTimer > 0) {
      this.damageTimer -= deltaTime;
    }
    const player = this.game.activeHero;
    if (player && this.checkCollisionWithPlayer() && this.damageTimer <= 0) {
      player.currentHealth -= this.damage;
      this.damageTimer = this.damageCooldown;
      console.log(`${this.constructor.name} deals ${this.damage} damage to the player!`);
    }
  }
}
