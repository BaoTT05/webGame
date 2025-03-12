// goblin.js
class Goblin extends Monster {
  /**
   * @param {Game}  game
   * @param {number} x
   * @param {number} y
   * @param {boolean} isLeader
   */
  constructor(game, x, y, isLeader = false) {
      // isLeader => bigger stats
      if (isLeader) {
          super(game, x, y, 28, 28, 60, 80, 15);
          this.spritesheet = ASSET_MANAGER.getAsset("./goblinLeader.png");
          this.isLeader = true;
      } else {
          super(game, x, y, 24, 24, 50, 50, 10);
          this.spritesheet = ASSET_MANAGER.getAsset("./goblin.png");
          this.isLeader = false;
      }

      // Just like Slime, define a random direction for roaming
      this.dir = {
          x: Math.random() < 0.5 ? -1 : 1,
          y: Math.random() < 0.5 ? -1 : 1
      };
      this.changeDirTimer = 2 + Math.random() * 3;
      this.chaseRadius = 250;
      this.chaseSpeedMultiplier = 1.5;
      this.visualScaleFactor = 2.0; // for drawing the sprite bigger
      this.groupLeader = null;

      this.loadAnimations();
  }

  loadAnimations() {
      // we keep the same approach for walkLeft, walkRight
      const frameW = this.isLeader ? 210 : 170;
      const frameH = this.isLeader ? 115 : 88;
      const frameCount = 5;
      const frameDuration = 0.15;

      this.animations = {
          walkLeft: new Animator(
              this.spritesheet,
              0,
              this.isLeader ? 350 : 190,
              frameW,
              frameH,
              frameCount,
              frameDuration,
              0,
              true,
              true
          ),
          walkRight: new Animator(
              this.spritesheet,
              0,
              this.isLeader ? 465 : 278,
              frameW,
              frameH,
              frameCount,
              frameDuration,
              0,
              true,
              true
          )
      };
  }

  update(deltaTime) {
      // pick a new random roam direction every few seconds
      this.changeDirTimer -= deltaTime;
      if (this.changeDirTimer <= 0) {
          this.dir.x = Math.random() < 0.5 ? -1 : 1;
          this.dir.y = Math.random() < 0.5 ? -1 : 1;
          this.changeDirTimer = 2 + Math.random() * 3;
      }

      // chase if player is close
      const player = this.game.activeHero;
      if (player) {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (this.isLeader && dist < this.chaseRadius) {
              // leader always chases if within radius
              this.doChase(dx, dy, dist, deltaTime);
          } else if (!this.isLeader && this.groupLeader) {
              // if part of a group, follow leader or chase player
              this.updateFollower(dx, dy, dist, deltaTime);
          } else {
              // normal goblin: chase if in range, else roam
              if (dist < this.chaseRadius) {
                  this.doChase(dx, dy, dist, deltaTime);
              } else {
                  this.doRandomMove(deltaTime);
              }
          }
      } else {
          // no player => just roam
          this.doRandomMove(deltaTime);
      }

      super.update(deltaTime);
      this.dealDamageToPlayer(deltaTime);
  }

  updateFollower(dxToPlayer, dyToPlayer, distToPlayer, deltaTime) {
      // distance to leader
      const dxLead = this.groupLeader.x - this.x;
      const dyLead = this.groupLeader.y - this.y;
      const distLead = Math.sqrt(dxLead * dxLead + dyLead * dyLead);

      // if too far from leader, move closer
      if (distLead > 80) {
          this.doChase(dxLead, dyLead, distLead, deltaTime);
      }
      // else if player is near, chase player
      else if (distToPlayer < this.chaseRadius) {
          this.doChase(dxToPlayer, dyToPlayer, distToPlayer, deltaTime);
      }
      else {
          // otherwise roam
          this.doRandomMove(deltaTime);
      }
  }

  doRandomMove(deltaTime) {
      let roamSpeed = this.speed * 0.5;
      let stepX = this.dir.x * roamSpeed * deltaTime;
      let stepY = this.dir.y * roamSpeed * deltaTime;

      // set facing
      if (stepX < 0) this.facing = 0;
      else if (stepX > 0) this.facing = 1;

      // move horizontally if no wall
      let newX = this.x + stepX;
      if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
          this.x = newX;
      }

      // move vertically if no wall
      let newY = this.y + stepY;
      if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
          this.y = newY;
      }
  }

  doChase(dx, dy, dist, deltaTime) {
      const chaseSpeed = this.speed * this.chaseSpeedMultiplier;
      let stepX = (dx / dist) * chaseSpeed * deltaTime;
      let stepY = (dy / dist) * chaseSpeed * deltaTime;

      // set facing
      if (stepX < 0) this.facing = 0;
      else if (stepX > 0) this.facing = 1;

      // move horizontally
      let newX = this.x + stepX;
      if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
          this.x = newX;
      }
      // move vertically
      let newY = this.y + stepY;
      if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
          this.y = newY;
      }
  }

  draw(ctx) {
      let anim = (this.facing === 0) ? this.animations.walkLeft : this.animations.walkRight;
      if (!anim) {
          // fallback
          ctx.fillStyle = this.isLeader ? "red" : "green";
          ctx.fillRect(this.x, this.y, this.width, this.height);
      } else {
          const frameW = this.isLeader ? 210 : 170;
          const frameH = this.isLeader ? 115 : 88;
          const baseScale = this.width / frameW;
          const finalScale = baseScale * this.visualScaleFactor;

          const scaledW = frameW * finalScale;
          const scaledH = frameH * finalScale;
          let offsetX = (this.width - scaledW) / 2;
          let offsetY = this.height - scaledH;

          let drawX = this.x + offsetX;
          let drawY = this.y + offsetY;

          anim.drawFrame(this.game.clockTick, ctx, drawX, drawY, finalScale);
      }

      // simple HP bar
      const hpRatio = Math.max(0, this.currentHealth / this.maxHealth);
      ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y - 6, this.width * hpRatio, 4);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 6, this.width, 4);
  }
}
window.Goblin = Goblin;
