class Tank {
    constructor(game, x, y) {
        Object.assign(this, {game, x, y});

        this.location = {x, y};
        this.speed = 1;

        this.currentHealth = 100;
        this.maxHealth = 100;
        this.healthBar = new HealthBar(this);

        // Update this when we get character sprites
        //this.spritesheet = ASSET_MANAGER.getAsset();
        //this.animations(spritesheet);

    };

    animations(spritesheet) {

    };

    update() {

    };

    draw(ctx) {



        this.healthBar.draw(ctx);
    };

};
