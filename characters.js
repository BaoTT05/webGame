// characters.js

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

  update() { /* No special logic needed */ }

  draw(ctx) {
    if (!this.entity || this.entity.currentHealth <= 0) return; // don't draw if dead

    let ratio = Math.max(0, this.entity.currentHealth / this.entity.maxHealth);
    ctx.fillStyle = ratio < 0.2 ? "Red" : ratio < 0.5 ? "Yellow" : "Green";
    ctx.fillRect(
      this.entity.x + this.offsetX,
      this.entity.y + this.offsetY,
      this.width * ratio,
      this.height
    );
    ctx.strokeStyle = "Black";
    ctx.strokeRect(
      this.entity.x + this.offsetX,
      this.entity.y + this.offsetY,
      this.width,
      this.height
    );
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
    this.facing = 0;
    this.state = 0;  
    this.attacks = 0; 
    this.dead = false;

    this.currentHealth = 100;
    this.maxHealth = 100;
    this.healthBar = new HealthBar(this);

    this.spritesheet = ASSET_MANAGER.getAsset("./Megaman sprite.png");

    // A 3D array for animations: [state][facing][attackType]
    this.animations = [];
    this.loadAnimations(this.spritesheet);
  }

  loadAnimations(spritesheet) {
    for (let i = 0; i < 2; i++) {
      this.animations.push([]);
      for (let j = 0; j < 2; j++) {
        this.animations[i][j] = [];
        for (let k = 0; k < 2; k++) {
          this.animations[i][j].push(null);
        }
      }
    }
    // Idle (0), facing left (0), no attack (0)
    this.animations[0][0][0] = new Animator(spritesheet, 70, 61, 35, 30, 2, 0.4, 0, false, true);
    // Idle (0), facing right (1), no attack (0)
    this.animations[0][1][0] = new Animator(spritesheet, 0, 61, 32, 30, 2, 0.4, 0, false, true);

    // Walking (1), facing left (0)
    this.animations[1][0][0] = new Animator(spritesheet, 0, 31, 35, 30, 4, 0.4, 0, false, true);
    // Walking (1), facing right (1)
    this.animations[1][1][0] = new Animator(spritesheet, 0, 0, 35, 30, 4, 0.4, 0, false, true);

    // Melee Attack animations
    this.animations[0][0][1] = new Animator(spritesheet, 0, 151, 35, 30, 4, 0.2, 0, false, true); // left idle melee
    this.animations[0][1][1] = new Animator(spritesheet, 0, 91, 35, 30, 4, 0.2, 0, false, true);  // right idle melee
    this.animations[1][0][1] = new Animator(spritesheet, 0, 151, 35, 30, 4, 0.2, 0, false, true); // left walk melee
    this.animations[1][1][1] = new Animator(spritesheet, 0, 91, 35, 30, 4, 0.2, 0, false, true);  // right walk melee
  }

  meleeAttack() {
    const attackRadius = 50;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    // Default to 20 if nothing set
    let dmg = this.meleeAttackDamage || 20; 
  
    this.game.monsters.forEach(monster => {
      const mx = monster.x + monster.width / 2;
      const my = monster.y + monster.height / 2;
      const dx = mx - centerX;
      const dy = my - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < attackRadius) {
        monster.takeDamage(dmg);
        console.log(`Hit monster for ${dmg} damage!`);
      }
    });
  }
  

  update() {
    // // Movement states
    // if (this.game.keys.left && !this.game.keys.right) {
    //   this.state = 1;
    //   this.facing = 0;
    // } else if (this.game.keys.right && !this.game.keys.left) {
    //   this.state = 1;
    //   this.facing = 1;
    // } else {
    //   this.state = 0;
    // }

    // // Attack
    // if (this.game.keys.melee) {
    //   this.attacks = 1;
    //   this.meleeAttack();
    // } else {
    //   this.attacks = 0;
    // }
    let moving = false;

    if (this.game.keys.melee) {
        this.state = 1;
        this.attacks = 1;
        moving = true;
    } else if (this.game.keys.shoot) {
        this.state = 1;
        this.attacks = 2;
        moving = true;
    }

    else if (this.game.keys.left && this.game.keys.right && this.game.keys.up) {
        this.state = 1;
        this.facing = 0;
        this.attacks = 0;
        moving = true;
    } else if (this.game.keys.left && this.game.keys.right && this.game.keys.down) {
        this.state = 1;
        this.facing = 1;
        this.attacks = 0;
        moving = true;
    } else if (this.game.keys.up && this.game.keys.down && this.game.keys.right) {
        this.state = 1;
        this.facing = 1;
        this.attacks = 0;
        moving = true;
    } else if (this.game.keys.up && this.game.keys.down && this.game.keys.left) {
        this.state = 1;
        this.facing = 0;
        this.attacks = 0;
        moving = true;
    } 
    
    else if (this.game.keys.up && this.game.keys.down) {
        this.state = 0;
        this.attacks = 0;
    } else if (this.game.keys.left && this.game.keys.right) {
        this.state = 0;
        this.attacks = 0;
    } else if (this.game.keys.up && this.game.keys.down && this.game.keys.left && this.game.keys.right) {
        this.state = 0;
        this.attacks = 0;
        moving = false;
    }
    
    else if (this.game.keys.left && !this.game.keys.right) {
        this.state = 1;
        this.facing = 0;
        this.attacks = 0;
        moving = true;
    } else if (this.game.keys.right && !this.game.keys.left) {
        this.state = 1;
        this.facing = 1;
        this.attacks = 0;
        moving = true;
    } else if (this.game.keys.up && !this.game.keys.down) {
        this.state = 1;
        this.attacks = 0;
        moving = true;
    } else if (this.game.keys.down && !this.game.keys.up) {
        this.state = 1;
        this.attacks = 0;
        moving = true;
    }

    if (!moving) {
      this.state = 0;
      this.attacks = 0;
    }



    if (this.healthBar) this.healthBar.update();
  }

  draw(ctx) {
    const anim = this.animations[this.state][this.facing][this.attacks];
    if (anim) {
      anim.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    }
    if (this.healthBar) this.healthBar.draw(ctx);
  }
}

// Expose globally
window.HealthBar = HealthBar;
window.Tank = Tank;
