console.log("Loaded main.js!");
var ASSET_MANAGER = new AssetManager();

window.onload = () => {
    console.log("Window onload fired!");
    ASSET_MANAGER.queueDownload("./Megaman sprite.png");
    ASSET_MANAGER.queueDownload("./grass.png");
    ASSET_MANAGER.queueDownload("./tree.png");
    ASSET_MANAGER.queueDownload("./slime.png");
    ASSET_MANAGER.queueDownload("./goblin.png");
    ASSET_MANAGER.queueDownload("./goblinLeader.png");
    ASSET_MANAGER.queueDownload("./fogofwar.png");




    // Ensure assets are loaded before starting the game
    ASSET_MANAGER.downloadAll(() => {
        console.log("All assets loaded!");
        const game = new window.Game();
        game.init();
    });
};