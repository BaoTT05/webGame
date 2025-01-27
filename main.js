// console.log("Loaded main.js!");

// window.onload = () => {
//   console.log("Window onload fired!");
//   const game = new window.Game();
//   game.init();
// };

console.log("Loaded main.js!");
var ASSET_MANAGER = new AssetManager();

window.onload = () => {
    console.log("Window onload fired!");

    // Ensure assets are loaded before starting the game
    ASSET_MANAGER.downloadAll(() => {
        console.log("All assets loaded!");
        const game = new window.Game();
        game.init();
    });
};

// var ASSET_MANAGER = new AssetManager();

// ASSET_MANAGER.queueDownload("./Spritetemp.PNG");

// ASSET_MANAGER.downloadAll(function () {
//   var gameEngine = new Game();

// 	PARAMS.BLOCKWIDTH = PARAMS.BITWIDTH * PARAMS.SCALE;

// 	var canvas = document.getElementById('gameWorld');
// 	var ctx = canvas.getContext('2d');

// 	PARAMS.CANVAS_WIDTH = canvas.width;
// 	PARAMS.CANVAS_HEIGHT = canvas.height;

// 	gameEngine.init(ctx);
		
// 	new SceneManager(gameEngine);

// 	gameEngine.start();
// });