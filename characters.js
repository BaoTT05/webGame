// characters.js

// --- HealthBar Class (Unchanged) ---
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

    // Directions: 0=left, 1=right
    this.facing = 0;
    // States: 0=idle, 1=walking
    this.state = 0;
    // Attacks: 0=none, 1=melee, 2=shoot
    this.attacks = 0;

    this.dead = false;
    this.currentHealth = 100;
    this.maxHealth = 100;
    this.healthBar = new HealthBar(this);

    // 1-second cooldown for the beam
    this.beamCooldown = 0;

    this.spritesheet = ASSET_MANAGER.getAsset("./Megaman sprite.png");
    this.animations = []; // 3D array: [state][facing][attack]

    this.loadAnimations(this.spritesheet);
  }

  loadAnimations(spritesheet) {
    // 2 states × 2 facing × 3 attackTypes
    for (let i = 0; i < 2; i++) {
      this.animations.push([]);
      for (let j = 0; j < 2; j++) {
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

    // Walking (1), facing left (0), no attack (0)
    this.animations[1][0][0] = new Animator(spritesheet, 0, 31, 35, 30, 4, 0.4, 0, false, true);
    // Walking (1), facing right (1), no attack (0)
    this.animations[1][1][0] = new Animator(spritesheet, 0, 0, 35, 30, 4, 0.4, 0, false, true);

    // Melee Attack animations (attackType=1)
    // Set loop=false so we can do "play once"
    this.animations[0][0][1] = new Animator(spritesheet, 0, 151, 35, 30, 4, 0.2, 0, false, false); // left idle
    this.animations[0][1][1] = new Animator(spritesheet, 0, 91, 35, 30, 4, 0.2, 0, false, false);  // right idle
    this.animations[1][0][1] = new Animator(spritesheet, 0, 151, 35, 30, 4, 0.2, 0, false, false); // left walk
    this.animations[1][1][1] = new Animator(spritesheet, 0, 91, 35, 30, 4, 0.2, 0, false, false);  // right walk

    // Shoot Attack animations (attackType=2), also loop=false
    this.animations[0][0][2] = new Animator(spritesheet, 0, 121, 35, 29, 4, 0.1, 0, true, false);  // idle-shoot left
    this.animations[0][1][2] = new Animator(spritesheet, 0, 121, 35, 29, 4, 0.1, 0, false, false); // idle-shoot right
    this.animations[1][0][2] = new Animator(spritesheet, 0, 121, 35, 29, 4, 0.1, 0, true, false);  // walk-shoot left
    this.animations[1][1][2] = new Animator(spritesheet, 0, 121, 35, 29, 4, 0.1, 0, false, false); // walk-shoot right
  }

  /**
   * Called once on pressing melee. We'll do "play once" approach for melee as well.
   */
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
    // Decrement beam cooldown
    if (this.beamCooldown > 0) {
      this.beamCooldown -= this.game.clockTick;
    }

    // 1) If currently shooting, let that animation finish
    if (this.attacks === 2) {
      const animShoot = this.animations[this.state][this.facing][2];
      if (animShoot.isDone()) {
        animShoot.elapsedTime = 0;
        this.attacks = 0;
      }
      // We can still move around
      this.handleMovement();
      if (this.healthBar) this.healthBar.update();
      return;
    }

    // 2) If currently in melee, let that animation finish
    if (this.attacks === 1) {
      const animMelee = this.animations[this.state][this.facing][1];
      if (animMelee.isDone()) {
        animMelee.elapsedTime = 0;
        this.attacks = 0;
      }
      // We can still move around
      this.handleMovement();
      if (this.healthBar) this.healthBar.update();
      return;
    }

    // 3) Not in the middle of an attack => check new inputs
    if (this.game.keys.shoot && this.beamCooldown <= 0) {
      // Decide if we appear “walk-shoot” or “idle-shoot”
      this.state = (this.game.keys.left || this.game.keys.right || this.game.keys.up || this.game.keys.down) ? 1 : 0;
      this.attacks = 2;
      this.animations[this.state][this.facing][2].elapsedTime = 0;
      this.shootBeam();
      this.beamCooldown = 0.25;
    }
    else if (this.game.keys.melee) {
      this.state = 1; 
      this.attacks = 1;
      this.animations[this.state][this.facing][1].elapsedTime = 0;
      this.meleeAttack();
    }
    else {
      // Just move around normally
      this.handleMovement();
    }

    if (this.healthBar) this.healthBar.update();
  }

  handleMovement() {
    let moving = false;

    // EXACT same movement checks as before,
    // but only set attacks=0 if not in the middle of an attack (2=shoot, 1=melee).
    if (this.game.keys.left && this.game.keys.right && this.game.keys.up) {
      this.state = 1;
      this.facing = 0;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = true;
    } else if (this.game.keys.left && this.game.keys.right && this.game.keys.down) {
      this.state = 1;
      this.facing = 1;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = true;
    } else if (this.game.keys.up && this.game.keys.down && this.game.keys.right) {
      this.state = 1;
      this.facing = 1;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = true;
    } else if (this.game.keys.up && this.game.keys.down && this.game.keys.left) {
      this.state = 1;
      this.facing = 0;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = true;
    } else if (this.game.keys.up && this.game.keys.down) {
      this.state = 0;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
    } else if (this.game.keys.left && this.game.keys.right) {
      this.state = 0;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
    } else if (this.game.keys.up && this.game.keys.down && this.game.keys.left && this.game.keys.right) {
      this.state = 0;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = false;
    } else if (this.game.keys.left && !this.game.keys.right) {
      this.state = 1;
      this.facing = 0;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = true;
    } else if (this.game.keys.right && !this.game.keys.left) {
      this.state = 1;
      this.facing = 1;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = true;
    } else if (this.game.keys.up && !this.game.keys.down) {
      this.state = 1;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = true;
    } else if (this.game.keys.down && !this.game.keys.up) {
      this.state = 1;
      if (this.attacks !== 2 && this.attacks !== 1) this.attacks = 0;
      moving = true;
    }

    if (!moving) {
      this.state = 0;
      if (this.attacks !== 2 && this.attacks !== 1) {
        this.attacks = 0;
      }
    }
  }

  draw(ctx) {
    const anim = this.animations[this.state][this.facing][this.attacks];
    if (!anim) {
      // Fallback if something's missing
      ctx.fillStyle = "blue";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      if (this.healthBar) this.healthBar.draw(ctx);
      return;
    }

    // Mirror the sprite ONLY if shooting left
    if (this.attacks === 2 && this.facing === 0) {
      ctx.save();
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(-1, 1);
      ctx.translate(-centerX, -centerY);

      anim.drawFrame(this.game.clockTick, ctx, this.x, this.y);
      ctx.restore();
    } else {
      // Normal draw for everything else
      anim.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    }

    if (this.healthBar) this.healthBar.draw(ctx);
  }
}

// Expose Tank globally
window.Tank = Tank;
