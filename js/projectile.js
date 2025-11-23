
class Projectile {
    constructor({ position, velocity, color = 'yellow', owner }) {
        this.position = position
        this.velocity = velocity
        this.width = 20
        this.height = 20
        this.color = color
        this.owner = owner // 'player' or 'enemy'
        this.active = true
    }

    draw() {
        if (!this.active) return
        c.fillStyle = this.color
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    update() {
        this.draw()
        this.position.x += this.velocity.x
        
        // Deactivate if off screen
        if (this.position.x < 0 || this.position.x > canvas.width) {
            this.active = false
        }
    }
}
