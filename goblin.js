// goblin.js
class Goblin extends Monster {
  constructor(game, x, y, isLeader = false) {
    if (isLeader) {
      // Leader slightly bigger, but <= 32 so it can move.
      super(game, x, y, 28, 28, 60, 80, 15); 
      this.isLeader = true;
    } else {
      // Normal goblin smaller, e.g. 24×24
      super(game, x, y, 24, 24, 50, 50, 10);
      this.isLeader = false;
    }

    this.groupLeader = null;
    this.roamDir = { x: 0, y: 0 };
    this.roamTimer = 0;

    this.chaseRadius = 250;
    this.minLeaderDistance = 50;
  }

  update(deltaTime) {
    // Random roaming direction timer
    this.roamTimer -= deltaTime;
    if (this.roamTimer <= 0) {
      this.roamDir.x = Math.random() < 0.5 ? -1 : 1;
      this.roamDir.y = Math.random() < 0.5 ? -1 : 1;
      this.roamTimer = 2 + Math.random() * 3;
    }

    const player = this.game.activeHero;
    if (!player) {
      // No player => roam
      this.roam(deltaTime);
    } else {
      // Distance to player
      const dxPlayer = player.x - this.x;
      const dyPlayer = player.y - this.y;
      const distPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);

      if (this.isLeader) {
        // Leader: chase if near, else roam
        if (distPlayer < this.chaseRadius) {
          this.chase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      } else if (this.groupLeader) {
        // Follower logic
        const dxLead = this.groupLeader.x - this.x;
        const dyLead = this.groupLeader.y - this.y;
        const distLead = Math.sqrt(dxLead * dxLead + dyLead * dyLead);
        if (distLead > this.minLeaderDistance) {
          // Move toward leader
          this.chase(this.groupLeader.x, this.groupLeader.y, deltaTime);
        } else {
          // If near leader but also near player => chase
          if (distPlayer < this.chaseRadius) {
            this.chase(player.x, player.y, deltaTime);
          } else {
            this.roam(deltaTime);
          }
        }
      } else {
        // No leader assigned
        if (distPlayer < this.chaseRadius) {
          this.chase(player.x, player.y, deltaTime);
        } else {
          this.roam(deltaTime);
        }
      }
    }

    this.dealDamageToPlayer(deltaTime);
  }

  roam(deltaTime) {
    const roamSpeed = this.speed * 0.5;
    let newX = this.x + this.roamDir.x * roamSpeed * deltaTime;
    let newY = this.y + this.roamDir.y * roamSpeed * deltaTime;

    if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
      this.x = newX;
    }
    if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
      this.y = newY;
    }
  }

  chase(targetX, targetY, deltaTime) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    let newX = this.x + (dx / dist) * this.speed * deltaTime;
    let newY = this.y + (dy / dist) * this.speed * deltaTime;

    if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
      this.x = newX;
    }
    if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
      this.y = newY;
    }
  }

  draw(ctx) {
    // Override base "purple"
    if (this.isLeader) {
      ctx.fillStyle = "red";
    } else {
      ctx.fillStyle = "green";
    }
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Health bar
    ctx.fillStyle = "red";
    const hpWidth = this.width * (this.currentHealth / this.maxHealth);
    ctx.fillRect(this.x, this.y - 10, hpWidth, 5);

    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x, this.y - 10, this.width, 5);
  }
}

window.Goblin = Goblin;
