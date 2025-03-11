/**
 * Goblin.js
 * Updated to:
 *  - Use the *same chase logic* as Slime:
 *    => (dx / dist) * chaseSpeed, with separate-axis collision checks.
 *  - Keep group logic, but once we decide to chase, we do it the Slime way.
 */

class Goblin extends Monster {
  /**
   * @param {Game}  game       Main game reference
   * @param {number} x         Spawn X
   * @param {number} y         Spawn Y
   * @param {boolean} isLeader True = bigger stats & leader sprite
   */
  constructor(game, x, y, isLeader = false) {
    // 1) bounding box
    if (isLeader) {
      super(game, x, y, /*width=*/28, /*height=*/28, /*speed=*/60, /*maxHealth=*/80, /*damage=*/15);
      this.spritesheet = ASSET_MANAGER.getAsset("./goblinLeader.png");
      this.isLeader = true;
    } else {
      super(game, x, y, 24, 24, 50, 50, 10);
      this.spritesheet = ASSET_MANAGER.getAsset("./goblin.png");
      this.isLeader = false;
    }

    // Group behavior
    this.groupLeader = null; 
    this.roamDir = { x: 0, y: 0 };
    this.roamTimer = 0;

    // Make the chaseRadius a bit smaller or bigger if desired
    this.chaseRadius = 250;
    this.minLeaderDistance = 50;

    // Facing: 0 = left, 1 = right
    this.facing = 1;

    // Animations
    this.animations = {
      walkLeft: null,
      walkRight: null,
    };

    // Just like Slime, if you want them to move faster while chasing, do this multiplier
    this.chaseSpeedMultiplier = 1.5;

    // Visual scale factor
    this.visualScaleFactor = 2.0;
    this.loadAnimations();
  }

  loadAnimations() {
    if (this.isLeader) {
      // Leader frames: 210×115 each, 5 frames
      const frameW = 210;
      const frameH = 115;
      const frameCount = 5;
      const frameDuration = 0.15;

      this.animations.walkLeft = new Animator(
        this.spritesheet,
        0,
        350,
        frameW,
        frameH,
        frameCount,
        frameDuration,
        0,
        false,
        true
      );
      this.animations.walkRight = new Animator(
        this.spritesheet,
        0,
        465,
        frameW,
        frameH,
        frameCount,
        frameDuration,
        0,
        false,
        true
      );
    } else {
      // Normal goblin frames: 170×88 each, 5 frames
      const frameW = 170;
      const frameH = 88;
      const frameCount = 5;
      const frameDuration = 0.15;

      this.animations.walkLeft = new Animator(
        this.spritesheet,
        0,
        190,
        frameW,
        frameH,
        frameCount,
        frameDuration,
        0,
        false,
        true
      );
      this.animations.walkRight = new Animator(
        this.spritesheet,
        0,
        278,
        frameW,
        frameH,
        frameCount,
        frameDuration,
        0,
        false,
        true
      );
    }
  }

  update(deltaTime) {
    const player = this.game.activeHero;

    if (!player) {
      // No player => just roam
      this.roam(deltaTime);
    } else {
      // Distance to player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Decide if we chase or roam (or follow leader).
      if (this.isLeader) {
        // Leader: If player is within radius => chase, else roam.
        if (dist < this.chaseRadius) {
          this.doSlimeStyleChase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      } else if (this.groupLeader) {
        // Follower: If too far from leader, chase leader
        const dxLead = this.groupLeader.x - this.x;
        const dyLead = this.groupLeader.y - this.y;
        const distLead = Math.sqrt(dxLead * dxLead + dyLead * dyLead);

        if (distLead > this.minLeaderDistance) {
          // chase leader
          this.doSlimeStyleChase(this.groupLeader.x, this.groupLeader.y, deltaTime);
        } else {
          // If close to leader but player is near => chase player
          if (dist < this.chaseRadius) {
            this.doSlimeStyleChase(player.x, player.y, deltaTime);
          } else {
            this.roam(deltaTime);
          }
        }
      } else {
        // Normal goblin: if player is close => chase, else roam
        if (dist < this.chaseRadius) {
          this.doSlimeStyleChase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      }
    }

    // Base monster update (handles collision damage, etc.)
    super.update(deltaTime);
    // Attempt player collision damage
    this.dealDamageToPlayer(deltaTime);
  }

  /**
   * roam() is the same as before: random direction, invert on collisions, etc.
   */
  roam(deltaTime) {
    const roamSpeed = this.speed * 0.5;

    // Move horizontally
    let stepX = this.roamDir.x * roamSpeed * deltaTime;
    if (stepX < 0) this.facing = 0;
    else if (stepX > 0) this.facing = 1;

    let newX = this.x + stepX;
    if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
      this.x = newX;
    } else {
      // invert horizontal roam
      this.roamDir.x = -this.roamDir.x;
    }

    // Move vertically
    let stepY = this.roamDir.y * roamSpeed * deltaTime;
    let newY = this.y + stepY;
    if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
      this.y = newY;
    } else {
      // invert vertical roam
      this.roamDir.y = -this.roamDir.y;
    }

    // Floor
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);

    // Countdown roam timer
    this.roamTimer -= deltaTime;
    if (this.roamTimer <= 0) {
      this.roamDir.x = Math.random() < 0.5 ? -1 : 1;
      this.roamDir.y = Math.random() < 0.5 ? -1 : 1;
      this.roamTimer = 2 + Math.random() * 3;
    }
  }

  /**
   * doSlimeStyleChase(targetX, targetY, deltaTime)
   * 
   * Exactly like Slime: we compute dx/dy to target,
   * if close enough to matter, we move horizontally then vertically,
   * using a chaseSpeed possibly bigger than base speed.
   */
  doSlimeStyleChase(targetX, targetY, deltaTime) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return; // Already on top of target?

    // Slime uses speed * 1.5 for chasing. We do the same:
    const chaseSpeed = this.speed * this.chaseSpeedMultiplier;

    // Normalized direction
    let stepX = (dx / dist) * chaseSpeed * deltaTime;
    let stepY = (dy / dist) * chaseSpeed * deltaTime;

    // Decide facing based on horizontal direction
    if (stepX < 0) this.facing = 0;
    else if (stepX > 0) this.facing = 1;

    // First do horizontal
    let newX = this.x + stepX;
    if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
      this.x = newX;
    }

    // Then do vertical
    let newY = this.y + stepY;
    if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
      this.y = newY;
    }

    // Floor
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
  }

  draw(ctx) {
    // Pick left or right animation
    let anim =
      this.facing === 0
        ? this.animations.walkLeft
        : this.animations.walkRight;

    if (!anim) {
      // fallback
      ctx.fillStyle = this.isLeader ? "red" : "green";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else {
      // We'll scale the sprite
      let frameW = this.isLeader ? 210 : 170;
      let frameH = this.isLeader ? 115 : 88;

      let baseScale = this.width / frameW;
      let finalScale = baseScale * this.visualScaleFactor;

      const scaledW = frameW * finalScale;
      const scaledH = frameH * finalScale;
      let offsetX = (this.width - scaledW) / 2;
      let offsetY = this.height - scaledH;

      let drawX = this.x + offsetX;
      let drawY = this.y + offsetY;

      anim.drawFrame(this.game.clockTick, ctx, drawX, drawY, finalScale);
    }

    // Optional bounding box debug
    if (PARAMS && PARAMS.DEBUG) {
      ctx.strokeStyle = "lime";
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    // Simple HP bar
    const hpRatio = Math.max(0, this.currentHealth / this.maxHealth);
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 6, this.width * hpRatio, 4);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x, this.y - 6, this.width, 4);
  }
}

window.Goblin = Goblin;
