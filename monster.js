// Base Monster class
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
      this.state = "idle"; // can be used for different behaviors (roaming, chasing, etc.)
    }
  
    update(deltaTime) {
      // Base update does nothing. Subclasses should override this.
    }
  
    draw(ctx) {
      // Base draw: Draw a placeholder rectangle and a simple health bar.
      ctx.fillStyle = "purple";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      
      // Health bar (above the monster)
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
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
      // Default behavior: remove self from the game's monster array.
      const index = this.game.monsters.indexOf(this);
      if (index > -1) {
        this.game.monsters.splice(index, 1);
      }
    }
  
    // Simple AABB collision with the player
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
  
    // If colliding with the player, deal damage
    dealDamageToPlayer() {
      const player = this.game.activeHero;
      if (player && this.checkCollisionWithPlayer()) {
        player.currentHealth -= this.damage;
        console.log(`${this.constructor.name} deals ${this.damage} damage to the player!`);
        // You might want to add a cooldown or knockback here
      }
    }
  }
  
  //----------------------------------------------------------------
  // Goblin: Fast-moving with roaming and chasing states.
  class Goblin extends Monster {
    constructor(game, x, y) {
      // Example values: 30x30 size, fast speed, moderate health and damage.
      super(game, x, y, 30, 30, 50, 50, 10);
      this.state = "roaming"; // initial state
      // Start with a random roaming direction.
      this.roamDirection = { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() < 0.5 ? -1 : 1 };
    }
  
    update(deltaTime) {
      const player = this.game.activeHero;
      if (player) {
        // Calculate distance to the player.
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        if (distance < 200) {
          // If close, switch to "chasing" state.
          this.state = "chasing";
          // Normalize and move toward the player.
          const norm = distance || 1;
          this.x += (dx / norm) * this.speed * deltaTime;
          this.y += (dy / norm) * this.speed * deltaTime;
        } else {
          // Roam randomly.
          this.state = "roaming";
          this.x += this.roamDirection.x * (this.speed * 0.5) * deltaTime;
          this.y += this.roamDirection.y * (this.speed * 0.5) * deltaTime;
          // Occasionally change direction.
          if (Math.random() < 0.01) {
            this.roamDirection.x = Math.random() < 0.5 ? -1 : 1;
            this.roamDirection.y = Math.random() < 0.5 ? -1 : 1;
          }
        }
      }
      // Check collision with the player and deal damage.
      this.dealDamageToPlayer();
    }
  
    draw(ctx) {
      // For the goblin, use green.
      ctx.fillStyle = "green";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      // Draw health bar.
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 10, this.width, 5);
    }
  }
  
  //----------------------------------------------------------------
  // Slime: Slow-moving that splits into smaller slimes when defeated.
  class Slime extends Monster {
    constructor(game, x, y, size = 40, level = 1) {
      // Use the level to adjust health/damage. Higher level means larger slime.
      super(game, x, y, size, size, 20, 30 * level, 5);
      this.level = level; // used to determine if it should split upon death.
    }
  
    update(deltaTime) {
      // Move slowly in a random (or slightly jittery) direction.
      if (!this.direction) {
        this.direction = { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() < 0.5 ? -1 : 1 };
      }
      this.x += this.direction.x * this.speed * deltaTime;
      this.y += this.direction.y * this.speed * deltaTime;
      // Occasionally change direction.
      if (Math.random() < 0.01) {
        this.direction.x = Math.random() < 0.5 ? -1 : 1;
        this.direction.y = Math.random() < 0.5 ? -1 : 1;
      }
      this.dealDamageToPlayer();
    }
  
    draw(ctx) {
      // Draw a circle for the slime.
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      // Draw health bar.
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 10, this.width, 5);
    }
  
    onDeath() {
      // When a slime dies, if it is not the smallest version, split into two smaller slimes.
      if (this.level < 3) {
        const newLevel = this.level + 1;
        const newSize = this.width * 0.7; // adjust size for the split.
        const slime1 = new Slime(this.game, this.x, this.y, newSize, newLevel);
        const slime2 = new Slime(this.game, this.x, this.y, newSize, newLevel);
        this.game.monsters.push(slime1, slime2);
      }
      // Remove this slime.
      super.onDeath();
    }
  }
  
  //----------------------------------------------------------------
  // Ghost: Phases through walls and moves unpredictably.
  class Ghost extends Monster {
    constructor(game, x, y) {
      // Ghost may be similar in size but with different behavior.
      super(game, x, y, 30, 30, 40, 40, 8);
      // Start with a random movement direction.
      this.direction = { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() < 0.5 ? -1 : 1 };
      this.changeDirectionTimer = 0;
    }
  
    update(deltaTime) {
      // Change direction at random intervals.
      this.changeDirectionTimer -= deltaTime;
      if (this.changeDirectionTimer <= 0) {
        this.direction.x = Math.random() < 0.5 ? -1 : 1;
        this.direction.y = Math.random() < 0.5 ? -1 : 1;
        this.changeDirectionTimer = Math.random() * 2; // up to 2 seconds between changes.
      }
      // Move without worrying about wall collisions.
      this.x += this.direction.x * this.speed * deltaTime;
      this.y += this.direction.y * this.speed * deltaTime;
  
      // Occasionally, the ghost might briefly chase the player.
      const player = this.game.activeHero;
      if (player && Math.random() < 0.01) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const norm = Math.sqrt(dx * dx + dy * dy) || 1;
        this.x += (dx / norm) * this.speed * deltaTime;
        this.y += (dy / norm) * this.speed * deltaTime;
      }
      this.dealDamageToPlayer();
    }
  
    draw(ctx) {
      // Draw the ghost with a semi-transparent color.
      ctx.fillStyle = "rgba(200,200,200,0.5)";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      // Draw health bar.
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 10, this.width, 5);
    }
  }
  