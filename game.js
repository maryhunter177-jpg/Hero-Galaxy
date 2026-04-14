const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ================= ASSETS (IMAGENS GERAIS) =================
const bgImg = new Image(); bgImg.src = 'assets/fundo.png';
const shipNormal = new Image(); shipNormal.src = 'assets/nave_1.png';
const shipMoving = new Image(); shipMoving.src = 'assets/nave_2.png';
const bulletImg = new Image(); bulletImg.src = 'assets/tiro_1.png';
const asteroidImg = new Image(); asteroidImg.src = 'assets/asteroid_1.png';
const enemyImg = new Image(); enemyImg.src = 'assets/naveinimiga_1.png';
const startImg = new Image(); startImg.src = 'assets/startgame.png';
const gameoverImg = new Image(); gameoverImg.src = 'assets/gameover.png';

// ================= ASSETS (BOSS) =================
const bossFrames = []; 
const bossAttackFrames = []; 
const totalBossFrames = 36;

for (let i = 1; i <= totalBossFrames; i++) {
    let imgIdle = new Image();
    imgIdle.src = `assets/boss1_nagakabouros_respirando_${i}.png`;
    bossFrames.push(imgIdle);

    let imgAtk = new Image();
    imgAtk.src = `assets/boss1_nagakabouros_atacando_${i}.png`;
    bossAttackFrames.push(imgAtk);
}

const bossProjectileImg = new Image(); 
bossProjectileImg.src = 'assets/ataque_nagakabouros.png'; 

// ================= ASSETS (ÁUDIOS) =================
const bgmMenu = new Audio('assets/menuMusica.mp3');
bgmMenu.loop = true;
bgmMenu.volume = 0.4;

const bgmFase1 = new Audio('assets/fase1Musica.mp3');
bgmFase1.loop = true;
bgmFase1.volume = 0.5;

const somTiro = new Audio('assets/disparo_de_laser.mp3');
somTiro.volume = 0.3;

const bgmGameOver = new Audio('assets/gameoverMusica.mp3');
bgmGameOver.loop = true;
bgmGameOver.volume = 0.4;

const hitSound = new Audio('assets/hitHurt.wav');
hitSound.volume = 0.5;

// ================= GERENCIADOR DE MÚSICA =================
function tocarMusica(estado) {
    if (estado === 'START') {
        bgmFase1.pause(); bgmFase1.currentTime = 0;
        bgmGameOver.pause(); bgmGameOver.currentTime = 0;
        bgmMenu.play().catch(e => console.log("Aguardando interação"));
    } else if (estado === 'PLAYING') {
        bgmMenu.pause(); bgmMenu.currentTime = 0;
        bgmGameOver.pause(); bgmGameOver.currentTime = 0;
        bgmFase1.play().catch(e => console.log("Aguardando interação"));
    } else if (estado === 'GAMEOVER') {
        bgmFase1.pause(); bgmFase1.currentTime = 0;
        bgmMenu.pause(); bgmMenu.currentTime = 0;
        bgmGameOver.play().catch(e => console.log("Aguardando interação"));
    }
}

// --- CONFIGURAÇÃO DO BOTÃO (BLINDADO NA POSIÇÃO CERTA) ---
let posicaoBotaoX = () => canvas.width / 2 - 10; 
let posicaoBotaoY = () => canvas.height - 100; 
// ----------------------------------------------------------

let gameState = 'START'; 
let score = 0;
let lives = 3;
let bgY = 0;
let bgSpeed = 3;
let spawnTimer = 0;
let gameFrames = 0; 

const player = {
    x: 0, y: 0,
    width: 150, height: 150,
    speed: 10,
    isMoving: false,
    invulTimer: 0 
};

// --- OBJETO DO BOSS (MODO AGRESSIVO) ---
const boss = {
    x: canvas.width / 2 - 150, 
    y: -400,                   
    width: 300, height: 300,
    hp: 20,                    // HP dobrado (era 10, agora 20)
    active: false,
    estadoAtual: 'respirando', 
    frameAtual: 0,
    animTimer: 0,
    animSpeed: 3,              
    hitTimer: 0,
    speedX: 4,                 // Mais rápido pra perseguir o player (era 2.5)
    tempoParaAtacar: 0,        
    cooldownAtaque: 70         // Ataca muito mais rápido (era 150)
};

const bullets = []; 
const enemies = []; 
const bossBullets = []; 

function resetGame() {
    score = 0;
    lives = 3;
    gameFrames = 0; 
    bullets.length = 0;
    enemies.length = 0;
    bossBullets.length = 0; 
    
    boss.active = false;
    boss.hp = 20; // Reseta com a vida máxima nova
    boss.y = -400;
    boss.estadoAtual = 'respirando';
    boss.frameAtual = 0;
    boss.tempoParaAtacar = 0;
    
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 30;
    player.invulTimer = 0;
    gameState = 'PLAYING';
    
    tocarMusica('PLAYING');
}

function voltarMenu() {
    gameState = 'START';
    tocarMusica('START');
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 30;
    if (!boss.active) boss.x = canvas.width / 2 - boss.width / 2; 
}
window.addEventListener('resize', resize);

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (gameState === 'START' && bgmMenu.paused) tocarMusica('START');
    if (gameState === 'PLAYING' && e.key === ' ') shoot();
    if (gameState === 'START' && e.key === 'Enter') resetGame();
    if (gameState === 'GAMEOVER' && e.key === 'Enter') voltarMenu();
});
window.addEventListener('keyup', e => keys[e.key] = false);

window.addEventListener('mousedown', (e) => {
    if (gameState === 'START' && bgmMenu.paused) tocarMusica('START');

    if (gameState === 'START') {
        const bx = posicaoBotaoX();
        const by = posicaoBotaoY();
        if (e.clientX >= bx && e.clientX <= bx + 200 &&
            e.clientY >= by && e.clientY <= by + 60) {
            resetGame();
        }
    } else if (gameState === 'GAMEOVER') {
        voltarMenu();
    } else if (gameState === 'PLAYING') {
        shoot();
    }
});

function shoot() {
    bullets.push({ x: player.x + player.width / 2 - 15, y: player.y, width: 30, height: 50 });
    somTiro.currentTime = 0; 
    somTiro.play().catch(e => {}); 
}

function spawnEnemy() {
    if (boss.active && boss.y > 0) return; 

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

function danoPlayer() {
    if (player.invulTimer <= 0) {
        lives--;
        hitSound.currentTime = 0;
        hitSound.play().catch(e => {}); 
        player.invulTimer = 60; 
        
        if (lives <= 0) {
            gameState = 'GAMEOVER';
            tocarMusica('GAMEOVER');
        }
    }
}

function update() {
    bgY += bgSpeed;
    if (bgY >= canvas.height) bgY = 0;
    if (gameState !== 'PLAYING') return;

    gameFrames++; 
    if (player.invulTimer > 0) player.invulTimer--;

    // ================= LÓGICA DO BOSS =================
    if (gameFrames > 900 && !boss.active && boss.hp > 0) {
        boss.active = true;
    }

    if (boss.active && boss.hp > 0) {
        if (boss.y < 50) {
            boss.y += 1.5;
        } else {
            // MOVIMENTO LATERAL MAIS RÁPIDO
            let centroBoss = boss.x + boss.width / 2;
            let centroPlayer = player.x + player.width / 2;
            
            if (centroBoss < centroPlayer - 15) boss.x += boss.speedX;
            else if (centroBoss > centroPlayer + 15) boss.x -= boss.speedX;

            if (boss.x < 0) boss.x = 0;
            if (boss.x + boss.width > canvas.width) boss.x = canvas.width - boss.width;

            if (boss.estadoAtual === 'respirando') {
                boss.tempoParaAtacar++;
                if (boss.tempoParaAtacar > boss.cooldownAtaque) {
                    boss.estadoAtual = 'atacando';
                    boss.frameAtual = 0; 
                }
            }
        }

        // ANIMAÇÃO DO BOSS E ATAQUE TRIPLO
        boss.animTimer++;
        if (boss.animTimer >= boss.animSpeed) {
            boss.frameAtual++;
            
            if (boss.frameAtual >= totalBossFrames) {
                
                if (boss.estadoAtual === 'atacando') {
                    // CÁLCULO DA POSIÇÃO DA BOCA
                    let bocaX = boss.x + boss.width / 2 - 40;
                    let bocaY = boss.y + boss.height - 60;

                    // 1. Esfera Reta
                    bossBullets.push({
                        x: bocaX, y: bocaY, width: 80, height: 80, speedX: 0, speedY: 7 
                    });
                    
                    // 2. Esfera Diagonal Esquerda
                    bossBullets.push({
                        x: bocaX, y: bocaY, width: 80, height: 80, speedX: -4, speedY: 6 
                    });

                    // 3. Esfera Diagonal Direita
                    bossBullets.push({
                        x: bocaX, y: bocaY, width: 80, height: 80, speedX: 4, speedY: 6 
                    });

                    boss.estadoAtual = 'respirando'; 
                    boss.tempoParaAtacar = 0;
                }
                
                boss.frameAtual = 0;
            }
            boss.animTimer = 0;
        }

        if (boss.hitTimer > 0) boss.hitTimer--;

        // Colisão Player x Corpo do Boss
        if (player.x < boss.x + boss.width && player.x + player.width > boss.x &&
            player.y < boss.y + boss.height && player.y + player.height > boss.y) {
            danoPlayer();
        }
    }
    // ==================================================

    player.isMoving = false;
    if (keys['ArrowLeft'] && player.x > 0) { player.x -= player.speed; player.isMoving = true; }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) { player.x += player.speed; player.isMoving = true; }
    if (keys['ArrowUp'] && player.y > 0) { player.y -= player.speed; player.isMoving = true; }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) { player.y += player.speed; player.isMoving = true; }

    spawnTimer++;
    if (spawnTimer > 50) { spawnEnemy(); spawnTimer = 0; }

    // Atualiza Tiros do Player
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 12;
        let b = bullets[i];

        if (boss.active && boss.hp > 0 && b.y < -50 === false) {
            if (b.x < boss.x + boss.width && b.x + b.width > boss.x &&
                b.y < boss.y + boss.height && b.y + b.height > boss.y) {
                
                boss.hp--;
                boss.hitTimer = 10; 
                hitSound.currentTime = 0;
                hitSound.play().catch(e => {}); 
                score += 50;
                bullets.splice(i, 1); 

                if (boss.hp <= 0) {
                    boss.active = false;
                    score += 5000; // Dobramos a recompensa por derrotar ele mais forte!
                }
                continue; 
            }
        }
        if (bullets[i] && bullets[i].y < -50) bullets.splice(i, 1);
    }

    // Atualiza Esferas do Boss (Agora com diagonal)
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        let bb = bossBullets[i];
        
        bb.x += bb.speedX; // Movimento horizontal da esfera
        bb.y += bb.speedY; // Movimento vertical da esfera

        // Remove se sair por baixo ou pelos lados
        if (bb.y > canvas.height || bb.x < -100 || bb.x > canvas.width) {
            bossBullets.splice(i, 1);
            continue;
        }

        // Colisão Esfera do Boss x Player
        if (player.x < bb.x + bb.width && player.x + player.width > bb.x &&
            player.y < bb.y + bb.height && player.y + player.height > bb.y) {
            bossBullets.splice(i, 1);
            danoPlayer(); 
        }
    }

    // Atualiza Inimigos Normais
    for (let i = enemies.length - 1; i >= 0; i--) {
        let en = enemies[i];
        en.y += en.speed;
        if (en.y > canvas.height) {
            enemies.splice(i, 1);
            continue;
        }

        let hitEnemy = false;
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (b.x < en.x + en.width && b.x + b.width > en.x &&
                b.y < en.y + en.height && b.y + b.height > en.y) {
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                hitEnemy = true;
                break;
            }
        }
        if (hitEnemy) continue;

        if (player.x < en.x + en.width && player.x + player.width > en.x &&
            player.y < en.y + en.height && player.y + player.height > en.y) {
            enemies.splice(i, 1);
            danoPlayer();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, bgY, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, bgY - canvas.height, canvas.width, canvas.height);

    if (gameState === 'START') {
        ctx.drawImage(startImg, 0, 0, canvas.width, canvas.height);
        
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
        // Esferas do Boss desenhadas abaixo do player
        bossBullets.forEach(bb => ctx.drawImage(bossProjectileImg, bb.x, bb.y, bb.width, bb.height));

        bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height));
        enemies.forEach(en => ctx.drawImage(en.img, en.x, en.y, en.width, en.height));
        
        // --- DESENHO DO BOSS ANIMADO ---
        if (boss.active && boss.hp > 0) {
            let framesAtuais = (boss.estadoAtual === 'atacando') ? bossAttackFrames : bossFrames;
            
            if (framesAtuais[boss.frameAtual]) {
                ctx.save(); 
                
                if (boss.hitTimer > 0) {
                    ctx.filter = 'brightness(50%) sepia(100%) hue-rotate(315deg) saturate(500%)';
                }
                
                ctx.drawImage(framesAtuais[boss.frameAtual], boss.x, boss.y, boss.width, boss.height);
                ctx.restore(); 
                
                // Barra de vida ajustada para divisão por 20 (vida máxima nova)
                ctx.fillStyle = "red";
                ctx.fillRect(boss.x + 50, boss.y - 20, 200 * (boss.hp / 20), 10);
            }
        }

        if (player.invulTimer > 0) ctx.globalAlpha = 0.5; 
        ctx.drawImage(player.isMoving ? shipMoving : shipNormal, player.x, player.y, player.width, player.height);
        ctx.globalAlpha = 1.0; 

        ctx.fillStyle = "white";
        ctx.font = "bold 25px Arial";
        ctx.fillText(`SCORE: ${score}`, 20, 40);
        ctx.fillStyle = "#ff4d4d";
        ctx.fillText(`VIDAS: ${"❤️".repeat(lives > 0 ? lives : 0)}`, 20, 80);
    }

    if (gameState === 'GAMEOVER') {
        ctx.drawImage(gameoverImg, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        
        ctx.font = "bold 50px Arial";
        ctx.fillText(`PONTUAÇÃO FINAL: ${score}`, canvas.width / 2, canvas.height - 120);
        
        ctx.font = "20px Arial";
        ctx.fillText("CLIQUE PARA VOLTAR AO MENU PRINCIPAL", canvas.width / 2, canvas.height - 80);
        
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