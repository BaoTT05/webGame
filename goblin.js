class Goblin extends Monster {
  /**
   * @param {Game}  game       Main game reference
   * @param {number} x         Spawn X
   * @param {number} y         Spawn Y
   * @param {boolean} isLeader True = bigger stats & leader sprite
   */
  constructor(game, x, y, isLeader = false) {
    if (isLeader) {
      super(game, x, y, 28, 28, 60, 80, 15);
      this.spritesheet = ASSET_MANAGER.getAsset("./goblinLeader.png");
      this.isLeader = true;
    } else {
      super(game, x, y, 24, 24, 50, 50, 10);
      this.spritesheet = ASSET_MANAGER.getAsset("./goblin.png");
      this.isLeader = false;
    }

    this.groupLeader = null;
    this.roamDir = { x: 0, y: 0 };
    this.roamTimer = 0;
    this.chaseRadius = 250;
    this.minLeaderDistance = 50;
    this.facing = 1;
    this.animations = { walkLeft: null, walkRight: null };
    this.chaseSpeedMultiplier = 1.5;
    this.visualScaleFactor = 2.0;
    this.loadAnimations();
  }

  loadAnimations() {
    const frameW = this.isLeader ? 210 : 170;
    const frameH = this.isLeader ? 115 : 88;
    const frameCount = 5;
    const frameDuration = 0.15;

    this.animations.walkLeft = new Animator(
      this.spritesheet,
      0,
      this.isLeader ? 350 : 190,
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
      this.isLeader ? 465 : 278,
      frameW,
      frameH,
      frameCount,
      frameDuration,
      0,
      false,
      true
    );
  }

  update(deltaTime) {
    const player = this.game.activeHero;
    if (!player) {
      this.roam(deltaTime);
    } else {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (this.isLeader) {
        if (dist < this.chaseRadius) {
          this.doSlimeStyleChase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      } else if (this.groupLeader) {
        const dxLead = this.groupLeader.x - this.x;
        const dyLead = this.groupLeader.y - this.y;
        const distLead = Math.sqrt(dxLead * dxLead + dyLead * dyLead);

        if (distLead > this.minLeaderDistance) {
          this.doSlimeStyleChase(this.groupLeader.x, this.groupLeader.y, deltaTime);
        } else if (dist < this.chaseRadius) {
          this.doSlimeStyleChase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      } else {
        if (dist < this.chaseRadius) {
          this.doSlimeStyleChase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      }
    }

    super.update(deltaTime);
    this.dealDamageToPlayer(deltaTime);
  }

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
      // If stuck, try moving vertically or change direction
      this.roamDir.x = -this.roamDir.x;  // Invert horizontal roam
    }

    // Move vertically
    let stepY = this.roamDir.y * roamSpeed * deltaTime;
    let newY = this.y + stepY;
    if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
      this.y = newY;
    } else {
      // If stuck, try moving horizontally or change direction
      this.roamDir.y = -this.roamDir.y;  // Invert vertical roam
    }

    // Apply flooring to prevent sub-pixel stutter
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

  doSlimeStyleChase(targetX, targetY, deltaTime) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return; // Already on top of target?

    const chaseSpeed = this.speed * this.chaseSpeedMultiplier;

    let stepX = (dx / dist) * chaseSpeed * deltaTime;
    let stepY = (dy / dist) * chaseSpeed * deltaTime;

    if (stepX < 0) this.facing = 0;
    else if (stepX > 0) this.facing = 1;

    let newX = this.x + stepX;
    let newY = this.y + stepY;

    // Check both horizontal and vertical before moving
    if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
      this.x = newX;
    } else {
      // Try adjusting position to avoid getting stuck at the corner
      let adjustedX = this.x + (stepX * 0.5);
      if (!this.game.hitsWall(adjustedX, this.y, this.width, this.height)) {
        this.x = adjustedX;
      }
    }

    if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
      this.y = newY;
    } else {
      // Try adjusting vertical movement
      let adjustedY = this.y + (stepY * 0.5);
      if (!this.game.hitsWall(this.x, adjustedY, this.width, this.height)) {
        this.y = adjustedY;
      }
    }

    // Apply flooring to prevent sub-pixel stutter
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
  }

  draw(ctx) {
    let anim = this.facing === 0 ? this.animations.walkLeft : this.animations.walkRight;

    if (!anim) {
      ctx.fillStyle = this.isLeader ? "red" : "green";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else {
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

   // if (PARAMS && PARAMS.DEBUG) {
   //   ctx.strokeStyle = "lime";
    //  ctx.strokeRect(this.x, this.y, this.width, this.height);
  //  }

    const hpRatio = Math.max(0, this.currentHealth / this.maxHealth);
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 6, this.width * hpRatio, 4);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x, this.y - 6, this.width, 4);
  }
}

window.Goblin = Goblin;
