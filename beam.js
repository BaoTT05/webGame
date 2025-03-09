// beam.js

class Beam {
    /**
     * @param {Game} game The main game object
     * @param {number} x   Spawn X
     * @param {number} y   Spawn Y
     * @param {number} facing 0=left, 1=right
     * @param {number} speed (optional) Speed
     * @param {number} range (optional) Max travel distance
     */
    constructor(game, x, y, facing, speed = 8, range = 300) {
      Object.assign(this, { game, x, y, facing, speed, range });
      this.distanceTraveled = 0;
      this.removeFromWorld = false;
  
      // Make the beam visually smaller
      this.width = 12;
      this.height = 4;
    }
  
    update(deltaTime) {
      // Default deltaTime if not provided
      deltaTime = deltaTime || 1/60;
  
      let velocity = (this.facing === 1) ? this.speed : -this.speed;
      this.x += velocity;
      this.distanceTraveled += Math.abs(velocity);
  
      // 1) Check collision with walls
      if (this.game.hitsWall(this.x, this.y, this.width, this.height)) {
        this.removeFromWorld = true;
        return; 
      }
  
      // 2) Check collision with monsters
      for (let monster of this.game.monsters) {
        if (this.collidesWith(monster)) {
          monster.takeDamage(30); // 5 damage
          this.removeFromWorld = true;
          break; // Stop checking other monsters
        }
      }
  
      // 3) Check max range
      if (this.distanceTraveled >= this.range) {
        this.removeFromWorld = true;
      }
    }
  
    collidesWith(monster) {
      // AABB overlap check
      return (
        this.x < monster.x + monster.width &&
        this.x + this.width > monster.x &&
        this.y < monster.y + monster.height &&
        this.y + this.height > monster.y
      );
    }
  
    draw(ctx) {
      ctx.fillStyle = "blue";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  
  window.Beam = Beam;
  