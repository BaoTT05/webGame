// main.js
console.log("Loaded main.js!");

// Start the game
window.onload = () => {
  console.log("Window onload fired!");
  const game = new Game();
  game.init();
};
