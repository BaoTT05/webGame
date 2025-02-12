// class HealthBar {
//     // constructor(player) {
//     //     Object.assign(this, { player });
//     // }

//     // update() {

//     // };

//     // draw(ctx) {
//     //     var ratio = this.player.currentHealth / this.player.maxHealth;
//     //     ctx.strokeStyle = "Black";
//     //     ctx.fillStyle = ratio < 0.2 ? "Red" : ratio < 0.5 ? "Yellow" : "Green";
//     //     ctx.fillRect(this.player.x - this.player.radius, this.player.y + this.player.radius + 5, this.player.radius * 2 * ratio, 4);
//     //     ctx.strokeRect(this.player.x - this.player.radius, this.player.y + this.player.radius + 5, this.player.radius * 2, 4);
//     // }
//         // Test for megaman health bar
//         constructor(tank) {
//             this.tank = tank;
//             this.width = tank.width; // Match tank's width
//             this.height = 5; // Small height for the health bar
//             this.offsetY = -10; // Position above the tank
//         }
//         // universal constructor for all sprites
//         // constructor(entity, offsetX = 0, offsetY = -10, width = null, height = 5) {
//         //     this.entity = entity;
//         //     this.offsetX = offsetX; // Adjust the horizontal position if needed
//         //     this.offsetY = offsetY; // Default: Draw above the entity
//         //     this.width = width || entity.width; // Default: match entity width
//         //     this.height = height; // Default height of health bar
//         // }
    
//         update() {
//             // Update logic if needed
//         }
    
//         draw(ctx) {
//             let ratio = this.tank.currentHealth / this.tank.maxHealth;
            
//             // Set color based on health percentage
//             ctx.fillStyle = ratio < 0.2 ? "Red" : ratio < 0.5 ? "Yellow" : "Green";
            
//             // Draw the health bar
//             ctx.fillRect(this.tank.x, this.tank.y + this.offsetY, this.width * ratio, this.height);
            
//             // Draw the outline
//             ctx.strokeStyle = "Black";
//             ctx.strokeRect(this.tank.x, this.tank.y + this.offsetY, this.width, this.height);
//         }
    
// };

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
