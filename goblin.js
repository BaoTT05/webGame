/**
 * Goblin.js
 * Updated to:
 *  - Use separate-axis movement (so Goblin is less likely to get stuck).
 *  - Floor final x,y to remove sub-pixel jitter.
 *  - Swap the row offsets to ensure left is truly the 'walkLeft' row.
 *  - Face left if dx < 0, face right if dx > 0.
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
    this.chaseRadius = 250;
    this.minLeaderDistance = 50;

    // Facing: 0 = left, 1 = right
    this.facing = 1;

    // For storing separate walk-left / walk-right animators
    this.animations = {
      walkLeft: null,
      walkRight: null,
    };

    // Visual scale factor
    this.visualScaleFactor = 2.0;
    this.loadAnimations();
  }

  loadAnimations() {
    if (this.isLeader) {
      // Leader frames: 210×115 each, 5 frames
      // We'll keep the same row offsets, but we do separate left vs. right
      const frameW = 210;
      const frameH = 115;
      const frameCount = 5;
      const frameDuration = 0.15;

      // If your sheet is truly left anim at y=350, right at y=465, keep as is:
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
      // Normal goblin frames: 160×88 each, 5 frames
      // If you discovered the original row was reversed, swap them:
      //   walkLeft => y=190
      //   walkRight => y=278
      // If in your sprite sheet it's the other way, just invert them again.
      const frameW = 170;
      const frameH = 88;
      const frameCount = 5;
      const frameDuration = 0.15;

      this.animations.walkLeft = new Animator(
        this.spritesheet,
        0,
        190, // swapped so we definitely see left
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

    // If we have a leader/follower arrangement or a chase radius:
    if (!player) {
      // No player => just roam
      this.roam(deltaTime);
    } else {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (this.isLeader) {
        if (dist < this.chaseRadius) {
          this.chase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      } else if (this.groupLeader) {
        // follower logic
        const dxLead = this.groupLeader.x - this.x;
        const dyLead = this.groupLeader.y - this.y;
        const distLead = Math.sqrt(dxLead * dxLead + dyLead * dyLead);
        if (distLead > this.minLeaderDistance) {
          this.chase(this.groupLeader.x, this.groupLeader.y, deltaTime);
        } else {
          // If near the leader but player is close, chase player
          if (dist < this.chaseRadius) {
            this.chase(player.x, player.y, deltaTime);
          } else {
            this.roam(deltaTime);
          }
        }
      } else {
        // normal goblin (no leader)
        if (dist < this.chaseRadius) {
          this.chase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      }
    }

    // Base update
    super.update(deltaTime);

    // Check collision with player => deal damage
    this.dealDamageToPlayer(deltaTime);
  }

  /**
   *  Roam with a random direction. Move each axis separately.
   *  If collision blocks movement on an axis, invert that axis direction.
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

    // Floor the final positions => prevents sub-pixel “jitter”
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
   *  Chase the given (targetX, targetY). Move horizontally first, then vertically.
   */
  chase(targetX, targetY, deltaTime) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Speed in each axis
    let stepX = (dx / dist) * this.speed * deltaTime;
    let stepY = (dy / dist) * this.speed * deltaTime;

    if (stepX < 0) this.facing = 0;
    else if (stepX > 0) this.facing = 1;

    // Move horizontally
    let newX = this.x + stepX;
    if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
      this.x = newX;
    }
    // Move vertically
    let newY = this.y + stepY;
    if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
      this.y = newY;
    }

    // Floor positions
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
      let frameW = this.isLeader ? 210 : 160;
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
