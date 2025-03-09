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
    this.speed = 3;
    this.facing = 0; // 0=left, 1=right
    this.state = 0;  // 0=idle, 1=walking
    this.attacks = 0; // 0=none, 1=melee, 2=shoot
    this.dead = false;

    this.currentHealth = 100;
    this.maxHealth = 100;
    this.healthBar = new HealthBar(this);

    // === 1-second cooldown for the beam ===
    this.beamCooldown = 0;

    this.spritesheet = ASSET_MANAGER.getAsset("./Megaman sprite.png");

    // A 3D array for animations: [state][facing][attackType]
    this.animations = [];
    this.loadAnimations(this.spritesheet);
  }

  loadAnimations(spritesheet) {
    // We now have 3 attackTypes: 0=none, 1=melee, 2=shoot
    for (let i = 0; i < 2; i++) { // 2 states: 0=idle, 1=walk
      this.animations.push([]);
      for (let j = 0; j < 2; j++) { // 2 facing: 0=left, 1=right
        this.animations[i][j] = [];
        for (let k = 0; k < 3; k++) {
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

    // Melee Attack animations (attackType=1)
    this.animations[0][0][1] = new Animator(spritesheet, 0, 151, 35, 30, 4, 0.2, 0, false, true); // left idle
    this.animations[0][1][1] = new Animator(spritesheet, 0, 91, 35, 30, 4, 0.2, 0, false, true);  // right idle
    this.animations[1][0][1] = new Animator(spritesheet, 0, 151, 35, 30, 4, 0.2, 0, false, true); // left walk
    this.animations[1][1][1] = new Animator(spritesheet, 0, 91, 35, 30, 4, 0.2, 0, false, true);  // right walk

    // Shoot Attack animations (attackType=2)
    this.animations[0][0][2] = new Animator(spritesheet, 0, 121, 36, 29, 4, 0.1, 0, true, false);  // idle-shoot left
    this.animations[0][1][2] = new Animator(spritesheet, 0, 121, 36, 29, 4, 0.1, 0, false, false); // idle-shoot right
    this.animations[1][0][2] = new Animator(spritesheet, 0, 121, 36, 29, 4, 0.1, 0, true, false);  // walk-shoot left
    this.animations[1][1][2] = new Animator(spritesheet, 0, 121, 36, 29, 4, 0.1, 0, false, false); // walk-shoot right

    // ^ Notice the last parameter for “loop” is set to false for shooting
  }

  meleeAttack() {
    const attackRadius = 50;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
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

  // Spawns a beam from tank’s front
  shootBeam() {
    let spawnX = (this.facing === 1) ? (this.x + this.width) : (this.x - 10);
    let spawnY = this.y + this.height / 2;
    this.game.projectiles.push(new Beam(this.game, spawnX, spawnY, this.facing));
  }

  update() {
    // Decrement cooldown each frame
    if (this.beamCooldown > 0) {
      this.beamCooldown -= this.game.clockTick;
    }

    // ==============================
    // 1) If we are in shooting state (attacks=2), let the animation finish
    // ==============================
    if (this.attacks === 2) {
      const anim = this.animations[this.state][this.facing][2];
      // If the animation is done playing all frames...
      if (anim.isDone()) {
        // Reset it so next time we start from frame 0
        anim.elapsedTime = 0;
        // Return to no attack
        this.attacks = 0;
      }
      // We can still move around if we want:
      this.handleMovement();
      // Then exit update (so we don't override attacks=2 below).
      if (this.healthBar) this.healthBar.update();
      return;
    }

    // =================================
    // 2) Otherwise, check if we can shoot now
    // =================================
    if (this.game.keys.shoot && this.beamCooldown <= 0) {
      // Decide if you want to allow walking-shoot or idle-shoot
      // We'll set this.state to 1 if we want a "walk-shoot" row, 
      // or 0 if we want "idle-shoot." For example:
      // If any arrow key is pressed, we say walk; else idle:
      this.state = (this.game.keys.left || this.game.keys.right || this.game.keys.up || this.game.keys.down) ? 1 : 0;

      // Start shooting
      this.attacks = 2;
      // Force the shooting animation to begin at frame 0:
      this.animations[this.state][this.facing][2].elapsedTime = 0;

      // Fire the beam
      this.shootBeam();
      // 1-second cooldown
      this.beamCooldown = 1;

      // We continue on, letting the user move if desired
      // We'll not revert to idle until the animation is done in the block above
    }
    // ===================================
    // 3) If not shooting, check melee, movement, idle, etc.
    // ===================================
    else if (this.game.keys.melee) {
      // Decide if you can override movement with melee, or do you want partial movement?
      // For simplicity:
      this.state = 1;
      this.attacks = 1;
      this.meleeAttack();
    } else {
      // If no shoot or melee, handle normal movement
      this.handleMovement();
    }

    if (this.healthBar) this.healthBar.update();
  }

  /**
   * A helper so you can continue moving even if you’re in a shooting or melee state.
   * Right now, we only call this if we’re not in the middle of a single uninterruptible animation (attacks=2).
   * If you want to allow movement while shooting, call handleMovement() in the shooting block too.
   */
  handleMovement() {
    let moving = false;

    // This is your existing movement logic:
    if (this.game.keys.left && this.game.keys.right && this.game.keys.up) {
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
    } else if (this.game.keys.up && this.game.keys.down) {
      this.state = 0;
      this.attacks = 0;
    } else if (this.game.keys.left && this.game.keys.right) {
      this.state = 0;
      this.attacks = 0;
    } else if (this.game.keys.up && this.game.keys.down && this.game.keys.left && this.game.keys.right) {
      this.state = 0;
      this.attacks = 0;
      moving = false;
    } else if (this.game.keys.left && !this.game.keys.right) {
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
      // only set attacks=0 if not shooting or melee
      if (this.attacks !== 2 && this.attacks !== 1) {
        this.attacks = 0;
      }
    }
  }

  draw(ctx) {
    // Grab the correct animator
    const anim = this.animations[this.state][this.facing][this.attacks];
    if (anim) {
      anim.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    } else {
      // fallback if something’s missing
      ctx.fillStyle = "blue";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    if (this.healthBar) this.healthBar.draw(ctx);
  }
}

// Expose Tank globally
window.Tank = Tank;
