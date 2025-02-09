// characters.js
class Tank {
    constructor(game, x, y) {
        // Store the game reference and the Tank's world coordinates.
        this.game = game;
        this.x = x;
        this.y = y;
        
        // Set the dimensions of the Tank.
        this.width = 35;
        this.height = 30;

        // Movement speed (in world units per update).
        this.speed = 10;

        // Animation state:
        // facing: 0 = left, 1 = right (could be expanded to up/down if needed)
        // state: 0 = idle, 1 = walking
        this.facing = 0;
        this.state = 0;

        // Health properties.
        this.currentHealth = 100;
        this.maxHealth = 100;

        // Load the spritesheet using the AssetManager.
        this.spritesheet = ASSET_MANAGER.getAsset("./Megaman sprite.png");

        // Prepare animations as a 2D array: [state][facing].
        this.animations = [];
        this.loadAnimations(this.spritesheet);
    }

    loadAnimations(spritesheet) {
        // We assume two states (idle = 0, walking = 1) and two directions (left = 0, right = 1).
        for (let i = 0; i < 2; i++) {
            this.animations.push([]);
            for (let j = 0; j < 2; j++) {
                this.animations[i].push(null);
            }
        }

        // Idle animations:
        // Left-facing idle animation.
        this.animations[0][0] = new Animator(spritesheet, 70, 61, 35, 30, 2, 0.4, 0, false, true);
        // Right-facing idle animation.
        this.animations[0][1] = new Animator(spritesheet, 0, 61, 32, 30, 2, 0.4, 0, false, true);

        // Walking animations:
        // Left-facing walking animation.
        this.animations[1][0] = new Animator(spritesheet, 0, 31, 35, 30, 4, 0.4, 0, false, true);
        // Right-facing walking animation.
        this.animations[1][1] = new Animator(spritesheet, 0, 0, 35, 30, 4, 0.4, 0, false, true);
    }

    update() {
        // Update animation state based on input keys tracked by the Game.
        let moving = false;

        if (this.game.keys.left && !this.game.keys.right) {
            this.state = 1;
            this.facing = 0;
            moving = true;
        } else if (this.game.keys.right && !this.game.keys.left) {
            this.state = 1;
            this.facing = 1;
            moving = true;
        }

        if (!moving) {
            this.state = 0;
        }

        // (Additional state updates can be added here if needed.)
    }

    draw(ctx) {
        // Debug: Draw a red rectangle showing the Tank's collision box.
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw the current animation frame at the Tank's world coordinates.
        if (this.animations[this.state] && this.animations[this.state][this.facing]) {
            this.animations[this.state][this.facing].drawFrame(
                this.game.clockTick, ctx, this.x, this.y, 1
            );
        } else {
            console.error("Missing animation for state:", this.state, "facing:", this.facing);
        }
    }
}

window.Tank = Tank;
