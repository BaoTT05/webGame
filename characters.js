// characters.js
class HealthBar {
    constructor(entity, offsetX = 0, offsetY = -10, width = null, height = 5) {
        if (!entity || typeof entity.currentHealth === "undefined" || typeof entity.maxHealth === "undefined") {
            console.error("HealthBar Error: Entity is missing health properties!", entity);
            return;
        }
        this.entity = entity;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.width = width || entity.width || 35;
        this.height = height;
    }

    update() {}

    draw(ctx) {
        if (!this.entity || this.entity.currentHealth <= 0) return;

        let ratio = Math.max(0, this.entity.currentHealth / this.entity.maxHealth);
        ctx.fillStyle = ratio < 0.2 ? "Red" : ratio < 0.5 ? "Yellow" : "Green";

        ctx.fillRect(this.entity.x + this.offsetX, this.entity.y + this.offsetY, this.width * ratio, this.height);
        ctx.strokeStyle = "Black";
        ctx.strokeRect(this.entity.x + this.offsetX, this.entity.y + this.offsetY, this.width, this.height);
    }a
}

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
        this.speed = 1;

        // Animation state:
        // facing: 0 = left, 1 = right (could be expanded to up/down if needed)
        // state: 0 = idle, 1 = walking
        // attacks: 0 = none, 1 = melee, 2 = range
        this.facing = 0;
        this.state = 0;
        this.attacks = 0;
        this.dead = false;

        // Health properties.
        this.currentHealth = 100;
        this.maxHealth = 100;
        this.healthbar = new HealthBar(this);

        // Load the spritesheet using the AssetManager.
        this.spritesheet = ASSET_MANAGER.getAsset("./Megaman sprite.png");

        // Prepare animations as a 2D array: [state][facing].
        this.animations = [];
        this.loadAnimations(this.spritesheet);
    }

    loadAnimations(spritesheet) {
        // We assume two states (idle = 0, walking = 1), two directions (left = 0, right = 1), and attacks (0 = none, 1 = melee, 2 = range) .
        for (let i = 0; i < 2; i++) {
            this.animations.push([]);
            for (let j = 0; j < 2; j++) {
                this.animations[i].push([]);
                for (let k = 0; k < 3; k++) {
                    this.animations[i][j].push(null);
                }
            }
        }

        // Idle animations:
        // Left-facing idle animation.
        this.animations[0][0][0] = new Animator(spritesheet, 70, 61, 35, 30, 2, 0.4, 0, false, true);
        // Right-facing idle animation.
        this.animations[0][1][0] = new Animator(spritesheet, 0, 61, 32, 30, 2, 0.4, 0, false, true);

        // Walking animations:
        // Left-facing walking animation.
        this.animations[1][0][0] = new Animator(spritesheet, 0, 31, 35, 30, 4, 0.4, 0, false, true);
        // Right-facing walking animation.
        this.animations[1][1][0] = new Animator(spritesheet, 0, 0, 35, 30, 4, 0.4, 0, false, true);

        //Melee animations:
        // Left-facing melee attack animation.
        this.animations[1][0][1] = new Animator(spritesheet, 0, 151, 35, 30, 4, 0.2, 0, false, true);
        // Right-facing melee attack animation.
        this.animations[1][1][1] = new Animator(spritesheet, 0, 91, 35, 30, 4, 0.2, 0, false, true);
    }

    update() {
        // Update animation state based on input keys tracked by the Game.
        let moving = false;

        if (this.game.keys.left && this.game.keys.right && this.game.keys.up) {
            this.state = 1;
            this.facing = 0;
            moving = true;
        } else if (this.game.keys.left && this.game.keys.right && this.game.keys.down) {
            this.state = 1;
            this.facing = 1;
            moving = true;
        } else if (this.game.keys.up && this.game.keys.down && this.game.keys.right) {
            this.state = 1;
            this.facing = 1;
            moving = true;
        } else if (this.game.keys.up && this.game.keys.down && this.game.keys.left) {
            this.state = 1;
            this.facing = 0;
            moving = true;
        } 
        
        else if (this.game.keys.up && this.game.keys.down) {
            this.state = 0;
        } else if (this.game.keys.left && this.game.keys.right) {
            this.state = 0;
        } else if (this.game.keys.up && this.game.keys.down && this.game.keys.left && this.game.keys.right) {
            this.state = 0;
            moving = false;
        } 
        
        else if (this.game.keys.left && !this.game.keys.right) {
            this.state = 1;
            this.facing = 0;
            moving = true;
        } else if (this.game.keys.right && !this.game.keys.left) {
            this.state = 1;
            this.facing = 1;
            moving = true;
        } else if (this.game.keys.up && !this.game.keys.down) {
            this.state = 1;
            this.facing = 0;
            moving = true;
        } else if (this.game.keys.down && !this.game.keys.up) {
            this.state = 1;
            this.facing = 1;
            moving = true;
        }

        if (!moving) {
            this.state = 0;
        }

        // (Additional state updates can be added here if needed.)
        if (this.healthBar) this.healthBar.update();
    }

    draw(ctx) {
        // Debug: Draw a red rectangle showing the Tank's collision box.
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw the current animation frame at the Tank's world coordinates.
        if (this.animations[this.state] && this.animations[this.state][this.facing][this.attacks]) {
            this.animations[this.state][this.facing][this.attacks].drawFrame(
                this.game.clockTick, ctx, this.x, this.y, 1
            );
        } else {
            console.error("Missing animation for state:", this.state, "facing:", this.facing);
        }
        //this.healthBar.draw(ctx);
        if (this.healthBar) {
            this.healthBar.draw(ctx);
        }
    }
}

window.Tank = Tank;
