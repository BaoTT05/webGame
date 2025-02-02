// characters.js (Tank character)
class Tank {
    constructor(game, x, y) {
      Object.assign(this, { game, x, y });
      this.location = { x, y };
      this.speed = 1;
      this.facing = 0; // 0 = left, 1 = right, etc.
      this.state = 0; // 0 = idle, 1 = walking
  
      this.currentHealth = 100;
      this.maxHealth = 100;
  
      // Load the spritesheet using the AssetManager
      this.spritesheet = ASSET_MANAGER.getAsset("./Megaman sprite.png");
      this.animations = [];
      this.loadAnimations(this.spritesheet);
    }
  
    loadAnimations(spritesheet) {
      // For simplicity, we handle two states (idle, walking) and two directions (left/right)
      for (var i = 0; i < 2; i++) {
        this.animations.push([]);
        for (var j = 0; j < 2; j++) {
          this.animations[i].push(null);
        }
      }
  
      // Idle animations:
      // Left-facing idle animation
      this.animations[0][0] = new Animator(spritesheet, 70, 61, 35, 30, 2, 0.4, 0, false, true);
      // Right-facing idle animation
      this.animations[0][1] = new Animator(spritesheet, 0, 61, 35, 30, 2, 0.4, 0, false, true);
  
      // Walking animations:
      // Left-facing walking animation
      this.animations[1][0] = new Animator(spritesheet, 70, 61, 35, 30, 4, 0.4, 0, false, true);
      // Right-facing walking animation
      this.animations[1][1] = new Animator(spritesheet, 0, 0, 35, 30, 4, 0.4, 0, false, true);
    }
  
    update() {
      let moving = false;
      if (this.game.keys.left && !this.game.keys.right) {
        this.state = 1;
        this.facing = 0;
        moving = true;
      } else if (!this.game.keys.left && this.game.keys.right) {
        this.state = 1;
        this.facing = 1;
        moving = true;
      }
      if (!moving) {
        this.state = 0;
      }
      // You can add additional logging or state changes as needed.
    }
  
    draw(ctx) {
      // For debugging, draw a red rectangle showing the Tank's position.
      ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y, 35, 30);
  
      // Draw the animation sprite with a scale factor of 1.
      if (this.animations[this.state] && this.animations[this.state][this.facing]) {
        this.animations[this.state][this.facing].drawFrame(this.game.clockTick, ctx, this.x, this.y, 1);
      } else {
        console.error("Missing animation for state:", this.state, "facing:", this.facing);
      }
    }
  }
  