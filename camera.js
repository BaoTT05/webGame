console.log("Loaded camera.js!");

class Camera {
  constructor(viewWidth, viewHeight, mapWidth, mapHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  centerOn(player) {
    // Center on player's center
    this.x = player.x + player.width / 2 - this.viewWidth / 2;
    this.y = player.y + player.height / 2 - this.viewHeight / 2;

    // Clamp horizontally
    if (this.mapWidth > this.viewWidth) {
      if (this.x < 0) this.x = 0;
      if (this.x + this.viewWidth > this.mapWidth) {
        this.x = this.mapWidth - this.viewWidth;
      }
    } else {
      this.x = Math.max((this.mapWidth - this.viewWidth) / 2, 0);
    }

    // Clamp vertically
    if (this.mapHeight > this.viewHeight) {
      if (this.y < 0) this.y = 0;
      if (this.y + this.viewHeight > this.mapHeight) {
        this.y = this.mapHeight - this.viewHeight;
      }
    } else {
      this.y = Math.max((this.mapHeight - this.viewHeight) / 2, 0);
    }
  }
}

// Make it accessible in the global scope (if not using modules)
window.Camera = Camera;
