/**
 * camera.js
 * Updated so we floor the final this.x and this.y => reduces stutter.
 */

class Camera {
  constructor(viewWidth, viewHeight, mapWidth, mapHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  update(target) {
    const marginX = this.viewWidth * 0.4;
    const marginY = this.viewHeight * 0.4;

    let targetScreenX = target.x - this.x;
    let targetScreenY = target.y - this.y;

    // left
    if (targetScreenX < marginX) {
      this.x = target.x - marginX;
    }
    // right
    else if (targetScreenX > this.viewWidth - marginX - target.width) {
      this.x = target.x - (this.viewWidth - marginX - target.width);
    }

    // up
    if (targetScreenY < marginY) {
      this.y = target.y - marginY;
    }
    // down
    else if (targetScreenY > this.viewHeight - marginY - target.height) {
      this.y = target.y - (this.viewHeight - marginY - target.height);
    }

    // Clamp
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x + this.viewWidth > this.mapWidth) {
      this.x = this.mapWidth - this.viewWidth;
    }
    if (this.y + this.viewHeight > this.mapHeight) {
      this.y = this.mapHeight - this.viewHeight;
    }

    // Floor camera coords => no half pixels => less jitter
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
  }
}

// Make it accessible in global scope
window.Camera = Camera;
