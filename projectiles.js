class Beam {
    // constructor(game, x, y) { 
    //     Object.assign(this, {game, x, y});
    //     if (this.game.facing == 1) {
    //         this.x *= -1;
    //     }

    //     this.spritesheet = ASSET_MANAGER.getAsset("./Megaman Beam sprite.png");

    // }
    constructor(game, x, y, speed = 5, range = 500) {
        Object.assign(this, {game, x, y});
        this.x = this.x;
        this.y = this.y;
        this.speed = speed;
        this.range = range;
        if (this.game.facing == 1) {
            this.directions = 0; //Left
        } else {
            this.directions = 1; //Right
        }

        

        this.spritesheet = ASSET_MANAGER.getAsset("./Megaman Beam sprite.png");
        this.animator = new Animator(this.spritesheet, 0, 0, 35, 30, 4, 0.1, 0, false, true);
    }

    update() {
        if (this.direction === 0) {
            // Moving left
            this.x -= this.speed;
        } else {
            // Moving right
            this.x += this.speed;
        }

        this.distanceTraveled += this.speed;
        if (this.distanceTraveled > this.range) {
            // If the projectile travels beyond its range, destroy it
            this.remove();
        }
    }

    remove() {
        this.game.beamList.splice(this.game.beamList.indexOf(this), 1);
    }

    draw(ctx) {
        // this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
        // this.animator.drawFrame(0.1, ctx, this.x, this.y, 1);
        if (!this.animator) return; // Make sure animator exists
        this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y);

    }
}

window.Beam = Beam;