class HealthBar {
    constructor(entity, offsetX = 0, offsetY = -10, width = null, height = 5) {
        // Validate that entity exists and has required properties
        if (!entity || typeof entity.currentHealth === "undefined" || typeof entity.maxHealth === "undefined") {
            console.error("HealthBar Error: Entity is missing health properties!", entity);
            return;
        }

        this.entity = entity;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.width = width || entity.width || 35; // Default width if missing
        this.height = height;
    }

    update() {
        if (!this.entity) return; // Prevent errors if entity is undefined
    }

    draw(ctx) {
        if (!this.entity || this.entity.currentHealth <= 0) return; // Don't draw if dead

        let ratio = Math.max(0, this.entity.currentHealth / this.entity.maxHealth); // Ensure ratio is never negative

        // Set color based on health percentage
        ctx.fillStyle = ratio < 0.2 ? "Red" : ratio < 0.5 ? "Yellow" : "Green";

        // Draw health bar
        ctx.fillRect(
            this.entity.x + this.offsetX,
            this.entity.y + this.offsetY,
            this.width * ratio,
            this.height
        );

        // Draw health bar outline
        ctx.strokeStyle = "Black";
        ctx.strokeRect(
            this.entity.x + this.offsetX,
            this.entity.y + this.offsetY,
            this.width,
            this.height
        );
    }
}
