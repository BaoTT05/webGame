class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;

        this.player = new Tank(this.game, 5, 5);
        this.game.addEntity(this.player);
        
    };

    update() {

    };

    draw(ctx) {

    };
}