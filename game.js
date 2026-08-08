const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1200;
canvas.height = 675;

const jumpSound = new Audio("sounds/jump.wav");
const coinSound = new Audio("sounds/coin.wav");
const stompSound = new Audio("sounds/stomp.wav");
const deathSound = new Audio("sounds/death.wav");
const winSound = new Audio("sounds/win.wav");
const backgroundMusic = new Audio("sounds/music.mp3");

jumpSound.volume = 0.5;
coinSound.volume = 0.6;
stompSound.volume = 0.6;
deathSound.volume = 0.6;
winSound.volume = 0.7;
backgroundMusic.volume = 0.5;
backgroundMusic.loop = true;

let gameRunning = false;
let score = 0;
let coinsCollected = 0;
let lives = 3;
let cameraX = 0;

const keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.code] = true;

  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

const player = {
  x: 100,
  y: 400,
  width: 35,
  height: 50,
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumpPower: 14,
  gravity: 0.7,
  grounded: false,
  color: "#e63946",
};

const platforms = [
  { x: 0, y: 600, width: 900, height: 75 },
  { x: 1000, y: 600, width: 700, height: 75 },
  { x: 1800, y: 600, width: 900, height: 75 },
  { x: 300, y: 480, width: 180, height: 30 },
  { x: 650, y: 400, width: 180, height: 30 },
  { x: 1150, y: 480, width: 180, height: 30 },
  { x: 1450, y: 380, width: 180, height: 30 },
  { x: 1950, y: 470, width: 180, height: 30 },
  { x: 2350, y: 370, width: 180, height: 30 },
];

const coins = [
  { x: 350, y: 430, collected: false },
  { x: 700, y: 350, collected: false },
  { x: 1200, y: 430, collected: false },
  { x: 1500, y: 330, collected: false },
  { x: 2000, y: 420, collected: false },
  { x: 2400, y: 320, collected: false },
];

const enemies = [
  {
    x: 600,
    y: 550,
    width: 40,
    height: 40,
    velocityX: 2,
    startX: 550,
    endX: 850,
    alive: true,
  },
  {
    x: 1300,
    y: 550,
    width: 40,
    height: 40,
    velocityX: 2,
    startX: 1150,
    endX: 1650,
    alive: true,
  },
  {
    x: 2100,
    y: 550,
    width: 40,
    height: 40,
    velocityX: 2,
    startX: 1900,
    endX: 2600,
    alive: true,
  },
];

const goal = {
  x: 2600,
  y: 470,
  width: 40,
  height: 130,
};

function collision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updatePlayer() {
  player.velocityX = 0;

  if (keys["ArrowLeft"] || keys["KeyA"]) {
    player.velocityX = -player.speed;
  }

  if (keys["ArrowRight"] || keys["KeyD"]) {
    player.velocityX = player.speed;
  }

  if (
    (keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) &&
    player.grounded
  ) {
    player.velocityY = -player.jumpPower;
    player.grounded = false;

    jumpSound.currentTime = 0;
    jumpSound.play().catch(() => {});
  }

  player.velocityY += player.gravity;
  player.x += player.velocityX;
  player.y += player.velocityY;

  player.grounded = false;

  for (const platform of platforms) {
    if (
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y + player.height <= platform.y + 15 &&
      player.y + player.height + player.velocityY >= platform.y
    ) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.grounded = true;
    }
  }

  if (player.x < 0) {
    player.x = 0;
  }

  if (player.y > canvas.height + 100) {
    loseLife();
  }

  cameraX = player.x - canvas.width * 0.35;

  if (cameraX < 0) {
    cameraX = 0;
  }

  const maxCamera = 2700 - canvas.width;

  if (cameraX > maxCamera) {
    cameraX = maxCamera;
  }
}

function updateCoins() {
  for (const coin of coins) {
    if (coin.collected) {
      continue;
    }

    const coinBox = {
      x: coin.x - 15,
      y: coin.y - 15,
      width: 30,
      height: 30,
    };

    if (collision(player, coinBox)) {
      coin.collected = true;
      coinsCollected++;
      score += 100;

      coinSound.currentTime = 0;
      coinSound.play().catch(() => {});

      updateHUD();
    }
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    enemy.x += enemy.velocityX;

    if (enemy.x < enemy.startX || enemy.x > enemy.endX) {
      enemy.velocityX *= -1;
    }

    if (collision(player, enemy)) {
      if (
        player.velocityY > 0 &&
        player.y + player.height - enemy.y < 25
      ) {
        enemy.alive = false;
        player.velocityY = -10;
        score += 200;

        stompSound.currentTime = 0;
        stompSound.play().catch(() => {});

        updateHUD();
      } else {
        loseLife();
      }
    }
  }
}

function checkGoal() {
  if (collision(player, goal)) {
    winGame();
  }
}

function loseLife() {
  if (!gameRunning) {
    return;
  }

  deathSound.currentTime = 0;
  deathSound.play().catch(() => {});

  lives--;
  updateHUD();

  if (lives <= 0) {
    gameOver();
    return;
  }

  player.x = 100;
  player.y = 400;
  player.velocityX = 0;
  player.velocityY = 0;
  cameraX = 0;
}

function drawBackground() {
  ctx.fillStyle = "#79c7ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.8)";

  const clouds = [
    { x: 150, y: 100 },
    { x: 550, y: 160 },
    { x: 1000, y: 90 },
    { x: 1500, y: 140 },
    { x: 2100, y: 80 },
  ];

  for (const cloud of clouds) {
    const x = cloud.x - cameraX * 0.3;

    ctx.beginPath();

    ctx.arc(x, cloud.y, 30, 0, Math.PI * 2);
    ctx.arc(x + 35, cloud.y - 10, 40, 0, Math.PI * 2);
    ctx.arc(x + 75, cloud.y, 30, 0, Math.PI * 2);

    ctx.fill();
  }

  ctx.fillStyle = "#65a765";

  for (let x = -500; x < 3500; x += 500) {
    const screenX = x - cameraX * 0.5;

    ctx.beginPath();

    ctx.moveTo(screenX, 600);
    ctx.lineTo(screenX + 250, 300);
    ctx.lineTo(screenX + 500, 600);

    ctx.fill();
  }
}

function drawPlatforms() {
  for (const platform of platforms) {
    const x = platform.x - cameraX;

    ctx.fillStyle = "#7b4a24";

    ctx.fillRect(
      x,
      platform.y,
      platform.width,
      platform.height
    );

    ctx.fillStyle = "#45a049";

    ctx.fillRect(
      x,
      platform.y,
      platform.width,
      12
    );
  }
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y;

  ctx.fillStyle = player.color;

  ctx.fillRect(
    x,
    y + 15,
    player.width,
    player.height - 15
  );

  ctx.fillStyle = "#ffd0a8";

  ctx.fillRect(
    x + 5,
    y,
    25,
    20
  );

  ctx.fillStyle = "#b91c1c";

  ctx.fillRect(
    x + 3,
    y - 5,
    29,
    8
  );

  ctx.fillStyle = "#111";

  ctx.fillRect(
    x + 22,
    y + 7,
    4,
    4
  );
}

function drawCoins() {
  for (const coin of coins) {
    if (coin.collected) {
      continue;
    }

    const x = coin.x - cameraX;

    ctx.fillStyle = "#ffd43b";

    ctx.beginPath();

    ctx.arc(
      x,
      coin.y,
      12,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#d69e00";
    ctx.lineWidth = 3;

    ctx.stroke();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    const x = enemy.x - cameraX;

    ctx.fillStyle = "#633b8f";

    ctx.fillRect(
      x,
      enemy.y,
      enemy.width,
      enemy.height
    );

    ctx.fillStyle = "white";

    ctx.fillRect(
      x + 7,
      enemy.y + 8,
      8,
      8
    );

    ctx.fillRect(
      x + 25,
      enemy.y + 8,
      8,
      8
    );

    ctx.fillStyle = "#111";

    ctx.fillRect(
      x + 10,
      enemy.y + 10,
      4,
      4
    );

    ctx.fillRect(
      x + 28,
      enemy.y + 10,
      4,
      4
    );
  }
}

function drawGoal() {
  const x = goal.x - cameraX;

  ctx.fillStyle = "#eee";

  ctx.fillRect(
    x,
    goal.y,
    6,
    goal.height
  );

  ctx.fillStyle = "#ff4757";

  ctx.beginPath();

  ctx.moveTo(x + 6, goal.y);
  ctx.lineTo(x + 55, goal.y + 25);
  ctx.lineTo(x + 6, goal.y + 50);

  ctx.fill();
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawCoins();
  drawEnemies();
  drawGoal();
  drawPlayer();
}

function updateHUD() {
  const livesElement = document.getElementById("lives");
  const coinsElement = document.getElementById("coins");
  const scoreElement = document.getElementById("score");

  if (livesElement) {
    livesElement.textContent = lives;
  }

  if (coinsElement) {
    coinsElement.textContent = coinsCollected;
  }

  if (scoreElement) {
    scoreElement.textContent = score;
  }
}

function gameLoop() {
  if (!gameRunning) {
    return;
  }

  updatePlayer();
  updateCoins();
  updateEnemies();
  checkGoal();
  draw();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameRunning = true;

  backgroundMusic.currentTime = 0;
  backgroundMusic.play().catch(() => {});

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("gameOverScreen").classList.add("hidden");
  document.getElementById("winScreen").classList.add("hidden");

  resetGame();
  gameLoop();
}

function resetGame() {
  score = 0;
  coinsCollected = 0;
  lives = 3;
  cameraX = 0;

  player.x = 100;
  player.y = 400;
  player.velocityX = 0;
  player.velocityY = 0;

  for (const coin of coins) {
    coin.collected = false;
  }

  for (const enemy of enemies) {
    enemy.alive = true;
  }

  updateHUD();
}

function gameOver() {
  gameRunning = false;

  backgroundMusic.pause();

  document.getElementById("finalScore").textContent = score;

  document.getElementById("gameOverScreen").classList.remove("hidden");
}

function winGame() {
  gameRunning = false;

  backgroundMusic.pause();

  winSound.currentTime = 0;
  winSound.play().catch(() => {});

  document.getElementById("winScore").textContent = score;

  document.getElementById("winScreen").classList.remove("hidden");
}

document.getElementById("startButton").addEventListener(
  "click",
  startGame
);

document.getElementById("restartButton").addEventListener(
  "click",
  startGame
);

document.getElementById("playAgainButton").addEventListener(
  "click",
  startGame
);
