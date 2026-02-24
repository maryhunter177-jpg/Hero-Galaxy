const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Assets
const bgImg = new Image(); bgImg.src = 'assets/fundo.png';
const shipNormal = new Image(); shipNormal.src = 'assets/nave_1.png';
const shipMoving = new Image(); shipMoving.src = 'assets/nave_2.png';
const bulletImg = new Image(); bulletImg.src = 'assets/tiro_1.png';
const asteroidImg = new Image(); asteroidImg.src = 'assets/asteroid_1.png';
const enemyImg = new Image(); enemyImg.src = 'assets/naveinimiga_1.png';
const startImg = new Image(); startImg.src = 'assets/startgame.png';
const gameoverImg = new Image(); gameoverImg.src = 'assets/gameover.png';

// --- CONFIGURAÇÃO DO BOTÃO (MUDE AQUI PARA MOVER) ---
// Se quiser subir o botão, mude o 150 para um número maior (ex: 300)
let posicaoBotaoX = () => canvas.width / 2 - 10;
let posicaoBotaoY = () => canvas.height - 100; 
// ---------------------------------------------------

let gameState = 'START'; 
let score = 0;
let lives = 3;
let bgY = 0;
let bgSpeed = 3;
let spawnTimer = 0;

const player = {
    x: 0, y: 0,
    width: 150, height: 150,
    speed: 10,
    isMoving: false
};

const bullets = [];
const enemies = [];

function resetGame() {
    score = 0;
    lives = 3;
    bullets.length = 0;
    enemies.length = 0;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 30;
    gameState = 'PLAYING';
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 30;
}
window.addEventListener('resize', resize);

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (gameState === 'PLAYING' && e.key === ' ') shoot();
    if ((gameState === 'START' || gameState === 'GAMEOVER') && e.key === 'Enter') resetGame();
});
window.addEventListener('keyup', e => keys[e.key] = false);

// CLIQUE DO MOUSE / TOQUE
window.addEventListener('mousedown', (e) => {
    if (gameState === 'START') {
        const bx = posicaoBotaoX();
        const by = posicaoBotaoY();
        // Detecta o clique exatamente onde o botão é desenhado
        if (e.clientX >= bx && e.clientX <= bx + 200 &&
            e.clientY >= by && e.clientY <= by + 60) {
            resetGame();
        }
    } else if (gameState === 'GAMEOVER') {
        resetGame();
    } else if (gameState === 'PLAYING') {
        shoot();
    }
});

function shoot() {
    bullets.push({ x: player.x + player.width / 2 - 15, y: player.y, width: 30, height: 50 });
}

function spawnEnemy() {
    const type = Math.random() > 0.5 ? 'asteroid' : 'ship';
    const size = type === 'asteroid' ? 80 : 100;
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size, height: size,
        speed: type === 'asteroid' ? 3 + Math.random() * 2 : 5,
        img: type === 'asteroid' ? asteroidImg : enemyImg
    });
}

function update() {
    bgY += bgSpeed;
    if (bgY >= canvas.height) bgY = 0;
    if (gameState !== 'PLAYING') return;

    player.isMoving = false;
    if (keys['ArrowLeft'] && player.x > 0) { player.x -= player.speed; player.isMoving = true; }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) { player.x += player.speed; player.isMoving = true; }
    if (keys['ArrowUp'] && player.y > 0) { player.y -= player.speed; player.isMoving = true; }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) { player.y += player.speed; player.isMoving = true; }

    spawnTimer++;
    if (spawnTimer > 50) { spawnEnemy(); spawnTimer = 0; }

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 12;
        if (bullets[i].y < -50) bullets.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let en = enemies[i];
        en.y += en.speed;
        if (en.y > canvas.height) enemies.splice(i, 1);

        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (b.x < en.x + en.width && b.x + b.width > en.x &&
                b.y < en.y + en.height && b.y + b.height > en.y) {
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                break;
            }
        }

        if (en && player.x < en.x + en.width && player.x + player.width > en.x &&
            player.y < en.y + en.height && player.y + player.height > en.y) {
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) gameState = 'GAMEOVER';
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, bgY, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, bgY - canvas.height, canvas.width, canvas.height);

    if (gameState === 'START') {
        ctx.drawImage(startImg, 0, 0, canvas.width, canvas.height);
        
        // DESENHO DO BOTÃO
        const bx = posicaoBotaoX();
        const by = posicaoBotaoY();
        
        ctx.fillStyle = "#00d4ff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00d4ff";
        ctx.fillRect(bx, by, 200, 60); 
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = "white";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.fillText("INICIAR GAME", bx + 100, by + 38);
        ctx.textAlign = "left";
    }

    if (gameState === 'PLAYING') {
        bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height));
        enemies.forEach(en => ctx.drawImage(en.img, en.x, en.y, en.width, en.height));
        ctx.drawImage(player.isMoving ? shipMoving : shipNormal, player.x, player.y, player.width, player.height);

        // SCORE E VIDAS FIXOS 
        ctx.fillStyle = "white";
        ctx.font = "bold 25px Arial";
        ctx.fillText(`SCORE: ${score}`, 20, 40);
        ctx.fillStyle = "#ff4d4d";
        ctx.fillText(`VIDAS: ${"❤️".repeat(lives)}`, 20, 80);
    }

    if (gameState === 'GAMEOVER') {
        ctx.drawImage(gameoverImg, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        
        // --- ALTERAÇÃO SOLICITADA: POSIÇÃO NO RODAPÉ (MARCAÇÃO VERMELHA) ---
        ctx.font = "bold 50px Arial";
        ctx.fillText(`PONTUAÇÃO FINAL: ${score}`, canvas.width / 2, canvas.height - 120);
        
        ctx.font = "20px Arial";
        ctx.fillText("CLIQUE PARA VOLTAR", canvas.width / 2, canvas.height - 80);
        
        ctx.textAlign = "left";
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

resize();
bgImg.onload = () => loop();