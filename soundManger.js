var bgMusic = new Audio('backgroundmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5; // Set volume to 50% (adjust as needed)
bgMusic.play();

function playSoundEffect(effect) {
    var sound = new Audio(effect);
    sound.play();
}

document.addEventListener('click', function() {
    bgMusic.play();
});