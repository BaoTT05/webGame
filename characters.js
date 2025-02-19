// ===================
// characters.js
// ===================

// --- HealthBar Class ---
class HealthBar {
    constructor(entity, offsetX = 0, offsetY = -10, width = null, height = 5) {
      if (!entity || typeof entity.currentHealth === "undefined" || typeof entity.maxHealth === "undefined") {
        console.error("HealthBar Error: Entity is missing health properties!", entity);
        return;
      }
      this.entity = entity;
      this.offsetX = offsetX;
      this.offsetY = offsetY;
      this.width = width || entity.width || 35;
      this.height = height;
    }
    update() {}
    draw(ctx) {
      if (!this.entity || this.entity.currentHealth <= 0) return;
      let ratio = Math.max(0, this.entity.currentHealth / this.entity.maxHealth);
      ctx.fillStyle = ratio < 0.2 ? "Red" : ratio < 0.5 ? "Yellow" : "Green";
      ctx.fillRect(this.entity.x + this.offsetX, this.entity.y + this.offsetY, this.width * ratio, this.height);
      ctx.strokeStyle = "Black";
      ctx.strokeRect(this.entity.x + this.offsetX, this.entity.y + this.offsetY, this.width, this.height);
    }
  }
  
  // --- Tank (Player) Class ---
  class Tank {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 35;
      this.height = 30;
      this.speed = 20;
      this.facing = 0; // 0 = left, 1 = right
      this.state = 0;  // 0 = idle, 1 = walking
      this.attacks = 0;
      this.dead = false;
      this.currentHealth = 100;
      this.maxHealth = 100;
      this.healthBar = new HealthBar(this);
      this.spritesheet = ASSET_MANAGER.getAsset("./Megaman sprite.png");
      this.animations = [];
      this.loadAnimations(this.spritesheet);
    }
  
    loadAnimations(spritesheet) {
      // Prepare a 3D array: [state][facing][attack]
      for (let i = 0; i < 2; i++) {
        this.animations.push([]);
        for (let j = 0; j < 2; j++) {
          this.animations[i].push([]);
          for (let k = 0; k < 3; k++) {
            this.animations[i][j].push(null);
          }
        }
      }
      // Idle animations:
      this.animations[0][0][0] = new Animator(spritesheet, 70, 61, 35, 30, 2, 0.4, 0, false, true);
      this.animations[0][1][0] = new Animator(spritesheet, 0, 61, 32, 30, 2, 0.4, 0, false, true);
      // Walking animations:
      this.animations[1][0][0] = new Animator(spritesheet, 0, 31, 35, 30, 4, 0.4, 0, false, true);
      this.animations[1][1][0] = new Animator(spritesheet, 0, 0, 35, 30, 4, 0.4, 0, false, true);
      // Melee attack animations:
      this.animations[1][0][1] = new Animator(spritesheet, 0, 151, 35, 30, 4, 0.2, 0, false, true);
      this.animations[1][1][1] = new Animator(spritesheet, 0, 91, 35, 30, 4, 0.2, 0, false, true);
    }
  
    // --- Player Attack ---
    meleeAttack() {
      // For simplicity, define a circular attack range.
      const attackRadius = 50;
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      this.game.monsters.forEach(monster => {
        const monsterCenterX = monster.x + monster.width / 2;
        const monsterCenterY = monster.y + monster.height / 2;
        const dx = monsterCenterX - centerX;
        const dy = monsterCenterY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < attackRadius) {
          monster.takeDamage(20);
          console.log("Hit monster for 20 damage!");
        }
      });
    }
  
    update() {
      // (Your movement/animation code here remains largely unchanged.)
      let moving = false;
      if (this.game.keys.left && !this.game.keys.right) { this.state = 1; this.facing = 0; moving = true; }
      else if (this.game.keys.right && !this.game.keys.left) { this.state = 1; this.facing = 1; moving = true; }
      else { this.state = 0; }
  
      // If melee is triggered, perform the attack.
      if (this.game.keys.melee) {
        this.meleeAttack();
      }
  
      if (this.healthBar) this.healthBar.update();
    }
  
    draw(ctx) {
      // Debug collision box:
      ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      // Draw current animation frame:
      if (this.animations[this.state] && this.animations[this.state][this.facing][this.attacks]) {
        this.animations[this.state][this.facing][this.attacks].drawFrame(
          this.game.clockTick, ctx, this.x, this.y, 1
        );
      } else {
        console.error("Missing animation for state:", this.state, "facing:", this.facing);
      }
      if (this.healthBar) this.healthBar.draw(ctx);
    }
  }
  
  window.Tank = Tank;
  
  // --- Monster Classes ---
  
  // Base Monster class with damage cooldown
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
      this.state = "idle";
      this.damageTimer = 0;
      this.damageCooldown = 1; // seconds
    }
  
    update(deltaTime) {
      // Base update does nothing.
    }
  
    draw(ctx) {
      // Default draw (a placeholder rectangle with a health bar).
      ctx.fillStyle = "purple";
      ctx.fillRect(this.x, this.y, this.width, this.height);
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
      const index = this.game.monsters.indexOf(this);
      if (index > -1) this.game.monsters.splice(index, 1);
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
  
    // Only deal damage if the cooldown has elapsed.
    dealDamageToPlayer(deltaTime) {
      if (this.damageTimer > 0) this.damageTimer -= deltaTime;
      const player = this.game.activeHero;
      if (player && this.checkCollisionWithPlayer() && this.damageTimer <= 0) {
        player.currentHealth -= this.damage;
        this.damageTimer = this.damageCooldown;
        console.log(`${this.constructor.name} deals ${this.damage} damage to the player!`);
      }
    }
  }
  
  // --- Goblin --- (Fast-moving; obeys walls)
  class Goblin extends Monster {
    constructor(game, x, y) {
      // Adjusted damage to 5.
      super(game, x, y, 30, 30, 50, 50, 5);
      this.state = "roaming";
      this.roamDirection = { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() < 0.5 ? -1 : 1 };
    }
  
    update(deltaTime) {
      const player = this.game.activeHero;
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        if (distance < 200) {
          this.state = "chasing";
          const norm = distance || 1;
          let newX = this.x + (dx / norm) * this.speed * deltaTime;
          if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
            this.x = newX;
          }
          let newY = this.y + (dy / norm) * this.speed * deltaTime;
          if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
            this.y = newY;
          }
        } else {
          this.state = "roaming";
          let newX = this.x + this.roamDirection.x * (this.speed * 0.5) * deltaTime;
          if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
            this.x = newX;
          }
          let newY = this.y + this.roamDirection.y * (this.speed * 0.5) * deltaTime;
          if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
            this.y = newY;
          }
          if (Math.random() < 0.01) {
            this.roamDirection.x = Math.random() < 0.5 ? -1 : 1;
            this.roamDirection.y = Math.random() < 0.5 ? -1 : 1;
          }
        }
      }
      this.dealDamageToPlayer(deltaTime);
    }
  
    draw(ctx) {
      ctx.fillStyle = "green";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 10, this.width, 5);
    }
  }
  
  // --- Slime --- (Slow-moving; splits on death; obeys walls)
  class Slime extends Monster {
    constructor(game, x, y, size = 40, level = 1) {
      // Adjusted damage to 2.
      super(game, x, y, size, size, 20, 30 * level, 2);
      this.level = level;
    }
  
    update(deltaTime) {
      if (!this.direction) {
        this.direction = { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() < 0.5 ? -1 : 1 };
      }
      let newX = this.x + this.direction.x * this.speed * deltaTime;
      if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
        this.x = newX;
      }
      let newY = this.y + this.direction.y * this.speed * deltaTime;
      if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
        this.y = newY;
      }
      if (Math.random() < 0.01) {
        this.direction.x = Math.random() < 0.5 ? -1 : 1;
        this.direction.y = Math.random() < 0.5 ? -1 : 1;
      }
      this.dealDamageToPlayer(deltaTime);
    }
  
    draw(ctx) {
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 10, this.width, 5);
    }
  
    onDeath() {
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
  
  // --- Ghost --- (Ignores walls; moves unpredictably)
  class Ghost extends Monster {
    constructor(game, x, y) {
      // Adjusted damage to 4.
      super(game, x, y, 30, 30, 40, 40, 4);
      this.direction = { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() < 0.5 ? -1 : 1 };
      this.changeDirectionTimer = 0;
    }
  
    update(deltaTime) {
      this.changeDirectionTimer -= deltaTime;
      if (this.changeDirectionTimer <= 0) {
        this.direction.x = Math.random() < 0.5 ? -1 : 1;
        this.direction.y = Math.random() < 0.5 ? -1 : 1;
        this.changeDirectionTimer = Math.random() * 2;
      }
      // Ghost ignores walls.
      this.x += this.direction.x * this.speed * deltaTime;
      this.y += this.direction.y * this.speed * deltaTime;
  
      const player = this.game.activeHero;
      if (player && Math.random() < 0.01) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const norm = Math.sqrt(dx * dx + dy * dy) || 1;
        this.x += (dx / norm) * this.speed * deltaTime;
        this.y += (dy / norm) * this.speed * deltaTime;
      }
      this.dealDamageToPlayer(deltaTime);
    }
  
    draw(ctx) {
      ctx.fillStyle = "rgba(200,200,200,0.5)";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 10, this.width, this.height);
    }
  }
  
  window.Goblin = Goblin;
  window.Slime = Slime;
  window.Ghost = Ghost;
  