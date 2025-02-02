class Tank {
    constructor(game, x, y) {
        Object.assign(this, {game, x, y});

        this.location = {x, y};
        this.speed = 1;

        this.facing = 0; // 0 = left, 1 = right, 2 = up, 3 = down
        this.state = 0; // 0 = idle, 1 = walking


        this.currentHealth = 100;
        this.maxHealth = 100;
        //this.healthBar = new HealthBar(this);

        // Update this when we get character sprites
        this.spritesheet = ASSET_MANAGER.getAsset("./Megaman.PNG");
        this.animations = [];
        this.loadAnimations();

    };

    loadAnimations() {
        // for (var i = 0; i < 2; i++) { //State
        //     this.animations.push([]);
        //     for (var j = 0; j < 4; j++) { //Direction Facing
        //         this.animations[i].push([]);
        //     }
        // }

        //Idle animation for state 0
        //Facing Left = 0
        //this.animations[0][0] = new Animator(this.spritesheet, 0, 0, 105, 110, 1, .2, 30, false, true);
        //this.animations[0] = new Animator(ASSET_MANAGER.getAsset("./Megaman sprite.png"), 0, 0, 35, 30, 4, 0.4, 0, false, true);
        
            console.log("Loading animation...");
        
            this.animations = new Animator(
                ASSET_MANAGER.getAsset("./Megaman sprite.png"), 
                0, 0, 35, 30, 4, 0.4, 0, false, true
            );
        
            console.log("Animation assigned:", this.animations);
        


    };

    update() {

    };

    draw(ctx) {
        // ctx.fillStyle = "red";
        // ctx.fillRect(this.x, this.y, 35, 30);
        // this.animations[this.state][this.facing].drawFrame(this.game.clockTick, ctx, this.x - this.game.camera.x, this.y, PARAMS.SCALE);
        //this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    
            // Debug: Draw a red rectangle where the tank should be
            ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y, 35, 30);

    // Manually draw sprite for debugging
    const sprite = ASSET_MANAGER.getAsset("./Megaman sprite.png");
    if (sprite) {
        console.log("Manually drawing sprite...");
        ctx.drawImage(sprite, 0, 0, 35, 30, this.x, this.y, 35, 30);
    } else {
        console.error("Sprite is missing!");
    }

        //this.healthBar.draw(ctx);
    };

};