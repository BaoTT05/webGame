console.log("Loaded main.js!");

window.onload = () => {
  console.log("Window onload fired!");
  const game = new window.Game();
  game.init();
};
