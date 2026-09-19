/* =========================================================
   SCORVEX V5
   ULTIMATE ARENA
   ========================================================= */

"use strict";

/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const bootScreen = $("bootScreen");
const mainMenu = $("mainMenu");
const gameScreen = $("gameScreen");

const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

const modal = $("modal");
const modalTitle = $("modalTitle");
const modalBody = $("modalBody");

const pauseModal = $("pauseModal");
const notificationContainer = $("notificationContainer");

/* =========================================================
   AUDIO
   Música procedural SYNTHWAVE
========================================================= */

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;

let musicEnabled = true;
let soundEnabled = true;
let musicTimer = null;
let musicStep = 0;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    masterGain = audioCtx.createGain();
    musicGain = audioCtx.createGain();
    sfxGain = audioCtx.createGain();

    masterGain.gain.value = 0.8;
    musicGain.gain.value = 0.10;
    sfxGain.gain.value = 0.18;

    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function tone(
  frequency,
  duration = 0.1,
  type = "square",
  volume = 0.05,
  destination = sfxGain
) {
  if (!soundEnabled || !audioCtx || !destination) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(volume, 0.001),
    audioCtx.currentTime + 0.01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + duration
  );

  osc.connect(gain);
  gain.connect(destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration + 0.02);
}

/* Música electrónica/synthwave */
const synthNotes = [
  110, 146.83, 164.81, 220,
  146.83, 196, 220, 293.66,
  164.81, 220, 246.94, 329.63,
  146.83, 196, 220, 293.66
];

function musicTick() {
  if (!musicEnabled || !audioCtx || !musicGain) return;

  const note = synthNotes[musicStep % synthNotes.length];

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(note, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.12,
    audioCtx.currentTime + 0.02
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + 0.23
  );

  osc.connect(gain);
  gain.connect(musicGain);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);

  /* Bajo */
  if (musicStep % 4 === 0) {
    const bass = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();

    bass.type = "square";
    bass.frequency.value = note / 2;

    bassGain.gain.setValueAtTime(
      0.0001,
      audioCtx.currentTime
    );

    bassGain.gain.exponentialRampToValueAtTime(
      0.08,
      audioCtx.currentTime + 0.01
    );

    bassGain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + 0.35
    );

    bass.connect(bassGain);
    bassGain.connect(musicGain);

    bass.start();
    bass.stop(audioCtx.currentTime + 0.37);
  }

  musicStep++;
}

function startMusic() {
  initAudio();

  if (musicTimer) return;

  musicTick();

  musicTimer = setInterval(
    musicTick,
    250
  );
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

function toggleMusic() {
  musicEnabled = !musicEnabled;

  if (musicEnabled) {
    startMusic();
    notify("🎵 Música activada");
  } else {
    stopMusic();
    notify("🔇 Música desactivada");
  }

  updateMusicButtons();
}

function updateMusicButtons() {
  const icon = musicEnabled ? "🎵" : "🔇";

  if ($("musicBtn")) $("musicBtn").textContent = icon;
  if ($("musicGameBtn")) $("musicGameBtn").textContent = icon;
}

/* =========================================================
   DATOS DEL JUGADOR
========================================================= */

const defaultSave = {
  coins: 500,
  crystals: 10,

  level: 1,
  xp: 0,
  score: 0,

  weapon: "nova",
  ability: "nova",
  armor: "none",

  ownedWeapons: ["nova"],
  ownedAbilities: ["nova"],
  ownedArmors: ["none"],

  helmets: [],
  gloves: [],
  boots: [],
  cores: [],

  medkits: 2,
  energyKits: 1,
  shieldKits: 0,
  repairKits: 0,

  inventory: [],

  sector: 1,
  wave: 1,

  soundEnabled: true,
  musicEnabled: true
};

let saveData;

function loadSave() {
  try {
    const stored = localStorage.getItem(
      "scorvex_v5_save"
    );

    if (stored) {
      saveData = {
        ...defaultSave,
        ...JSON.parse(stored)
      };
    } else {
      saveData = structuredClone(defaultSave);
    }
  } catch {
    saveData = structuredClone(defaultSave);
  }

  musicEnabled = saveData.musicEnabled;
  soundEnabled = saveData.soundEnabled;
}

function saveGame() {
  saveData.musicEnabled = musicEnabled;
  saveData.soundEnabled = soundEnabled;

  localStorage.setItem(
    "scorvex_v5_save",
    JSON.stringify(saveData)
  );

  notify("💾 Progreso guardado");
}

/* =========================================================
   ARMAS
========================================================= */

const weapons = {

  nova: {
    name: "NOVA BLADE",
    icon: "⚔️",
    price: 0,
    damage: 28,
    cooldown: 260,
    range: 105,
    type: "melee",
    rarity: "common"
  },

  plasma: {
    name: "PLASMA RIFLE",
    icon: "🔫",
    price: 180,
    damage: 22,
    cooldown: 180,
    range: 550,
    speed: 760,
    type: "projectile",
    rarity: "rare"
  },

  shotgun: {
    name: "VOID SHOTGUN",
    icon: "💥",
    price: 280,
    damage: 13,
    cooldown: 650,
    range: 300,
    speed: 600,
    pellets: 7,
    type: "shotgun",
    rarity: "rare"
  },

  cryo: {
    name: "CRYO CANNON",
    icon: "❄️",
    price: 350,
    damage: 25,
    cooldown: 400,
    range: 500,
    speed: 650,
    slow: 0.45,
    type: "cryo",
    rarity: "epic"
  },

  arc: {
    name: "ARC BLASTER",
    icon: "⚡",
    price: 450,
    damage: 35,
    cooldown: 550,
    range: 420,
    chain: 3,
    type: "arc",
    rarity: "epic"
  },

  phantom: {
    name: "PHANTOM SMG",
    icon: "👻",
    price: 520,
    damage: 17,
    cooldown: 90,
    range: 470,
    speed: 820,
    type: "projectile",
    rarity: "legendary"
  },

  solar: {
    name: "SOLAR RIFLE",
    icon: "☀️",
    price: 700,
    damage: 48,
    cooldown: 500,
    range: 650,
    speed: 900,
    type: "projectile",
    rarity: "legendary"
  },

  thunder: {
    name: "THUNDER RIFLE",
    icon: "🌩️",
    price: 820,
    damage: 55,
    cooldown: 650,
    range: 550,
    chain: 4,
    type: "arc",
    rarity: "mythic"
  },

  vortex: {
    name: "VORTEX GUN",
    icon: "🌀",
    price: 950,
    damage: 62,
    cooldown: 700,
    range: 600,
    speed: 500,
    type: "vortex",
    rarity: "mythic"
  },

  quantum: {
    name: "QUANTUM BLASTER",
    icon: "🟣",
    price: 1200,
    damage: 80,
    cooldown: 550,
    range: 700,
    speed: 1000,
    type: "projectile",
    rarity: "mythic"
  },

  omega: {
    name: "OMEGA SCORVEX",
    icon: "👑",
    price: 2000,
    damage: 120,
    cooldown: 500,
    range: 750,
    speed: 1100,
    type: "omega",
    rarity: "omega"
  }
};

/* =========================================================
   HABILIDADES
========================================================= */

const abilities = {

  nova: {
    name: "NOVA",
    icon: "💫",
    price: 0,
    energy: 30,
    cooldown: 3000,
    description: "Pulso de energía alrededor del jugador."
  },

  dash: {
    name: "PHASE DASH",
    icon: "💨",
    price: 150,
    energy: 15,
    cooldown: 1400,
    description: "Movimiento rápido en la dirección actual."
  },

  freeze: {
    name: "TIME FREEZE",
    icon: "❄️",
    price: 280,
    energy: 45,
    cooldown: 7000,
    description: "Reduce enormemente la velocidad de los enemigos."
  },

  storm: {
    name: "ENERGY STORM",
    icon: "🌩️",
    price: 450,
    energy: 55,
    cooldown: 9000,
    description: "Genera pulsos de energía durante varios segundos."
  },

  shield: {
    name: "SHIELD CORE",
    icon: "🛡️",
    price: 400,
    energy: 35,
    cooldown: 8000,
    description: "Activa un escudo temporal."
  },

  meteor: {
    name: "METEOR STRIKE",
    icon: "☄️",
    price: 650,
    energy: 70,
    cooldown: 10000,
    description: "Lluvia de impactos energéticos."
  },

  clone: {
    name: "CLONE DECOY",
    icon: "👤",
    price: 550,
    energy: 40,
    cooldown: 8500,
    description: "Crea un señuelo holográfico."
  },

  emp: {
    name: "EMP PULSE",
    icon: "🔵",
    price: 700,
    energy: 50,
    cooldown: 8000,
    description: "Desactiva temporalmente a los enemigos."
  },

  overdrive: {
    name: "OVERDRIVE",
    icon: "🔥",
    price: 900,
    energy: 60,
    cooldown: 12000,
    description: "Aumenta el poder de ataque temporalmente."
  },

  blackhole: {
    name: "BLACK HOLE",
    icon: "🌑",
    price: 1500,
    energy: 85,
    cooldown: 15000,
    description: "Atrae enemigos hacia un punto."
  }
};

/* =========================================================
   ARMADURAS
========================================================= */

const armors = {

  none: {
    name: "SIN ARMADURA",
    icon: "▫️",
    price: 0,
    defense: 0,
    energy: 0,
    rarity: "common"
  },

  light: {
    name: "ARMADURA LIGERA",
    icon: "🛡️",
    price: 220,
    defense: 10,
    energy: 10,
    rarity: "common"
  },

  tactical: {
    name: "ARMADURA TÁCTICA",
    icon: "🛡️",
    price: 500,
    defense: 22,
    energy: 15,
    rarity: "rare"
  },

  heavy: {
    name: "ARMADURA PESADA",
    icon: "🛡️",
    price: 800,
    defense: 35,
    energy: -10,
    rarity: "epic"
  },

  energy: {
    name: "ARMADURA ENERGÉTICA",
    icon: "⚡",
    price: 1100,
    defense: 30,
    energy: 35,
    rarity: "legendary"
  },

  titan: {
    name: "ARMADURA TITAN",
    icon: "👑",
    price: 1800,
    defense: 50,
    energy: 30,
    rarity: "omega"
  }
};

/* =========================================================
   CONSUMIBLES
========================================================= */

const consumables = {

  medkit: {
    name: "BOTIQUÍN",
    icon: "🩹",
    price: 80,
    description: "+35 VIDA"
  },

  largeMedkit: {
    name: "BOTIQUÍN GRANDE",
    icon: "🧰",
    price: 160,
    description: "+70 VIDA"
  },

  energyKit: {
    name: "KIT DE ENERGÍA",
    icon: "🔋",
    price: 100,
    description: "+50 ENERGÍA"
  },

  shieldKit: {
    name: "ESCUDO INSTANTÁNEO",
    icon: "🔰",
    price: 180,
    description: "Activa protección temporal"
  },

  repairKit: {
    name: "REPARADOR",
    icon: "🔧",
    price: 140,
    description: "Repara la armadura"
  }
};

/* =========================================================
   ESTADO DEL JUEGO
========================================================= */

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,

  radius: 18,

  hp: 100,
  maxHp: 100,

  energy: 100,
  maxEnergy: 100,

  dirX: 1,
  dirY: 0,

  speed: 250,

  attackReady: true,

  abilityReady: true,
  abilityCooldown: 0,

  shield: 0,
  shieldMax: 0,

  overdrive: 0,
  freezeTimer: 0,

  invulnerable: 0
};

let enemies = [];
let projectiles = [];
let particles = [];

let gameRunning = false;
let paused = false;

let lastTime = 0;
let enemySpawnTimer = 0;

let combo = 1;
let comboTimer = 0;

let missionKills = 0;
let totalKills = 0;


/* =========================================================
   ENEMIGOS
========================================================= */

const enemyTypes = {

  drone: {
    name: "DRONE",
    hp: 35,
    speed: 90,
    damage: 8,
    radius: 14,
    color: "#39e7ff",
    reward: 20
  },

  hunter: {
    name: "CAZADOR",
    hp: 60,
    speed: 120,
    damage: 12,
    radius: 17,
    color: "#9b5cff",
    reward: 35
  },

  tank: {
    name: "TANQUE",
    hp: 150,
    speed: 50,
    damage: 20,
    radius: 27,
    color: "#ff8a3d",
    reward: 70
  },

  guardian: {
    name: "GUARDIÁN",
    hp: 250,
    speed: 65,
    damage: 25,
    radius: 30,
    color: "#ff4b67",
    reward: 120
  }
};

function spawnEnemy(typeName = "drone") {

  const type =
    enemyTypes[typeName] ||
    enemyTypes.drone;

  const side = Math.floor(
    Math.random() * 4
  );

  let x;
  let y;

  if (side === 0) {
    x = Math.random() * canvas.width;
    y = -30;
  } else if (side === 1) {
    x = canvas.width + 30;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 30;
  } else {
    x = -30;
    y = Math.random() * canvas.height;
  }

  enemies.push({
    x,
    y,
    hp: type.hp,
    maxHp: type.hp,
    speed: type.speed,
    damage: type.damage,
    radius: type.radius,
    color: type.color,
    reward: type.reward,
    name: type.name,
    slow: 0,
    stun: 0
  });
}


/* =========================================================
   PROJECTILES
========================================================= */

function createProjectile(
  x,
  y,
  dx,
  dy,
  damage,
  color,
  speed,
  size = 5,
  effect = null
) {

  const length = Math.hypot(dx, dy) || 1;

  projectiles.push({
    x,
    y,
    dx: dx / length,
    dy: dy / length,
    damage,
    color,
    speed,
    size,
    effect,
    life: 1.4
  });
}


/* =========================================================
   ATAQUE
========================================================= */

function attack() {

  if (!gameRunning || paused) return;
  if (!player.attackReady) return;

  initAudio();

  const weapon =
    weapons[saveData.weapon];

  player.attackReady = false;

  setTimeout(() => {
    player.attackReady = true;
  }, weapon.cooldown);

  tone(
    weapon.type === "melee" ? 260 : 520,
    0.07,
    weapon.type === "melee"
      ? "triangle"
      : "sawtooth",
    0.08
  );

  let damage =
    weapon.damage;

  if (player.overdrive > 0) {
    damage *= 1.7;
  }

  if (weapon.type === "melee") {

    let target = null;
    let closest = Infinity;

    for (const enemy of enemies) {

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;

      const distance = Math.hypot(dx, dy);

      if (
        distance <= weapon.range &&
        distance < closest
      ) {
        closest = distance;
        target = enemy;
      }
    }

    if (target) {
      damageEnemy(target, damage);
      createHitParticles(
        target.x,
        target.y,
        "#39e7ff"
      );
    }

    return;
  }

  if (
    weapon.type === "projectile" ||
    weapon.type === "omega"
  ) {

    createProjectile(
      player.x,
      player.y,
      player.dirX,
      player.dirY,
      damage,
      weapon.type === "omega"
        ? "#39e7ff"
        : "#65ff9a",
      weapon.speed,
      weapon.type === "omega" ? 9 : 5
    );

    return;
  }

  if (weapon.type === "shotgun") {

    const baseAngle =
      Math.atan2(
        player.dirY,
        player.dirX
      );

    for (
      let i = 0;
      i < weapon.pellets;
      i++
    ) {

      const spread =
        (Math.random() - 0.5) *
        0.65;

      const angle =
        baseAngle + spread;

      createProjectile(
        player.x,
        player.y,
        Math.cos(angle),
        Math.sin(angle),
        damage,
        "#ffb84a",
        weapon.speed,
        4
      );
    }

    return;
  }

  if (weapon.type === "cryo") {

    createProjectile(
      player.x,
      player.y,
      player.dirX,
      player.dirY,
      damage,
      "#9dfcff",
      weapon.speed,
      7,
      "slow"
    );

    return;
  }

  if (weapon.type === "arc") {

    const targets = [...enemies]
      .sort((a, b) => {
        const da =
          Math.hypot(
            a.x - player.x,
            a.y - player.y
          );

        const db =
          Math.hypot(
            b.x - player.x,
            b.y - player.y
          );

        return da - db;
      })
      .filter(enemy =>
        Math.hypot(
          enemy.x - player.x,
          enemy.y - player.y
        ) <= weapon.range
      )
      .slice(0, weapon.chain);

    for (const target of targets) {

      damageEnemy(
        target,
        damage
      );

      createHitParticles(
        target.x,
        target.y,
        "#7d8cff"
      );
    }

    return;
  }

  if (weapon.type === "vortex") {

    createProjectile(
      player.x,
      player.y,
      player.dirX,
      player.dirY,
      damage,
      "#b45cff",
      weapon.speed,
      12,
      "vortex"
    );
  }
}


/* =========================================================
   DAÑO A ENEMIGO
========================================================= */

function damageEnemy(enemy, amount) {

  enemy.hp -= amount;

  createHitParticles(
    enemy.x,
    enemy.y,
    enemy.color
  );

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  }
}

function killEnemy(enemy) {

  const index =
    enemies.indexOf(enemy);

  if (index === -1) return;

  enemies.splice(index, 1);

  totalKills++;
  missionKills++;

  combo =
    Math.min(combo + 0.25, 8);

  comboTimer = 2.5;

  const reward =
    Math.floor(
      enemy.reward * combo
    );

  saveData.coins += reward;
  saveData.score += reward * 10;

  gainXP(
    15 + saveData.sector * 5
  );

  createHitParticles(
    enemy.x,
    enemy.y,
    "#ffffff",
    16
  );

  tone(
    720,
    0.08,
    "square",
    0.07
  );

  if (
    Math.random() < 0.08
  ) {
    saveData.crystals++;
    notify("💎 ¡Cristal encontrado!");
  }

  if (
    Math.random() < 0.06
  ) {
    saveData.medkits++;
    notify("🩹 ¡Botiquín encontrado!");
  }

  if (
    missionKills >=
    10 + saveData.sector * 5
  ) {

    missionKills = 0;

    saveData.coins += 100;

    notify(
      "🎯 Misión completada +100 monedas"
    );
  }

  updateHUD();
}


/* =========================================================
   HABILIDADES
========================================================= */

function useAbility() {

  if (!gameRunning || paused) return;

  const ability =
    abilities[saveData.ability];

  if (!player.abilityReady) {
    notify("⏳ Habilidad en enfriamiento");
    return;
  }

  if (
    player.energy <
    ability.energy
  ) {
    notify("⚡ No tienes suficiente energía");
    return;
  }

  initAudio();

  player.energy -=
    ability.energy;

  player.abilityReady = false;
  player.abilityCooldown =
    ability.cooldown;

  setTimeout(() => {
    player.abilityReady = true;
  }, ability.cooldown);

  tone(
    880,
    0.2,
    "sawtooth",
    0.10
  );

  const id =
    saveData.ability;

  if (id === "nova") {
    abilityNova();
  }

  if (id === "dash") {
    abilityDash();
  }

  if (id === "freeze") {
    abilityFreeze();
  }

  if (id === "storm") {
    abilityStorm();
  }

  if (id === "shield") {
    abilityShield();
  }

  if (id === "meteor") {
    abilityMeteor();
  }

  if (id === "clone") {
    abilityClone();
  }

  if (id === "emp") {
    abilityEMP();
  }

  if (id === "overdrive") {
    abilityOverdrive();
  }

  if (id === "blackhole") {
    abilityBlackHole();
  }

  updateHUD();
}

function abilityNova() {

  const radius = 170;

  for (const enemy of [...enemies]) {

    const d =
      Math.hypot(
        enemy.x - player.x,
        enemy.y - player.y
      );

    if (d <= radius) {
      damageEnemy(
        enemy,
        65
      );
    }
  }

  createExplosion(
    player.x,
    player.y,
    radius,
    "#39e7ff"
  );
}

function abilityDash() {

  player.invulnerable = 0.35;

  player.x +=
    player.dirX * 180;

  player.y +=
    player.dirY * 180;

  clampPlayer();

  createExplosion(
    player.x,
    player.y,
    50,
    "#9b5cff"
  );
}

function abilityFreeze() {

  player.freezeTimer = 4;

  for (const enemy of enemies) {
    enemy.slow = 0.15;
  }

  createExplosion(
    player.x,
    player.y,
    240,
    "#9dfcff"
  );

  notify("❄️ ENEMIGOS CONGELADOS");
}

function abilityStorm() {

  let pulses = 0;

  const storm =
    setInterval(() => {

      if (!gameRunning) {
        clearInterval(storm);
        return;
      }

      pulses++;

      for (const enemy of [...enemies]) {

        const d =
          Math.hypot(
            enemy.x - player.x,
            enemy.y - player.y
          );

        if (d < 260) {
          damageEnemy(
            enemy,
            35
          );
        }
      }

      createExplosion(
        player.x,
        player.y,
        260,
        "#7d8cff"
      );

      if (pulses >= 8) {
        clearInterval(storm);
      }

    }, 450);
}

function abilityShield() {

  player.shield =
    100;

  player.shieldMax =
    100;

  createExplosion(
    player.x,
    player.y,
    75,
    "#49ff9a"
  );

  notify("🛡️ ESCUDO ACTIVADO");
}

function abilityMeteor() {

  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const target =
      enemies[
        Math.floor(
          Math.random() *
          enemies.length
        )
      ];

    if (!target) continue;

    setTimeout(() => {

      damageEnemy(
        target,
        90
      );

      createExplosion(
        target.x,
        target.y,
        70,
        "#ff8a3d"
      );

    }, i * 180);
  }
}

function abilityClone() {

  notify(
    "👤 SEÑUELO HOLOGRÁFICO ACTIVADO"
  );

  for (const enemy of enemies) {
    enemy.stun = 1.5;
  }
}

function abilityEMP() {

  for (const enemy of enemies) {
    enemy.stun = 3;
  }

  createExplosion(
    player.x,
    player.y,
    300,
    "#39e7ff"
  );

  notify("🔵 EMP ACTIVADO");
}

function abilityOverdrive() {

  player.overdrive = 7;

  createExplosion(
    player.x,
    player.y,
    90,
    "#ff4b67"
  );

  notify(
    "🔥 OVERDRIVE ACTIVADO"
  );
}

function abilityBlackHole() {

  const bx =
    player.x +
    player.dirX * 200;

  const by =
    player.y +
    player.dirY * 200;

  let pulses = 0;

  const blackHole =
    setInterval(() => {

      pulses++;

      for (const enemy of enemies) {

        const dx =
          bx - enemy.x;

        const dy =
          by - enemy.y;

        const distance =
          Math.hypot(dx, dy) || 1;

        enemy.x +=
          (dx / distance) * 20;

        enemy.y +=
          (dy / distance) * 20;

        if (distance < 70) {
          damageEnemy(
            enemy,
            45
          );
        }
      }

      createExplosion(
        bx,
        by,
        75,
        "#a95cff"
      );

      if (pulses >= 12) {
        clearInterval(blackHole);
      }

    }, 300);
}


/* =========================================================
   BOTIQUINES
========================================================= */

function useMedkit() {

  if (saveData.medkits <= 0) {
    notify("🩹 No tienes botiquines");
    return;
  }

  if (
    player.hp >=
    player.maxHp
  ) {
    notify("❤️ Tu vida ya está completa");
    return;
  }

  saveData.medkits--;

  player.hp =
    Math.min(
      player.maxHp,
      player.hp + 35
    );

  tone(
    620,
    0.18,
    "sine",
    0.08
  );

  notify(
    "🩹 +35 VIDA"
  );

  updateHUD();
}


/* =========================================================
   MOVIMIENTO
========================================================= */

const keys = {};

window.addEventListener(
  "keydown",
  (event) => {

    keys[event.key.toLowerCase()] = true;

    if (
      event.key === " "
    ) {
      event.preventDefault();
      attack();
    }

    if (
      event.key.toLowerCase() === "q"
    ) {
      useAbility();
    }

    if (
      event.key.toLowerCase() === "h"
    ) {
      useMedkit();
    }

    if (
      event.key.toLowerCase() === "i"
    ) {
      openInventory();
    }

    if (
      event.key.toLowerCase() === "b"
    ) {
      openShop();
    }

    if (
      event.key === "Escape"
    ) {
      togglePause();
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    keys[event.key.toLowerCase()] =
      false;
  }
);

function updatePlayer(dt) {

  let dx = 0;
  let dy = 0;

  if (keys["w"]) dy--;
  if (keys["s"]) dy++;
  if (keys["a"]) dx--;
  if (keys["d"]) dx++;

  if (dx || dy) {

    const length =
      Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    player.dirX = dx;
    player.dirY = dy;

    player.x +=
      dx * player.speed * dt;

    player.y +=
      dy * player.speed * dt;
  }

  clampPlayer();

  player.invulnerable =
    Math.max(
      0,
      player.invulnerable - dt
    );

  player.overdrive =
    Math.max(
      0,
      player.overdrive - dt
    );

  player.energy =
    Math.min(
      player.maxEnergy,
      player.energy + 12 * dt
    );
}

function clampPlayer() {

  player.x =
    Math.max(
      player.radius,
      Math.min(
        canvas.width - player.radius,
        player.x
      )
    );

  player.y =
    Math.max(
      player.radius,
      Math.min(
        canvas.height - player.radius,
        player.y
      )
    );
}


/* =========================================================
   ACTUALIZAR ENEMIGOS
========================================================= */

function updateEnemies(dt) {

  for (const enemy of enemies) {

    enemy.stun =
      Math.max(
        0,
        enemy.stun - dt
      );

    enemy.slow =
      Math.min(
        1,
        Math.max(
          0,
          enemy.slow - dt * 0.12
        )
      );

    if (enemy.stun > 0) {
      continue;
    }

    const dx =
      player.x - enemy.x;

    const dy =
      player.y - enemy.y;

    const distance =
      Math.hypot(dx, dy) || 1;

    const slowMultiplier =
      enemy.slow || 0;

    const speed =
      enemy.speed *
      (1 - slowMultiplier);

    if (distance > 35) {

      enemy.x +=
        (dx / distance) *
        speed *
        dt;

      enemy.y +=
        (dy / distance) *
        speed *
        dt;

    } else {

      damagePlayer(
        enemy.damage * dt
      );
    }
  }
}


/* =========================================================
   DAÑO AL JUGADOR
========================================================= */

function damagePlayer(amount) {

  if (
    player.invulnerable > 0
  ) {
    return;
  }

  if (player.shield > 0) {

    const absorbed =
      Math.min(
        player.shield,
        amount
      );

    player.shield -=
      absorbed;

    amount -=
      absorbed;
  }

  if (amount <= 0) {
    return;
  }

  const armor =
    armors[saveData.armor];

  const reduction =
    armor.defense / 100;

  amount *=
    1 - reduction;

  player.hp -= amount;

  player.invulnerable =
    0.25;

  if (player.hp <= 0) {
    player.hp = 0;
    gameOver();
  }

  updateHUD();
}


/* =========================================================
   PROJECTILES
========================================================= */

function updateProjectiles(dt) {

  for (
    let i = projectiles.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      projectiles[i];

    p.x +=
      p.dx *
      p.speed *
      dt;

    p.y +=
      p.dy *
      p.speed *
      dt;

    p.life -= dt;

    let hit = false;

    for (const enemy of [...enemies]) {

      const distance =
        Math.hypot(
          enemy.x - p.x,
          enemy.y - p.y
        );

      if (
        distance <
        enemy.radius + p.size
      ) {

        damageEnemy(
          enemy,
          p.damage
        );

        if (
          p.effect === "slow"
        ) {
          enemy.slow =
            0.65;
        }

        if (
          p.effect === "vortex"
        ) {
          enemy.stun =
            0.8;
        }

        hit = true;
        break;
      }
    }

    if (
      hit ||
      p.life <= 0 ||
      p.x < -50 ||
      p.x > canvas.width + 50 ||
      p.y < -50 ||
      p.y > canvas.height + 50
    ) {

      projectiles.splice(
        i,
        1
      );
    }
  }
}


/* =========================================================
   XP / NIVEL
========================================================= */

function gainXP(amount) {

  saveData.xp += amount;

  const needed =
    saveData.level * 100;

  if (
    saveData.xp >= needed
  ) {

    saveData.xp -= needed;

    saveData.level++;

    player.maxHp += 10;
    player.maxEnergy += 5;

    player.hp =
      player.maxHp;

    player.energy =
      player.maxEnergy;

    saveData.coins += 150;

    notify(
      `⭐ ¡NIVEL ${saveData.level}! +150 monedas`
    );

    tone(
      1000,
      0.4,
      "triangle",
      0.1
    );
  }
}


/* =========================================================
   PARTÍCULAS
========================================================= */

function createHitParticles(
  x,
  y,
  color,
  amount = 6
) {

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    particles.push({
      x,
      y,
      dx:
        (Math.random() - 0.5) * 180,
      dy:
        (Math.random() - 0.5) * 180,
      life: 0.4 +
        Math.random() * 0.4,
      color
    });
  }
}

function createExplosion(
  x,
  y,
  radius,
  color
) {

  createHitParticles(
    x,
    y,
    color,
    22
  );
}

function updateParticles(dt) {

  for (
    let i = particles.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      particles[i];

    p.x +=
      p.dx * dt;

    p.y +=
      p.dy * dt;

    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(
        i,
        1
      );
    }
  }
}


/* =========================================================
   SPAWN
========================================================= */

function spawnWaveEnemies() {

  const amount =
    3 +
    saveData.sector * 2 +
    saveData.wave;

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    let type = "drone";

    const random =
      Math.random();

    if (
      saveData.sector >= 2 &&
      random > 0.65
    ) {
      type = "hunter";
    }

    if (
      saveData.sector >= 3 &&
      random > 0.88
    ) {
      type = "tank";
    }

    if (
      saveData.sector >= 5 &&
      random > 0.94
    ) {
      type = "guardian";
    }

    spawnEnemy(type);
  }
}


/* =========================================================
   BOSS
========================================================= */

let boss = null;

function spawnBoss() {

  boss = {
    x: canvas.width / 2,
    y: 90,
    hp:
      900 +
      saveData.sector * 400,
    maxHp:
      900 +
      saveData.sector * 400,
    radius: 45,
    speed: 55,
    damage: 30
  };

  $("bossPanel").classList.remove(
    "hidden"
  );

  $("bossName").textContent =
    "GUARDIÁN SCORVEX";

  notify("☠️ ¡JEFE ENTRANDO A LA ARENA!");

  tone(
    90,
    1,
    "sawtooth",
    0.12
  );
}

function updateBoss(dt) {

  if (!boss) return;

  const dx =
    player.x - boss.x;

  const dy =
    player.y - boss.y;

  const distance =
    Math.hypot(dx, dy) || 1;

  if (distance > 90) {

    boss.x +=
      (dx / distance) *
      boss.speed *
      dt;

    boss.y +=
      (dy / distance) *
      boss.speed *
      dt;

  } else {

    damagePlayer(
      boss.damage * dt
    );
  }

  $("bossBarFill").style.width =
    `${Math.max(
      0,
      boss.hp / boss.maxHp * 100
    )}%`;

  $("bossHpText").textContent =
    `${Math.ceil(boss.hp)} / ${boss.maxHp}`;

  if (boss.hp <= 0) {

    saveData.coins += 1000;
    saveData.crystals += 10;

    saveData.score += 5000;

    notify(
      "👑 ¡JEFE DERROTADO! +1000 monedas"
    );

    boss = null;

    $("bossPanel").classList.add(
      "hidden"
    );

    nextSector();
  }
}


/* =========================================================
   DIBUJO
========================================================= */

function drawBackground() {

  ctx.fillStyle = "#030611";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const grid = 50;

  ctx.strokeStyle =
    "rgba(57,231,255,.07)";

  ctx.lineWidth = 1;

  for (
    let x = 0;
    x < canvas.width;
    x += grid
  ) {

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(
      x,
      canvas.height
    );
    ctx.stroke();
  }

  for (
    let y = 0;
    y < canvas.height;
    y += grid
  ) {

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(
      canvas.width,
      y
    );
    ctx.stroke();
  }

  const glow =
    ctx.createRadialGradient(
      player.x,
      player.y,
      10,
      player.x,
      player.y,
      280
    );

  glow.addColorStop(
    0,
    "rgba(57,231,255,.07)"
  );

  glow.addColorStop(
    1,
    "rgba(57,231,255,0)"
  );

  ctx.fillStyle = glow;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
}

function drawPlayer() {

  ctx.save();

  ctx.translate(
    player.x,
    player.y
  );

  if (
    player.invulnerable > 0
  ) {
    ctx.globalAlpha =
      0.55;
  }

  /* escudo */
  if (player.shield > 0) {

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      28,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "#49ff9a";

    ctx.lineWidth = 3;

    ctx.shadowBlur = 20;
    ctx.shadowColor =
      "#49ff9a";

    ctx.stroke();
  }

  /* jugador */
  ctx.beginPath();

  ctx.arc(
    0,
    0,
    player.radius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#39e7ff";

  ctx.shadowBlur = 25;
  ctx.shadowColor =
    "#39e7ff";

  ctx.fill();

  /* dirección */
  ctx.beginPath();

  ctx.moveTo(
    player.dirX * 28,
    player.dirY * 28
  );

  ctx.lineTo(
    player.dirX * 10 -
      player.dirY * 8,
    player.dirY * 10 +
      player.dirX * 8
  );

  ctx.lineTo(
    player.dirX * 10 +
      player.dirY * 8,
    player.dirY * 10 -
      player.dirX * 8
  );

  ctx.closePath();

  ctx.fillStyle =
    "#ffffff";

  ctx.fill();

  ctx.restore();
}

function drawEnemies() {

  for (const enemy of enemies) {

    ctx.save();

    ctx.translate(
      enemy.x,
      enemy.y
    );

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      enemy.radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      enemy.color;

    ctx.shadowBlur = 18;
    ctx.shadowColor =
      enemy.color;

    ctx.fill();

    /* vida */
    const width =
      enemy.radius * 2;

    ctx.shadowBlur = 0;

    ctx.fillStyle =
      "#18233e";

    ctx.fillRect(
      -width / 2,
      -enemy.radius - 9,
      width,
      4
    );

    ctx.fillStyle =
      "#49ff9a";

    ctx.fillRect(
      -width / 2,
      -enemy.radius - 9,
      width *
        Math.max(
          0,
          enemy.hp / enemy.maxHp
        ),
      4
    );

    ctx.restore();
  }
}

function drawBoss() {

  if (!boss) return;

  ctx.save();

  ctx.translate(
    boss.x,
    boss.y
  );

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    boss.radius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#ff4b67";

  ctx.shadowBlur = 35;
  ctx.shadowColor =
    "#ff4b67";

  ctx.fill();

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    boss.radius + 10,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "#ff8a3d";

  ctx.lineWidth = 3;

  ctx.stroke();

  ctx.restore();
}

function drawProjectiles() {

  for (const p of projectiles) {

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.size,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      p.color;

    ctx.shadowBlur = 18;
    ctx.shadowColor =
      p.color;

    ctx.fill();

    ctx.restore();
  }
}

function drawParticles() {

  for (const p of particles) {

    ctx.globalAlpha =
      Math.max(
        0,
        p.life
      );

    ctx.fillStyle =
      p.color;

    ctx.fillRect(
      p.x,
      p.y,
      3,
      3
    );
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   LOOP
========================================================= */

function gameLoop(timestamp) {

  if (!gameRunning) return;

  if (!lastTime) {
    lastTime = timestamp;
  }

  const dt =
    Math.min(
      0.033,
      (timestamp - lastTime) / 1000
    );

  lastTime = timestamp;

  if (!paused) {

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);

    if (boss) {
      updateBoss(dt);
    }

    enemySpawnTimer += dt;

    if (
      !boss &&
      enemySpawnTimer > 2.4 &&
      enemies.length <
        5 + saveData.sector * 2
    ) {

      spawnWaveEnemies();
      enemySpawnTimer = 0;
    }

    comboTimer -= dt;

    if (comboTimer <= 0) {
      combo = 1;
    }

    if (
      enemies.length === 0 &&
      enemySpawnTimer > 3
    ) {

      saveData.wave++;

      if (
        saveData.wave % 5 === 0
      ) {
        spawnBoss();
      } else {
        spawnWaveEnemies();
      }

      enemySpawnTimer = 0;
    }
  }

  drawBackground();
  drawProjectiles();
  drawEnemies();
  drawBoss();
  drawParticles();
  drawPlayer();

  updateHUD();

  requestAnimationFrame(
    gameLoop
  );
}


/* =========================================================
   SECTORES
========================================================= */

function nextSector() {

  saveData.sector++;

  saveData.wave = 1;

  if (
    saveData.sector > 8
  ) {

    notify(
      "👑 ¡HAS COMPLETADO SCORVEX!"
    );

    saveData.sector = 1;
  }

  enemies = [];
  projectiles = [];
  boss = null;

  $("bossPanel").classList.add(
    "hidden"
  );

  $("sectorBanner").textContent =
    `SECTOR ${saveData.sector}`;

  $("sectorValue").textContent =
    saveData.sector;

  notify(
    `🌎 SECTOR ${saveData.sector}`
  );

  spawnWaveEnemies();
}


/* =========================================================
   TIENDA
========================================================= */

function openShop() {

  modalTitle.textContent =
    "🛒 TIENDA SCORVEX";

  modalBody.innerHTML = `
    <div class="inventory-tabs">
      <button class="inventory-tab active"
        onclick="renderShopWeapons()">
        🔫 ARMAS
      </button>

      <button class="inventory-tab"
        onclick="renderShopAbilities()">
        ⚡ HABILIDADES
      </button>

      <button class="inventory-tab"
        onclick="renderShopArmors()">
        🛡️ ARMADURAS
      </button>

      <button class="inventory-tab"
        onclick="renderShopConsumables()">
        🩹 CONSUMIBLES
      </button>
    </div>

    <div id="shopContent"></div>
  `;

  modal.classList.remove(
    "hidden"
  );

  renderShopWeapons();
}

function renderShopWeapons() {

  const content =
    $("shopContent");

  content.innerHTML =
    Object.entries(weapons)
      .map(([id, item]) => {

        const owned =
          saveData.ownedWeapons
            .includes(id);

        return `
          <div class="item-card rarity-${item.rarity}">
            <div class="item-icon">
              ${item.icon}
            </div>

            <h3>${item.name}</h3>

            <p>
              DAÑO: ${item.damage}<br>
              ALCANCE: ${item.range}<br>
              RAREZA: ${item.rarity.toUpperCase()}
            </p>

            <div class="item-price">
              💰 ${item.price}
            </div>

            <button
              class="buy-btn"
              onclick="buyWeapon('${id}')"
              ${owned ? "disabled" : ""}>
              ${owned ? "ADQUIRIDA" : "COMPRAR"}
            </button>

            ${
              owned
                ? `
                  <button
                    class="equip-btn"
                    onclick="equipWeapon('${id}')">
                    ${saveData.weapon === id
                      ? "EQUIPADA"
                      : "EQUIPAR"}
                  </button>
                `
                : ""
            }
          </div>
        `;

      })
      .join("");
}

function buyWeapon(id) {

  const item =
    weapons[id];

  if (
    saveData.ownedWeapons
      .includes(id)
  ) {
    return;
  }

  if (
    saveData.coins <
    item.price
  ) {

    notify("💰 No tienes suficientes monedas");
    return;
  }

  saveData.coins -=
    item.price;

  saveData.ownedWeapons.push(
    id
  );

  saveGame();

  notify(
    `🔫 ${item.name} adquirida`
  );

  renderShopWeapons();
  updateHUD();
}

function equipWeapon(id) {

  if (
    !saveData.ownedWeapons
      .includes(id)
  ) {
    return;
  }

  saveData.weapon = id;

  saveGame();

  notify(
    `🔫 ${weapons[id].name} equipada`
  );

  renderShopWeapons();
  updateHUD();
}

function renderShopAbilities() {

  const content =
    $("shopContent");

  content.innerHTML =
    Object.entries(abilities)
      .map(([id, item]) => {

        const owned =
          saveData.ownedAbilities
            .includes(id);

        return `
          <div class="item-card">
            <div class="item-icon">
              ${item.icon}
            </div>

            <h3>${item.name}</h3>

            <p>
              ENERGÍA: ${item.energy}<br>
              ${item.description}
            </p>

            <div class="item-price">
              💰 ${item.price}
            </div>

            <button
              class="buy-btn"
              onclick="buyAbility('${id}')"
              ${owned ? "disabled" : ""}>
              ${owned ? "DESBLOQUEADA" : "COMPRAR"}
            </button>

            ${
              owned
                ? `
                  <button
                    class="equip-btn"
                    onclick="equipAbility('${id}')">
                    ${saveData.ability === id
                      ? "EQUIPADA"
                      : "EQUIPAR"}
                  </button>
                `
                : ""
            }
          </div>
        `;
      })
      .join("");
}

function buyAbility(id) {

  const item =
    abilities[id];

  if (
    saveData.ownedAbilities
      .includes(id)
  ) {
    return;
  }

  if (
    saveData.coins <
    item.price
  ) {

    notify("💰 No tienes suficientes monedas");
    return;
  }

  saveData.coins -=
    item.price;

  saveData.ownedAbilities.push(
    id
  );

  saveGame();

  notify(
    `⚡ ${item.name} desbloqueada`
  );

  renderShopAbilities();
  updateHUD();
}

function equipAbility(id) {

  if (
    !saveData.ownedAbilities
      .includes(id)
  ) {
    return;
  }

  saveData.ability = id;

  saveGame();

  notify(
    `⚡ ${abilities[id].name} equipada`
  );

  renderShopAbilities();
  updateHUD();
}

function renderShopArmors() {

  const content =
    $("shopContent");

  content.innerHTML =
    Object.entries(armors)
      .map(([id, item]) => {

        const owned =
          saveData.ownedArmors
            .includes(id);

        return `
          <div class="item-card rarity-${item.rarity}">

            <div class="item-icon">
              ${item.icon}
            </div>

            <h3>${item.name}</h3>

            <p>
              DEFENSA: ${item.defense}%<br>
              ENERGÍA: ${item.energy >= 0 ? "+" : ""}${item.energy}<br>
              RAREZA: ${item.rarity.toUpperCase()}
            </p>

            <div class="item-price">
              💰 ${item.price}
            </div>

            <button
              class="buy-btn"
              onclick="buyArmor('${id}')"
              ${owned ? "disabled" : ""}>
              ${owned ? "ADQUIRIDA" : "COMPRAR"}
            </button>

            ${
              owned
                ? `
                  <button
                    class="equip-btn"
                    onclick="equipArmor('${id}')">
                    ${saveData.armor === id
                      ? "EQUIPADA"
                      : "EQUIPAR"}
                  </button>
                `
                : ""
            }

          </div>
        `;
      })
      .join("");
}

function buyArmor(id) {

  const item =
    armors[id];

  if (
    saveData.ownedArmors
      .includes(id)
  ) {
    return;
  }

  if (
    saveData.coins <
    item.price
  ) {

    notify("💰 No tienes suficientes monedas");
    return;
  }

  saveData.coins -=
    item.price;

  saveData.ownedArmors.push(
    id
  );

  saveGame();

  notify(
    `🛡️ ${item.name} adquirida`
  );

  renderShopArmors();
  updateHUD();
}

function equipArmor(id) {

  if (
    !saveData.ownedArmors
      .includes(id)
  ) {
    return;
  }

  saveData.armor = id;

  saveGame();

  notify(
    `🛡️ ${armors[id].name} equipada`
  );

  renderShopArmors();
  updateHUD();
}

function renderShopConsumables() {

  const content =
    $("shopContent");

  content.innerHTML =
    Object.entries(consumables)
      .map(([id, item]) => {

        let quantity = 0;

        if (id === "medkit") {
          quantity =
            saveData.medkits;
        }

        if (id === "energyKit") {
          quantity =
            saveData.energyKits;
        }

        if (id === "shieldKit") {
          quantity =
            saveData.shieldKits;
        }

        if (id === "repairKit") {
          quantity =
            saveData.repairKits;
        }

        return `
          <div class="item-card">

            <div class="item-icon">
              ${item.icon}
            </div>

            <h3>${item.name}</h3>

            <p>
              ${item.description}<br>
              CANTIDAD: ${quantity}
            </p>

            <div class="item-price">
              💰 ${item.price}
            </div>

            <button
              class="buy-btn"
              onclick="buyConsumable('${id}')">
              COMPRAR
            </button>

          </div>
        `;
      })
      .join("");
}

function buyConsumable(id) {

  const item =
    consumables[id];

  if (
    saveData.coins <
    item.price
  ) {

    notify("💰 No tienes suficientes monedas");
    return;
  }

  saveData.coins -=
    item.price;

  if (id === "medkit") {
    saveData.medkits++;
  }

  if (id === "energyKit") {
    saveData.energyKits++;
  }

  if (id === "shieldKit") {
    saveData.shieldKits++;
  }

  if (id === "repairKit") {
    saveData.repairKits++;
  }

  saveGame();

  notify(
    `${item.icon} ${item.name} comprado`
  );

  renderShopConsumables();
  updateHUD();
}


/* =========================================================
   INVENTARIO
========================================================= */

function openInventory() {

  modalTitle.textContent =
    "🎒 INVENTARIO";

  modalBody.innerHTML = `
    <div class="inventory-tabs">

      <button
        class="inventory-tab active"
        onclick="renderInventoryMain()">
        📦 EQUIPAMIENTO
      </button>

      <button
        class="inventory-tab"
        onclick="renderInventoryWeapons()">
        🔫 ARMAS
      </button>

      <button
        class="inventory-tab"
        onclick="renderInventoryAbilities()">
        ⚡ HABILIDADES
      </button>

      <button
        class="inventory-tab"
        onclick="renderInventoryConsumables()">
        🩹 OBJETOS
      </button>

    </div>

    <div id="inventoryContent"></div>
  `;

  modal.classList.remove(
    "hidden"
  );

  renderInventoryMain();
}

function renderInventoryMain() {

  $("inventoryContent").innerHTML = `

    <div class="item-grid">

      <div class="item-card">
        <div class="item-icon">🔫</div>
        <h3>ARMA EQUIPADA</h3>
        <p>
          ${weapons[saveData.weapon].name}
        </p>
      </div>

      <div class="item-card">
        <div class="item-icon">⚡</div>
        <h3>HABILIDAD EQUIPADA</h3>
        <p>
          ${abilities[saveData.ability].name}
        </p>
      </div>

      <div class="item-card">
        <div class="item-icon">🛡️</div>
        <h3>ARMADURA EQUIPADA</h3>
        <p>
          ${armors[saveData.armor].name}
        </p>
      </div>

      <div class="item-card">
        <div class="item-icon">🩹</div>
        <h3>BOTIQUINES</h3>
        <p>
          ${saveData.medkits}
        </p>
      </div>

      <div class="item-card">
        <div class="item-icon">🔋</div>
        <h3>KITS DE ENERGÍA</h3>
        <p>
          ${saveData.energyKits}
        </p>
      </div>

      <div class="item-card">
        <div class="item-icon">🔰</div>
        <h3>ESCUDOS</h3>
        <p>
          ${saveData.shieldKits}
        </p>
      </div>

      <div class="item-card">
        <div class="item-icon">🔧</div>
        <h3>REPARADORES</h3>
        <p>
          ${saveData.repairKits}
        </p>
      </div>

    </div>
  `;
}

function renderInventoryWeapons() {

  $("inventoryContent").innerHTML =
    saveData.ownedWeapons
      .map(id => {

        const item =
          weapons[id];

        return `
          <div class="item-card rarity-${item.rarity}">

            <div class="item-icon">
              ${item.icon}
            </div>

            <h3>${item.name}</h3>

            <p>
              DAÑO: ${item.damage}<br>
              RAREZA: ${item.rarity.toUpperCase()}
            </p>

            <button
              class="equip-btn"
              onclick="equipWeapon('${id}')">
              ${saveData.weapon === id
                ? "EQUIPADA"
                : "EQUIPAR"}
            </button>

          </div>
        `;
      })
      .join("");
}

function renderInventoryAbilities() {

  $("inventoryContent").innerHTML =
    saveData.ownedAbilities
      .map(id => {

        const item =
          abilities[id];

        return `
          <div class="item-card">

            <div class="item-icon">
              ${item.icon}
            </div>

            <h3>${item.name}</h3>

            <p>
              ENERGÍA: ${item.energy}<br>
              ${item.description}
            </p>

            <button
              class="equip-btn"
              onclick="equipAbility('${id}')">
              ${saveData.ability === id
                ? "EQUIPADA"
                : "EQUIPAR"}
            </button>

          </div>
        `;
      })
      .join("");
}

function renderInventoryConsumables() {

  $("inventoryContent").innerHTML = `

    <div class="item-grid">

      <div class="item-card">
        <div class="item-icon">🩹</div>
        <h3>BOTIQUINES</h3>
        <p>${saveData.medkits}</p>
        <button
          class="equip-btn"
          onclick="useMedkit()">
          USAR
        </button>
      </div>

      <div class="item-card">
        <div class="item-icon">🔋</div>
        <h3>ENERGÍA</h3>
        <p>${saveData.energyKits}</p>
      </div>

      <div class="item-card">
        <div class="item-icon">🔰</div>
        <h3>ESCUDOS</h3>
        <p>${saveData.shieldKits}</p>
      </div>

      <div class="item-card">
        <div class="item-icon">🔧</div>
        <h3>REPARADORES</h3>
        <p>${saveData.repairKits}</p>
      </div>

    </div>
  `;
}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  const weapon =
    weapons[saveData.weapon];

  const ability =
    abilities[saveData.ability];

  const armor =
    armors[saveData.armor];

  $("hpValue").textContent =
    Math.ceil(player.hp);

  $("energyValue").textContent =
    Math.ceil(player.energy);

  $("xpValue").textContent =
    saveData.xp;

  $("coinsValue").textContent =
    saveData.coins;

  $("crystalsValue").textContent =
    saveData.crystals;

  $("scoreValue").textContent =
    saveData.score;

  $("comboValue").textContent =
    `x${combo.toFixed(1)}`;

  $("levelValue").textContent =
    saveData.level;

  $("waveValue").textContent =
    saveData.wave;

  $("sectorValue").textContent =
    saveData.sector;

  $("weaponName").textContent =
    weapon.name;

  $("weaponStats").textContent =
    `DAÑO ${weapon.damage}`;

  $("abilityName").textContent =
    ability.name;

  $("abilityStatus").textContent =
    player.abilityReady
      ? "LISTA"
      : "ENFRIAMIENTO";

  $("armorName").textContent =
    armor.name;

  $("armorStats").textContent =
    `DEFENSA ${armor.defense}%`;

  $("medkitValue").textContent =
    saveData.medkits;

  $("hpBar").style.width =
    `${player.hp / player.maxHp * 100}%`;

  $("energyBar").style.width =
    `${player.energy / player.maxEnergy * 100}%`;

  const needed =
    saveData.level * 100;

  $("xpBar").style.width =
    `${Math.min(
      100,
      saveData.xp / needed * 100
    )}%`;
}


/* =========================================================
   MODAL
========================================================= */

function closeModal() {
  modal.classList.add(
    "hidden"
  );
}

$("closeModal").addEventListener(
  "click",
  closeModal
);


/* =========================================================
   PAUSA
========================================================= */

function togglePause() {

  if (!gameRunning) return;

  paused = !paused;

  pauseModal.classList.toggle(
    "hidden",
    !paused
  );
}

$("pauseBtn").addEventListener(
  "click",
  togglePause
);

$("resumeBtn").addEventListener(
  "click",
  togglePause
);

$("pauseMenuBtn").addEventListener(
  "click",
  () => {

    paused = false;

    pauseModal.classList.add(
      "hidden"
    );

    gameScreen.classList.add(
      "hidden"
    );

    mainMenu.classList.remove(
      "hidden"
    );

  }
);


/* =========================================================
   NOTIFICACIONES
========================================================= */

function notify(message) {

  const element =
    document.createElement("div");

  element.className =
    "notification";

  element.textContent =
    message;

  notificationContainer.appendChild(
    element
  );

  setTimeout(() => {
    element.remove();
  }, 3100);
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

  gameRunning = false;

  stopMusic();

  setTimeout(() => {

    alert(
      `SCORVEX\n\n` +
      `GAME OVER\n\n` +
      `Puntuación: ${saveData.score}\n` +
      `Sector: ${saveData.sector}\n` +
      `Nivel: ${saveData.level}`
    );

    gameScreen.classList.add(
      "hidden"
    );

    mainMenu.classList.remove(
      "hidden"
    );

  }, 100);
}


/* =========================================================
   INICIAR JUEGO
========================================================= */

function startGame() {

  initAudio();

  if (musicEnabled) {
    startMusic();
  }

  mainMenu.classList.add(
    "hidden"
  );

  gameScreen.classList.remove(
    "hidden"
  );

  gameRunning = true;
  paused = false;

  player.x =
    canvas.width / 2;

  player.y =
    canvas.height / 2;

  player.maxHp =
    100 +
    (saveData.level - 1) * 10;

  player.maxEnergy =
    100 +
    (saveData.level - 1) * 5;

  player.hp =
    player.maxHp;

  player.energy =
    player.maxEnergy;

  enemies = [];
  projectiles = [];
  particles = [];
  boss = null;

  enemySpawnTimer = 0;
  lastTime = 0;

  $("sectorBanner").textContent =
    `SECTOR ${saveData.sector}`;

  spawnWaveEnemies();

  updateHUD();

  requestAnimationFrame(
    gameLoop
  );
}


/* =========================================================
   EVENTOS
========================================================= */

$("playBtn").addEventListener(
  "click",
  startGame
);

$("musicBtn").addEventListener(
  "click",
  () => {

    initAudio();
    toggleMusic();

  }
);

$("musicGameBtn").addEventListener(
  "click",
  () => {

    initAudio();
    toggleMusic();

  }
);

$("soundBtn").addEventListener(
  "click",
  () => {

    soundEnabled =
      !soundEnabled;

    saveData.soundEnabled =
      soundEnabled;

    $("soundBtn").textContent =
      soundEnabled
        ? "🔊"
        : "🔇";

    saveGame();

  }
);

$("inventoryBtn").addEventListener(
  "click",
  openInventory
);

$("shopBtn").addEventListener(
  "click",
  openShop
);

$("saveBtn").addEventListener(
  "click",
  saveGame
);

$("mapBtn").addEventListener(
  "click",
  () => {

    modalTitle.textContent =
      "🗺️ MAPA";

    modalBody.innerHTML = `
      <div class="item-grid">

        ${[
          "CIUDAD NEON",
          "LABORATORIO",
          "BASE ABANDONADA",
          "ZONA ÁRTICA",
          "VOLCÁN",
          "ESTACIÓN ESPACIAL",
          "DIMENSIÓN OSCURA",
          "NÚCLEO SCORVEX"
        ].map((name, i) => `
          <div class="item-card">
            <div class="item-icon">🌎</div>
            <h3>SECTOR ${i + 1}</h3>
            <p>${name}</p>
            <p>
              ${
                saveData.sector >= i + 1
                  ? "DESBLOQUEADO"
                  : "BLOQUEADO"
              }
            </p>
          </div>
        `).join("")}

      </div>
    `;

    modal.classList.remove(
      "hidden"
    );
  }
);

$("missionsBtn").addEventListener(
  "click",
  () => {

    modalTitle.textContent =
      "🎯 MISIONES";

    modalBody.innerHTML = `
      <div class="item-grid">

        <div class="item-card">
          <div class="item-icon">⚔️</div>
          <h3>CAZADOR</h3>
          <p>
            Elimina 10 enemigos.
          </p>
          <strong>
            ${missionKills}/10
          </strong>
        </div>

        <div class="item-card">
          <div class="item-icon">💰</div>
          <h3>COLECCIONISTA</h3>
          <p>
            Consigue 1000 monedas.
          </p>
        </div>

        <div class="item-card">
          <div class="item-icon">👑</div>
          <h3>GUARDIÁN</h3>
          <p>
            Derrota a un jefe.
          </p>
        </div>

      </div>
    `;

    modal.classList.remove(
      "hidden"
    );
  }
);

$("menuBtn").addEventListener(
  "click",
  () => {

    gameRunning = false;
    stopMusic();

    gameScreen.classList.add(
      "hidden"
    );

    mainMenu.classList.remove(
      "hidden"
    );
  }
);


/* =========================================================
   BOOT
========================================================= */

function boot() {

  loadSave();

  updateMusicButtons();

  let progress = 0;

  const interval =
    setInterval(() => {

      progress +=
        Math.floor(
          Math.random() * 12
        ) + 5;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }

      $("loadingBar").style.width =
        `${progress}%`;

      const texts = [
        "Inicializando sistema...",
        "Cargando arsenal...",
        "Cargando habilidades...",
        "Preparando armaduras...",
        "Preparando inventario...",
        "Sincronizando arena...",
        "Activando música...",
        "SCORVEX ONLINE"
      ];

      $("loadingText").textContent =
        texts[
          Math.min(
            texts.length - 1,
            Math.floor(
              progress /
              (100 / texts.length)
            )
          )
        ];

      if (progress >= 100) {

        setTimeout(() => {

          bootScreen.classList.add(
            "hidden"
          );

          mainMenu.classList.remove(
            "hidden"
          );

        }, 500);
      }

    }, 180);
}

boot();

/* =========================================================
   FIN SCORVEX V5
========================================================= */
