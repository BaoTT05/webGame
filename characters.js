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
        this.spritesheet = ASSET_MANAGER.getAsset("./Megaman sprite.png");
        this.animations = [];
        this.loadAnimations(this.spritesheet);

    };

    loadAnimations(spritesheet) {
        for (var i = 0; i < 2; i++) { //State 0 = idle, 1 = walking
            this.animations.push([]);
            for (var j = 0; j < 2; j++) { //Direction Facing 0 = left, 1 = right, 2 = up, 3 = down
                this.animations[i].push([]);
            }
        }

        //Idle animation for looking left
        this.animations[0][0] = new Animator(spritesheet, 70, 61, 35, 30, 2, 0.4, 0 , false, true);

        //Idle animation for looking right
        this.animations[0][1] = new Animator(spritesheet, 0, 61, 35, 30, 2, 0.4, 0 , false, true);

        //Running animation for Left
        this.animations[1][0] = new Animator(spritesheet, 70, 61, 35, 30, 4, 0.4, 0 , false, true);

        //Running animation for Right
        this.animations[1][1] = new Animator(spritesheet, 0, 0, 35, 30, 4, 0.4, 0 , false, true);


        //Idle animation for state 0
        //Facing Left = 0
        //this.animations[0][0] = new Animator(this.spritesheet, 0, 0, 105, 110, 1, .2, 30, false, true);
        //this.animations[0] = new Animator(ASSET_MANAGER.getAsset("./Megaman sprite.png"), 0, 0, 35, 30, 4, 0.4, 0, false, true);
        
            // console.log("Loading animation...");
        
            // this.animations = new Animator(
            //     ASSET_MANAGER.getAsset("./Megaman sprite.png"), 
            //     0, 0, 35, 30, 4, 0.4, 0, false, true
            // );
        
            // console.log("Animation assigned:", this.animations);
        


    };

    update() {
        let moving = false;
        

        // if (this.game.keys.left && !this.game.keys.right) {
        //     this.state = 0;
        //     this.facing = 0;
        // } else if (!this.game.keys.left && this.game.keys.right) {
        //     this.state = 0;
        //     this.facing = 1;
        // }
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

        console.log(this.state);
        console.log(this.facing);

    };

    draw(ctx) {
    
        // Debug: Draw a red rectangle where the tank should be
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, 35, 30);

        // Manually draw sprite for debugging
        const sprite = ASSET_MANAGER.getAsset("./Megaman sprite.png");

        this.animations[this.state][this.facing].drawFrame(this.game.clockTick, ctx, this.x, this.y);

        console.log("Animations:", this.animations);
        console.log("State:", this.state, "Facing:", this.facing);
        console.log("Current Animation:", this.animations[this.state]?.[this.facing]);


        // if (sprite) {
        //     console.log("Manually drawing sprite...");
        //     ctx.drawImage(sprite, 70, 61, 35, 30, this.x, this.y, 35, 30);
        // } else {
        //     console.error("Sprite is missing!");
        // }

        //this.healthBar.draw(ctx);
    };

};