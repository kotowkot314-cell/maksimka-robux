const GRAVITY = -30;
const JUMP_FORCE = 9;
const MAX_WALK_SPEED = 8;
const ACCELERATION = 40;
const AIR_CONTROL = 5;
const FRICTION = 15;
const DEADZONE = 0.15;
const PLAYER_RADIUS = 0.4;
const PLAYER_HEIGHT = 2.0;
const CAM_HEIGHT = 3;

let velocityY = 0;
let canJump = true;
let currentSpeedX = 0;
let currentSpeedZ = 0;
let walkCycle = 0;
let isClimbing = false;
let climbTimer = 0;

let camYaw = 0;
let camPitch = 0;
let camDist = 8;

let joystickActive = false;
let joystickVector = { x: 0, y: 0 };
let joystickTouchId = null;

let cameraTouchId = null;
let cameraTouchStart = { x: 0, y: 0 };
let pinchActive = false;
let pinchStartDist = 0;
let pinchStartCamDist = 8;

function doJump() {
    if (canJump) {
        velocityY = JUMP_FORCE;
        canJump = false;
        isClimbing = false;
        climbTimer = 0;
    }
}

// ... (остальные функции без изменений: isInsideUI, setupMechanics, updateJoystick, getTouchDist, intersectsHorizontal, getGroundHeight, checkHorizontalCollision, checkClimbing)

function updateMechanics(player, playerSkin, WALLS, PLATFORMS, delta) {
    let inputX = 0, inputZ = 0;

    if (joystickActive) {
        let jx = joystickVector.x;
        let jz = -joystickVector.y;
        const mag = Math.sqrt(jx * jx + jz * jz);
        if (mag > DEADZONE) {
            jx = (jx / mag) * Math.min(mag * 2, 1);
            jz = (jz / mag) * Math.min(mag * 2, 1);
        } else {
            jx = 0;
            jz = 0;
        }
        inputX = -jx;
        inputZ = jz;
    }

    const forwardX = Math.sin(camYaw);
    const forwardZ = Math.cos(camYaw);
    const rightX = Math.cos(camYaw);
    const rightZ = -Math.sin(camYaw);

    let targetSpeedX = (inputX * rightX + inputZ * forwardX) * MAX_WALK_SPEED;
    let targetSpeedZ = (inputX * rightZ + inputZ * forwardZ) * MAX_WALK_SPEED;

    const accel = canJump ? ACCELERATION : AIR_CONTROL;
    currentSpeedX += (targetSpeedX - currentSpeedX) * accel * delta;
    currentSpeedZ += (targetSpeedZ - currentSpeedZ) * accel * delta;

    if (!joystickActive || (inputX === 0 && inputZ === 0)) {
        currentSpeedX *= (1 - FRICTION * delta);
        currentSpeedZ *= (1 - FRICTION * delta);
    }

    if (!canJump && velocityY < 0 && climbTimer < 1.5) {
        const touchingWall = checkClimbing(player.position.x, player.position.z, player.position.y, WALLS, PLATFORMS);
        if (touchingWall) {
            isClimbing = true;
            climbTimer += delta;
        } else {
            isClimbing = false;
        }
    } else {
        isClimbing = false;
    }

    if (isClimbing && !canJump) {
        velocityY = 2;
    }

    let newX = player.position.x + currentSpeedX * delta;
    if (!checkHorizontalCollision(player.position.x, player.position.z, player.position.y, newX, player.position.z, WALLS, PLATFORMS)) {
        player.position.x = newX;
    } else {
        currentSpeedX = 0;
    }

    let newZ = player.position.z + currentSpeedZ * delta;
    if (!checkHorizontalCollision(player.position.x, player.position.z, player.position.y, player.position.x, newZ, WALLS, PLATFORMS)) {
        player.position.z = newZ;
    } else {
        currentSpeedZ = 0;
    }

    const speedMag = Math.sqrt(currentSpeedX * currentSpeedX + currentSpeedZ * currentSpeedZ);
    if (speedMag > 0.5) {
        const targetAngle = Math.atan2(currentSpeedX, currentSpeedZ);
        const currentAngle = player.rotation.y;
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        player.rotation.y += angleDiff * 15 * delta;
    }

    // --- ПЛАВНАЯ АНИМАЦИЯ ХОДЬБЫ И ПРЫЖКА ---
    if (canJump && speedMag > 0.5) {
        // Ходьба: плавное покачивание рук и ног
        walkCycle += delta * 12;
        const swing = Math.sin(walkCycle) * 0.7;
        if (playerSkin.armL) playerSkin.armL.rotation.x += (swing - playerSkin.armL.rotation.x) * 10 * delta;
        if (playerSkin.armR) playerSkin.armR.rotation.x += (-swing - playerSkin.armR.rotation.x) * 10 * delta;
        if (playerSkin.legL) playerSkin.legL.rotation.x += (-swing - playerSkin.legL.rotation.x) * 10 * delta;
        if (playerSkin.legR) playerSkin.legR.rotation.x += (swing - playerSkin.legR.rotation.x) * 10 * delta;
    } else if (!canJump) {
        // Прыжок: руки вверх, ноги поджаты
        if (playerSkin.armL) playerSkin.armL.rotation.x += (-2.5 - playerSkin.armL.rotation.x) * 5 * delta;
        if (playerSkin.armR) playerSkin.armR.rotation.x += (-2.5 - playerSkin.armR.rotation.x) * 5 * delta;
        if (playerSkin.legL) playerSkin.legL.rotation.x += (0.4 - playerSkin.legL.rotation.x) * 5 * delta;
        if (playerSkin.legR) playerSkin.legR.rotation.x += (-0.4 - playerSkin.legR.rotation.x) * 5 * delta;
    } else {
        // Стоит на месте: плавное возвращение в исходное положение
        if (playerSkin.armL) playerSkin.armL.rotation.x *= (1 - 5 * delta);
        if (playerSkin.armR) playerSkin.armR.rotation.x *= (1 - 5 * delta);
        if (playerSkin.legL) playerSkin.legL.rotation.x *= (1 - 5 * delta);
        if (playerSkin.legR) playerSkin.legR.rotation.x *= (1 - 5 * delta);
    }

    if (!isClimbing) {
        velocityY += GRAVITY * delta;
    }
    player.position.y += velocityY * delta;

    // --- ИСПРАВЛЕНИЕ: игрок стоит на земле, а не левитирует ---
    const groundY = getGroundHeight(player.position.x, player.position.z, player.position.y, PLATFORMS);
    if (player.position.y <= groundY && velocityY <= 0) {
        player.position.y = groundY;
        velocityY = 0;
        canJump = true;
        isClimbing = false;
        climbTimer = 0;
    }

    if (player.position.y < -20) {
        player.position.set(0, 2, 0);
        velocityY = 0;
        currentSpeedX = 0;
        currentSpeedZ = 0;
        isClimbing = false;
        climbTimer = 0;
    }

    if (player.position.x > 48) player.position.x = 48;
    if (player.position.x < -48) player.position.x = -48;
    if (player.position.z > 48) player.position.z = 48;
    if (player.position.z < -48) player.position.z = -48;
}

function updateCamera(camera, player, WALLS) {
    let idealCamX = player.position.x - Math.sin(camYaw) * camDist * Math.cos(camPitch);
    let idealCamZ = player.position.z - Math.cos(camYaw) * camDist * Math.cos(camPitch);
    let idealCamY = player.position.y + CAM_HEIGHT + Math.sin(camPitch) * camDist;

    let camDistActual = camDist;
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const testX = player.position.x + (idealCamX - player.position.x) * t;
        const testZ = player.position.z + (idealCamZ - player.position.z) * t;
        const testY = player.position.y + 1.2 + (idealCamY - (player.position.y + 1.2)) * t;
        let hit = false;
        for (let wall of WALLS) {
            if (testX + 0.2 > wall.x - wall.w / 2 &&
                testX - 0.2 < wall.x + wall.w / 2 &&
                testZ + 0.2 > wall.z - wall.d / 2 &&
                testZ - 0.2 < wall.z + wall.d / 2 &&
                testY < wall.top && testY > wall.bottom) {
                hit = true;
                break;
            }
        }
        if (hit) {
            camDistActual = camDist * (i - 1) / steps;
            break;
        }
    }

    const realCamX = player.position.x - Math.sin(camYaw) * camDistActual * Math.cos(camPitch);
    const realCamZ = player.position.z - Math.cos(camYaw) * camDistActual * Math.cos(camPitch);
    const realCamY = player.position.y + CAM_HEIGHT + Math.sin(camPitch) * camDistActual;

    camera.position.lerp(new THREE.Vector3(realCamX, realCamY, realCamZ), 0.2);
    camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z);
}

window.doJump = doJump;
window.setupMechanics = setupMechanics;
window.updateMechanics = updateMechanics;
window.updateCamera = updateCamera;
window.getMechanicsState = function() {
    return { camYaw: camYaw, camPitch: camPitch };
};
window.setMechanicsState = function(yaw, pitch) {
    camYaw = yaw;
    camPitch = pitch;
};