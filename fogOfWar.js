/******************************************************
 * fogOfWar.js
 * 
 * A simple FogOfWar class that maintains an offscreen
 * "fog canvas" covering the entire map. We punch holes
 * in it (erase the fog) wherever the player walks.
 ******************************************************/

class FogOfWar {
    /**
     * @param {Game}  game      Reference to your main Game.
     * @param {number} mapWidth The full width of the world in pixels.
     * @param {number} mapHeight The full height of the world in pixels.
     */
    constructor(game, mapWidth, mapHeight) {
      this.game = game;
  
      // Create an offscreen canvas matching the entire map
      this.fogCanvas = document.createElement("canvas");
      this.fogCanvas.width = mapWidth;
      this.fogCanvas.height = mapHeight;
      this.fogCtx = this.fogCanvas.getContext("2d");
  
      // Fill it fully with black so the entire map starts covered
      this.fogCtx.fillStyle = "black";
      this.fogCtx.fillRect(0, 0, mapWidth, mapHeight);
  
      // The sprite to stamp out holes in the fog
      // (white circle on transparent background)
      this.fogSprite = ASSET_MANAGER.getAsset("./fogofwar.png");
    }
  
    /**
     * Called every frame from Game.update().
     * We reveal around the player each update.
     */
    update() {
      const player = this.game.tank;
      if (!player) return;
  
      // Center the fog reveal on the player’s center
      let centerX = player.x + player.width / 2;
      let centerY = player.y + player.height / 2;
      this.reveal(centerX, centerY);
    }
  
    /**
     * "Punches" a hole in the fog at (centerX, centerY)
     * using a compositing trick (destination-out).
     */
    reveal(centerX, centerY) {
        this.fogCtx.save();
        this.fogCtx.globalCompositeOperation = "destination-out";
      
        const spriteW = this.fogSprite.width;
        const spriteH = this.fogSprite.height;
      
        // Choose a scale factor. 2 means twice as large, 3 means triple, etc.
        const scale = 2; // or 3, 4, etc.
      
        // Adjust drawX / drawY so the center lines up
        const drawX = centerX - (spriteW * scale) / 2;
        const drawY = centerY - (spriteH * scale) / 2;
      
        // Pass the new width/height to drawImage
        this.fogCtx.drawImage(
          this.fogSprite,
          drawX, 
          drawY, 
          spriteW * scale, 
          spriteH * scale
        );
      
        this.fogCtx.restore();
      }
      
    /**
     * Called at the end of Game.draw(), after the map & entities.
     * Draws the fog overlay (with holes) at the correct camera offset.
     */
    draw(ctx) {
      let cam = this.game.camera;
      ctx.drawImage(this.fogCanvas, -cam.x, -cam.y);
    }
  }
  
  // Make it globally accessible
  window.FogOfWar = FogOfWar;
  