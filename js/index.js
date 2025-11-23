const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.7

const player = new Fighter({
    position: {
        x: 100,
        y: 0
    },
    velocity: {
        x: 0,
        y: 0
    },
    offset: {
        x: 0,
        y: 0
    },
    color: 'blue'
})

const enemy = new Fighter({
    position: {
        x: 800,
        y: 100
    },
    velocity: {
        x: 0,
        y: 0
    },
    color: 'red',
    offset: {
        x: -50,
        y: 0
    }
})

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    },
    ArrowUp: {
        pressed: false
    }
}

const projectiles = []

let timer = 60
let timerId

function decreaseTimer() {
    if (timer > 0) {
        timerId = setTimeout(decreaseTimer, 1000)
        timer--
        document.querySelector('#timer').innerHTML = timer
    }

    if (timer === 0) {
        determineWinner({ player, enemy, timerId })
    }
}

decreaseTimer()

function animate() {
    window.requestAnimationFrame(animate)
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
    
    player.update()
    enemy.update()

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i]
        projectile.update()

        // Clean up inactive
        if (!projectile.active) {
            projectiles.splice(i, 1)
            continue
        }

        // Projectile Collision
        let target = null
        if (projectile.owner === 'player') target = enemy
        else if (projectile.owner === 'enemy') target = player

        if (target && 
            projectile.position.x + projectile.width >= target.position.x &&
            projectile.position.x <= target.position.x + target.width &&
            projectile.position.y + projectile.height >= target.position.y &&
            projectile.position.y <= target.position.y + target.height
        ) {
            target.health -= 10
            if (target === player) document.querySelector('#player-health').style.width = target.health + '%'
            if (target === enemy) document.querySelector('#enemy-health').style.width = target.health + '%'
            
            projectile.active = false
            projectiles.splice(i, 1)
        }
    }

    // Player Movement
    player.velocity.x = 0
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -5
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 5
    }

    // Enemy AI Logic
    enemy.velocity.x = 0
    const distanceX = player.position.x - enemy.position.x
    const attackRange = enemy.attackBox.width + enemy.width - 50 
    const reaction = Math.random()

    if (!enemy.dead && !player.dead) {
        if (Math.abs(distanceX) > attackRange) {
            if (distanceX > 0) {
                enemy.velocity.x = 3 
            } else {
                enemy.velocity.x = -3 
            }
        } else {
            if (reaction < 0.02 && !enemy.isAttacking) { 
                enemy.attack()
            }
        }
        // Simple Jump Logic
        if (player.velocity.y < 0 && reaction < 0.01 && enemy.velocity.y === 0) {
             enemy.velocity.y = -15
        }
    }

    // Detect Collision: Player Attacking Enemy
    if (
        rectangularCollision({
            rectangle1: player,
            rectangle2: enemy
        }) &&
        player.isAttacking
    ) {
        player.isAttacking = false
        
        // Check for block (Enemy moving AWAY from player)
        // Simplistic: if player is left of enemy, block is holding Right
        // If player is right of enemy, block is holding Left
        let blocked = false
        if (player.position.x < enemy.position.x) {
            // Player on left, Enemy needs to hold Right to block (moving away)
            // Actually in SF, blocking is holding BACK (Away).
            // So if Enemy is on Right, Back is Right arrow.
            if (keys.ArrowRight.pressed) blocked = true
        } else {
            // Player on right, Enemy on left. Back is Left arrow.
            if (keys.ArrowLeft.pressed) blocked = true
        }

        if (blocked) {
            enemy.health -= 5 // Chip damage
            console.log("Blocked!")
        } else {
            enemy.health -= 20
            console.log("Hit!")
        }
        
        document.querySelector('#enemy-health').style.width = enemy.health + '%'
    }

    // Detect Collision: Enemy Attacking Player (For testing 2P mechanics locally)
    if (
        rectangularCollision({
            rectangle1: enemy,
            rectangle2: player
        }) &&
        enemy.isAttacking
    ) {
        enemy.isAttacking = false
        
         // Check for block (Player moving AWAY from enemy)
        let blocked = false
        if (enemy.position.x > player.position.x) {
             // Enemy on Right, Player on Left. Back is Left.
             if (keys.a.pressed) blocked = true
        } else {
             // Enemy on Left, Player on Right. Back is Right.
             if (keys.d.pressed) blocked = true
        }

        if (blocked) {
            player.health -= 5
        } else {
            player.health -= 20
        }

        document.querySelector('#player-health').style.width = player.health + '%'
    }

    // End Game Condition
    if (enemy.health <= 0 || player.health <= 0) {
        determineWinner({ player, enemy, timerId })
    }
}

animate()

window.addEventListener('keydown', (event) => {
    // console.log(event.key) // Debug

    if (!player.dead) {
        switch (event.key) {
            case 'd':
                keys.d.pressed = true
                player.lastKey = 'd'
                break
            case 'a':
                keys.a.pressed = true
                player.lastKey = 'a'
                break
            case 'w':
                if (player.velocity.y === 0) player.velocity.y = -20
                break
            case ' ':
                player.attack()
                break
            case 'f':
                // Fireball
                const velocityX = (player.lastKey === 'a') ? -10 : 10
                projectiles.push(new Projectile({
                    position: {
                        x: player.position.x + player.width / 2,
                        y: player.position.y + player.height / 3
                    },
                    velocity: {
                        x: velocityX,
                        y: 0
                    },
                    owner: 'player'
                }))
                break
        }
    }

    // Enemy controls removed for Single Player AI mode
})

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
    }
})
