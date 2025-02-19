class Slime extends Monster {
    constructor(game, x, y, size = 40, level = 1) {
      super(game, x, y, size, size, 20, 30 * level, 2);
      this.level = level;
      // Initialize a random roaming direction.
      this.direction = { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() < 0.5 ? -1 : 1 };
    }
  
    update(deltaTime) {
      const player = this.game.activeHero;
      const chaseRadius = 150; // Slime will chase if the player is within 150 pixels
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < chaseRadius) {
          // Chase the player using an increased speed multiplier when chasing.
          const chaseSpeed = this.speed * 1.5;
          const norm = distance || 1;
          this.x += (dx / norm) * chaseSpeed * deltaTime;
          this.y += (dy / norm) * chaseSpeed * deltaTime;
        } else {
          // Otherwise, roam randomly.
          let newX = this.x + this.direction.x * this.speed * deltaTime;
          if (!this.game.hitsWall(newX, this.y, this.width, this.height)) {
            this.x = newX;
          }
          let newY = this.y + this.direction.y * this.speed * deltaTime;
          if (!this.game.hitsWall(this.x, newY, this.width, this.height)) {
            this.y = newY;
          }
          // Occasionally change direction.
          if (Math.random() < 0.01) {
            this.direction.x = Math.random() < 0.5 ? -1 : 1;
            this.direction.y = Math.random() < 0.5 ? -1 : 1;
          }
        }
      }
      this.dealDamageToPlayer(deltaTime);
    }
  
    draw(ctx) {
      // Use a radial gradient for a "glowy" look.
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      let gradient = ctx.createRadialGradient(
        centerX, centerY, this.width * 0.1,
        centerX, centerY, this.width / 2
      );
      gradient.addColorStop(0, 'blue');
      gradient.addColorStop(1, 'black');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      
      // Draw the health bar above the slime.
      ctx.fillStyle = "red";
      const healthWidth = this.width * (this.currentHealth / this.maxHealth);
      ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y - 10, this.width, 5);
    }
  }
  