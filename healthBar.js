class HealthBar {
    constructor(player) {
        Object.assign(this, { player });
    }

    update() {

    };

    draw(ctx) {
        var ratio = this.player.currentHealth / this.player.maxHealth;
        ctx.strokeStyle = "Black";
        ctx.fillStyle = ratio < 0.2 ? "Red" : ratio < 0.5 ? "Yellow" : "Green";
        ctx.fillRect(this.player.x - this.player.radius, this.player.y + this.player.radius + 5, this.player.radius * 2 * ratio, 4);
        ctx.strokeRect(this.player.x - this.player.radius, this.player.y + this.player.radius + 5, this.player.radius * 2, 4);
    }

};

