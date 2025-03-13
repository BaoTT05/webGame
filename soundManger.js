class SoundManager {
    constructor() {
      this.bgMusic = new Audio('backgroundmusic.mp3');
      this.bgMusic.loop = true; // Music will loop
      this.bgMusic.volume = 0.5; // Set volume to 50%
      this.bgMusicStarted = false; // Track if music has started
    }
  
    playBackgroundMusic() {
      this.bgMusic.play().catch((error) => {
        console.warn("Autoplay was blocked. User interaction is required to play audio.");
      });
    }
  }