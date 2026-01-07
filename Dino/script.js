const board = document.getElementById("board");
const ctx = board.getContext("2d");

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

const CANVAS_H = 300;


const images = {};
const imageNames = [
  "track", "reset", "game-over",
  "dino-run1","dino-run2","dino-jump","dino-duck1","dino-duck2","dino-dead",
  "big-cactus1","big-cactus2","big-cactus3",
  "bird1","bird2","cloud"
];

let loaded = 0;
imageNames.forEach(n => {
  images[n] = new Image();
  images[n].src = `./Image/${n}.png`;
  images[n].onload = () => loaded++;
});


const trackH = 60;
let trackY = 0, groundY = 0, cactusY = 0;

function computeFloor(){
  trackY = board.height - trackH;
  groundY = trackY - 95;
  cactusY = trackY - 50;
}


const resetBtn = { x: 0, y: 10, w: 44, h: 44 };


const difficultyEl = document.getElementById("difficulty");
let difficulty = "normal";
difficultyEl.addEventListener("change", () => {
  difficulty = difficultyEl.value; 
});


function resizeCanvas(){
  board.width = window.innerWidth;
  board.height = CANVAS_H;

  computeFloor();

  resetBtn.x = board.width - resetBtn.w - 14;

  if (!gameOver){
    dino.y = groundY;
    dino.vy = 0;
  }
}
window.addEventListener("resize", resizeCanvas);


let gravity = 0.48;

let baseSpeedNormal = 5.0;
let baseSpeedHard   = 6.2;

let speed = baseSpeedNormal;

let score = 0;
let hiScore = 0;
let gameOver = false;

let trackOffset = 0;


let dino = { x: 70, y: 0, w: 88, h: 94, vy: 0 };
let isDucking = false;
let dinoFrame = 0;
let coyoteFrames = 0;


let cacti = [];
let birds = [];
let birdFrame = 0;


let lastSpawn = "none"; 
let spawnLock = 0;


setInterval(() => {
  if (gameOver) return;

  if (spawnLock > 0) { spawnLock--; return; }

  
  const cactusNearRight = cacti.some(c => c.x > board.width - 360);
  const birdNearRight   = birds.some(b => b.x > board.width - 360);

  
  const r = Math.random();

  if (!cactusNearRight && lastSpawn !== "cactus" && r < 0.70) {
    spawnCactus();
    lastSpawn = "cactus";
    spawnLock = 1;
  } else if (!birdNearRight && !cactusNearRight && lastSpawn !== "bird" && r >= 0.70) {
    spawnBird();
    lastSpawn = "bird";
    spawnLock = 1;
  }
}, 900);

function spawnCactus(){
  
  if (cacti.length && cacti[cacti.length - 1].x > board.width - 240) return;

  const pick = Math.floor(Math.random() * 3) + 1;
  const extraGap = 90 + Math.random() * 170;

  cacti.push({
    x: board.width + extraGap,
    y: cactusY,
    w: 75,
    h: 80,
    img: images[`big-cactus${pick}`]
  });

  if (cacti.length > 9) cacti.shift();
}

function spawnBird(){
  
  const extraGap = 120 + Math.random() * 220;
  birds.push({
    x: board.width + extraGap,
    y: groundY - (60 + Math.random() * 45),
    w: 60,
    h: 45
  });

  if (birds.length > 6) birds.shift();
}


function enforceMinGap(){
  birds = birds.filter(b => {
    return !cacti.some(c => Math.abs((c.x + c.w/2) - (b.x + b.w/2)) < 260);
  });
}


document.addEventListener("keydown", (e) => {
  if (e.code === "KeyR") restart();

  if (gameOver) return;

  if ((e.code === "Space" || e.code === "ArrowUp") && coyoteFrames > 0) {
    dino.vy = -13.2; 
    coyoteFrames = 0;
  }

  if (e.code === "ArrowDown" && dino.y === groundY) {
    isDucking = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown") isDucking = false;
});

board.addEventListener("click", (e) => {
  const r = board.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (board.width / r.width);
  const my = (e.clientY - r.top) * (board.height / r.height);

  if (mx >= resetBtn.x && mx <= resetBtn.x + resetBtn.w &&
      my >= resetBtn.y && my <= resetBtn.y + resetBtn.h) {
    restart();
  }
});


function drawDesertBackground(){
  ctx.fillStyle = "#dff6ff";
  ctx.fillRect(0,0,board.width,board.height);

  
  drawCloud(board.width * 0.22, 60, 1.0);
  drawCloud(board.width * 0.70, 85, 0.95);
  drawCloud(board.width * 0.86, 62, 1.05);

  
  drawDune(155, "rgba(180, 220, 225, 0.55)");
  drawDune(175, "rgba(160, 205, 210, 0.35)");

  
  drawFarCactus(board.width * 0.12, 178, 0.9);
  drawFarCactus(board.width * 0.56, 190, 0.65);
  drawFarCactus(board.width * 0.82, 174, 0.8);

  drawTrackSubtle();
}

function drawCloud(x, y, s){
  
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.95;
  ctx.translate(x, y);
  ctx.scale(s, s);

  blob(0,0,18);
  blob(18,-8,22);
  blob(45,0,16);
  blob(24,10,18);

  ctx.restore();

  function blob(cx, cy, r){
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawDune(y, color){
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.quadraticCurveTo(board.width*0.28, y - 25, board.width*0.56, y);
  ctx.quadraticCurveTo(board.width*0.84, y - 35, board.width*1.2, y);
  ctx.lineTo(board.width, board.height);
  ctx.lineTo(0, board.height);
  ctx.closePath();
  ctx.fill();
}

function drawFarCactus(x, y, s){
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.translate(x, y);
  ctx.scale(s, s);

  ctx.beginPath();
  ctx.roundRect(-6, -30, 12, 40, 6);
  ctx.roundRect(-18, -18, 10, 18, 5);
  ctx.roundRect(8, -22, 10, 22, 5);
  ctx.fill();

  ctx.restore();
}

function drawTrackSubtle(){
  const t = images["track"];
  if (!t) return;

  trackOffset = (trackOffset + speed * 0.55) % t.width;
  ctx.drawImage(t, -trackOffset, trackY, t.width, trackH);
  ctx.drawImage(t, t.width - trackOffset, trackY, t.width, trackH);

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, trackY, board.width, 2);
}


function drawDino(dead){
  let img;
  if (dead) img = images["dino-dead"];
  else if (dino.y < groundY) img = images["dino-jump"];
  else if (isDucking) img = (dinoFrame % 20 < 10) ? images["dino-duck1"] : images["dino-duck2"];
  else img = (dinoFrame % 20 < 10) ? images["dino-run1"] : images["dino-run2"];

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 3;

  if (!dead && isDucking && dino.y === groundY){
    ctx.drawImage(img, dino.x, dino.y + 24, dino.w, 70);
  } else {
    ctx.drawImage(img, dino.x, dino.y, dino.w, dino.h);
  }
  ctx.restore();
  dinoFrame++;
}

function drawCacti(shadow){
  for (let c of cacti){
    if (shadow){
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.22)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(c.img, c.x, c.y, c.w, c.h);
      ctx.restore();
    } else {
      ctx.drawImage(c.img, c.x, c.y, c.w, c.h);
    }
  }
}

function drawBirds(){
  for (let b of birds){
    const img = (birdFrame % 20 < 10) ? images["bird1"] : images["bird2"];
    ctx.drawImage(img, b.x, b.y, b.w, b.h);
  }
  birdFrame++;
}


function getDinoHitbox(){
  let x = dino.x + 12;
  let y = dino.y + 10;
  let w = 60;
  let h = 75;

  if (isDucking && dino.y === groundY){
    y = dino.y + 35;
    h = 50;
  }
  return { x, y, width: w, height: h };
}

function collideRect(a, b){
  return (
    a.x < b.x + b.w &&
    a.x + a.width > b.x &&
    a.y < b.y + b.h &&
    a.y + a.height > b.y
  );
}


function drawGameOver(){
  ctx.drawImage(images["game-over"], board.width/2 - 160, 95, 320, 80);

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.font = "14px Courier New";
  ctx.fillText("Press R or click 🔄 to restart", board.width/2 - 130, 185);
}


function restart(){
  gameOver = false;
  score = 0;
  speed = (difficulty === "hard") ? baseSpeedHard : baseSpeedNormal;

  dino.y = groundY;
  dino.vy = 0;
  isDucking = false;
  coyoteFrames = 0;

  cacti = [];
  birds = [];
  trackOffset = 0;

  lastSpawn = "none";
  spawnLock = 0;
}


function loop(){
  requestAnimationFrame(loop);

  if (loaded < imageNames.length){
    ctx.clearRect(0,0,board.width,board.height);
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.font = "20px Courier New";
    ctx.fillText("Loading...", 20, 40);
    return;
  }

  drawDesertBackground();

  
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.font = "20px Courier New";
  const hud = `HI ${String(hiScore).padStart(6,"0")}   ${String(score).padStart(6,"0")}`;
  ctx.fillText(hud, board.width - 340, 28);

  
  ctx.drawImage(images["reset"], resetBtn.x, resetBtn.y, resetBtn.w, resetBtn.h);

  if (gameOver){
    drawDino(true);
    drawCacti(false);
    drawBirds();
    drawGameOver();
    return;
  }

  
  const base = (difficulty === "hard") ? baseSpeedHard : baseSpeedNormal;
  const accel = (difficulty === "hard") ? 0.55 : 0.35; // HARD accelerates faster
  speed = Math.min(12.0, base + (score / 700) * accel);

  
  if (dino.y === groundY) coyoteFrames = 7;
  else coyoteFrames--;

  
  dino.vy += gravity;
  dino.y = Math.min(groundY, dino.y + dino.vy);
  if (dino.y === groundY) dino.vy = 0;

  
  for (let c of cacti) c.x -= speed;
  cacti = cacti.filter(c => c.x > -220);

  for (let b of birds) b.x -= (speed + 0.6);
  birds = birds.filter(b => b.x > -220);

  
  enforceMinGap();

  
  const hb = getDinoHitbox();

  for (let c of cacti){
    if (collideRect(hb, c)){
      gameOver = true;
      hiScore = Math.max(hiScore, score);
    }
  }
  for (let b of birds){
    if (collideRect(hb, b)){
      gameOver = true;
      hiScore = Math.max(hiScore, score);
    }
  }

  
  drawBirds();
  drawDino(false);
  drawCacti(true);

  score++;
}


function start(){
  resizeCanvas();
  dino.y = groundY;
  speed = baseSpeedNormal;
  requestAnimationFrame(loop);
}
start();
