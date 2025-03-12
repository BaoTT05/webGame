class Goblin extends Monster {
    /**
     * @param {Game}  game
     * @param {number} x
     * @param {number} y
     * @param {boolean} isLeader  (true => bigger stats/sprite)
     */
    constructor(game, x, y, isLeader = false) {
      // Larger stats if leader
      if (isLeader) {
        // width=28, height=28, speed=60, maxHealth=80, damage=15
        super(game, x, y, 28, 28, 60, 80, 15);
        this.spritesheet = ASSET_MANAGER.getAsset("./goblinLeader.png");
        this.isLeader = true;
      } else {
        // width=24, height=24, speed=50, maxHealth=50, damage=10
        super(game, x, y, 24, 24, 50, 50, 10);
        this.spritesheet = ASSET_MANAGER.getAsset("./goblin.png");
        this.isLeader = false;
      }
  
      // We'll hold only a single "walk-right" animator
      this.walkAnimator = null;
  
      // For random roam:
      this.dir = {
        x: Math.random() < 0.5 ? -1 : 1,
        y: Math.random() < 0.5 ? -1 : 1,
      };
      this.changeDirTimer = 2 + Math.random() * 3; 
      this.chaseRadius = 250;
      this.chaseSpeedMultiplier = 1.5;
  
      // We’ll enlarge the sprite at draw-time
      this.visualScaleFactor = 2.0;
  
      // Facing: 0=left, 1=right
      // We'll set it dynamically in movement logic
      this.facing = 1;
  
      // If this goblin has a "groupLeader", it will follow them
      this.groupLeader = null;
  
      this.loadAnimations();
    }
  
    loadAnimations() {
      // Base frame sizes differ if isLeader
      const frameW = this.isLeader ? 210 : 170;
      const frameH = this.isLeader ? 115 : 88;
      // The row for "walk-right" in your sheet:
      //  - Normal goblins: y=278
      //  - Leader goblins: y=465
      // (Adjust these if your spritesheet is arranged differently.)
      const rowY = this.isLeader ? 465 : 278;
  
      // 5 frames, each ~0.15 seconds => loop
      this.walkAnimator = new Animator(
        this.spritesheet,
        0,           // xStart
        rowY,        // yStart
        frameW,      // width
        frameH,      // height
        5,           // frameCount
        0.15,        // frameDuration
        0,           // framePadding
        false,       // reverse
        true         // loop
      );
    }
  
    update(deltaTime) {
      // Periodically pick a new random roam direction
      this.changeDirTimer -= deltaTime;
      if (this.changeDirTimer <= 0) {
        this.dir.x = Math.random() < 0.5 ? -1 : 1;
        this.dir.y = Math.random() < 0.5 ? -1 : 1;
        this.changeDirTimer = 2 + Math.random() * 3;
      }
  
      // Decide: chase or random move
      const player = this.game.activeHero;
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
  
        if (this.isLeader && dist < this.chaseRadius) {
          // Leader always chases if close enough
          this.doChase(dx, dy, dist, deltaTime);
        } else if (!this.isLeader && this.groupLeader) {
          // Follower logic
          this.updateFollower(dx, dy, dist, deltaTime);
        } else {
          // Normal goblin: chase if in range, else roam
          if (dist < this.chaseRadius) {
            this.doChase(dx, dy, dist, deltaTime);
          } else {
            this.doRandomMove(deltaTime);
          }
        }
      } else {
        // No player => just roam
        this.doRandomMove(deltaTime);
      }
  
      // Base monster updates (e.g. damageTimer)
      super.update(deltaTime);
  
      // If colliding with the hero, try to deal damage
      this.dealDamageToPlayer(deltaTime);
    }
  
    updateFollower(dxToPlayer, dyToPlayer, distToPlayer, deltaTime) {
      // Distance from me to my leader
      const dxLead = this.groupLeader.x - this.x;
      const dyLead = this.groupLeader.y - this.y;
      const distLead = Math.sqrt(dxLead * dxLead + dyLead * dyLead);
  
      // If I'm too far from the leader, move closer
      if (distLead > 80) {
        this.doChase(dxLead, dyLead, distLead, deltaTime);
      }
      // Else if the player is near, chase the player
      else if (distToPlayer < this.chaseRadius) {
        this.doChase(dxToPlayer, dyToPlayer, distToPlayer, deltaTime);
      }
      // Otherwise roam randomly
      else {
        this.doRandomMove(deltaTime);
      }
    }
  
    doRandomMove(deltaTime) {
      // Move half-speed in the chosen random direction
      const roamSpeed = this.speed * 0.5;
      const stepX = this.dir.x * roamSpeed * deltaTime;
      const stepY = this.dir.y * roamSpeed * deltaTime;
  
      // Update facing (0=left if stepX < 0, else 1=right)
      if (stepX < 0) this.facing = 0;
      else if (stepX > 0) this.facing = 1;
  
      // Attempt horizontal move
      const newX = this.x + stepX;
      if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
        this.x = newX;
      }
  
      // Attempt vertical move
      const newY = this.y + stepY;
      if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
        this.y = newY;
      }
    }
  
    doChase(dx, dy, dist, deltaTime) {
      // Move faster while chasing
      const chaseSpeed = this.speed * this.chaseSpeedMultiplier;
      const stepX = (dx / dist) * chaseSpeed * deltaTime;
      const stepY = (dy / dist) * chaseSpeed * deltaTime;
  
      // Facing
      if (stepX < 0) this.facing = 0;
      else if (stepX > 0) this.facing = 1;
  
      // Horizontal
      const newX = this.x + stepX;
      if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
        this.x = newX;
      }
  
      // Vertical
      const newY = this.y + stepY;
      if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
        this.y = newY;
      }
    }
  
    draw(ctx) {
      // We'll always use the "walk-right" row from sprites
      // If facing=0 => flip horizontally
  
      // Base frame sizes
      const frameW = this.isLeader ? 210 : 170;
      const frameH = this.isLeader ? 115 : 88;
      const anim = this.walkAnimator;
      if (!anim) return; // fallback if somehow null
  
      // Scale the sprite
      const baseScale = this.width / frameW;
      const finalScale = baseScale * this.visualScaleFactor;
  
      const scaledW = frameW * finalScale;
      const scaledH = frameH * finalScale;
  
      // Offset so the sprite's feet align with the goblin's (x,y) position
      const offsetX = (this.width - scaledW) / 2;
      const offsetY = this.height - scaledH;
  
      const drawX = this.x + offsetX;
      const drawY = this.y + offsetY;
  
      // === If facing left, flip horizontally ===
      if (this.facing === 0) {
        ctx.save();
        // Translate to the center of the sprite
        const centerX = drawX + scaledW / 2;
        const centerY = drawY + scaledH / 2;
        ctx.translate(centerX, centerY);
        // Flip horizontally
        ctx.scale(-1, 1);
        // Translate back
        ctx.translate(-centerX, -centerY);
  
        // Draw using the same "walk-right" row, but mirrored
        anim.drawFrame(this.game.clockTick, ctx, drawX, drawY, finalScale);
  
        ctx.restore();
      } else {
        // Facing right => draw normally
        anim.drawFrame(this.game.clockTick, ctx, drawX, drawY, finalScale);
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
  