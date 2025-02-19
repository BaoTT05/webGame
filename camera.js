// camera.js
class Camera {
  constructor(viewWidth, viewHeight, mapWidth, mapHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  // Instead of centering on the player every frame,
  // update the camera only when the target moves beyond a margin.
  update(target) {
    // Define a margin (deadzone) from the edges of the view.
    const marginX = this.viewWidth * 0.4;
    const marginY = this.viewHeight * 0.4;

    // Compute where the target (player) is relative to the camera.
    let targetScreenX = target.x - this.x;
    let targetScreenY = target.y - this.y;

    // If the target is too far to the left, shift camera left.
    if (targetScreenX < marginX) {
      this.x = target.x - marginX;
    }
    // If the target is too far to the right, shift camera right.
    else if (targetScreenX > this.viewWidth - marginX - target.width) {
      this.x = target.x - (this.viewWidth - marginX - target.width);
    }

    // Similarly for vertical movement.
    if (targetScreenY < marginY) {
      this.y = target.y - marginY;
    }
    else if (targetScreenY > this.viewHeight - marginY - target.height) {
      this.y = target.y - (this.viewHeight - marginY - target.height);
    }

    // Clamp the camera so it doesn’t go beyond the map boundaries.
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x + this.viewWidth > this.mapWidth) this.x = this.mapWidth - this.viewWidth;
    if (this.y + this.viewHeight > this.mapHeight) this.y = this.mapHeight - this.viewHeight;
  }
}

// Make it accessible in the global scope (if not using modules)
window.Camera = Camera;
