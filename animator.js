// animator.js
class Animator {
    constructor(spritesheet, xStart, yStart, width, height, frameCount, frameDuration, framePadding, reverse, loop) {
        Object.assign(this, { spritesheet, xStart, yStart, width, height, frameCount, frameDuration, framePadding, reverse, loop });
        this.elapsedTime = 0;
        this.totalTime = this.frameCount * this.frameDuration;
    }

    // Set a default scale of 1 if none is provided
    drawFrame(tick, ctx, x, y, scale = 1) {
        this.elapsedTime += tick;
    
        if (this.isDone()) {
            if (this.loop) {
            this.elapsedTime -= this.totalTime;
            } else {
            return;
            }
        }
    
        let frame = this.currentFrame();
        if (this.reverse) frame = this.frameCount - frame - 1;
        ctx.drawImage(
            this.spritesheet,
            this.xStart + frame * (this.width + this.framePadding), this.yStart,
            this.width, this.height,
            x, y,
            this.width * scale,
            this.height * scale
        );
    
        // If you have a debug parameter defined in PARAMS, draw a rectangle around the sprite
        //if (typeof PARAMS !== "undefined" && PARAMS.DEBUG) {
          //  ctx.strokeStyle = 'Green';
           // ctx.strokeRect(x, y, this.width * scale, this.height * scale);
        //}
        }
    
    currentFrame() {
        return Math.floor(this.elapsedTime / this.frameDuration);
    }

    isDone() {
        return (this.elapsedTime >= this.totalTime);
    }
}
