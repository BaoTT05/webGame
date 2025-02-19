class Goblin extends Monster {
    constructor(game, x, y, isLeader = false) {
      if (isLeader) {
        // Leader goblin: slightly bigger, faster, and tougher.
        super(game, x, y, 40, 40, 60, 80, 15);
        this.isLeader = true;
      } else {
        super(game, x, y, 30, 30, 50, 50, 10);
        this.isLeader = false;
      }
      // For follower goblins, we'll set this property to point to the leader.
      this.groupLeader = null;
    }
  
    update(deltaTime) {
      const player = this.game.activeHero;
      if (this.isLeader) {
        // Leader goblin: chase the player aggressively.
        if (player) {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 250) {
            const norm = distance || 1;
            this.x += (dx / norm) * this.speed * deltaTime;
            this.y += (dy / norm) * this.speed * deltaTime;
          }
        }
      } else if (this.groupLeader) {
        // Follower goblin: stick close to the leader.
        const leader = this.groupLeader;
        const dx = leader.x - this.x;
        const dy = leader.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 50) { // Increase threshold to keep them closer.
          const norm = distance || 1;
          this.x += (dx / norm) * this.speed * deltaTime;
          this.y += (dy / norm) * this.speed * deltaTime;
        }
      } else if (player) {
        // Fallback: if no leader is set, chase the player.
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 250) {
          const norm = distance || 1;
          this.x += (dx / norm) * this.speed * deltaTime;
          this.y += (dy / norm) * this.speed * deltaTime;
        }
      }
      this.dealDamageToPlayer(deltaTime);
    }
  
    draw(ctx) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      if (this.isLeader) {
        // Draw the leader as a distinct red rectangle.
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
      } else {
        // Follower goblins use a gradient (green to black).
        let gradient = ctx.createRadialGradient(
          centerX, centerY, this.width * 0.1,
          centerX, centerY, this.width / 2
        );
        gradient.addColorStop(0, 'green');
        gradient.addColorStop(1, 'black');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
      
      // Draw the health bar above the goblin.
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 10, this.width, 5);
    }
  }
  