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

function isInsideUI(touch) {
    const joystickZone = document.getElementById('joystick-zone');
    const jumpBtn = document.getElementById('jump-btn');
    
    if (joystickZone) {
        const rect = joystickZone.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) return true;
    }
    
    if (jumpBtn) {
        const rect = jumpBtn.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) return true;
    }
    
    if (touch.target && touch.target.closest) {
        if (touch.target.closest('#menu-btn')) return true;
        if (touch.target.closest('#menu-panel')) return true;
        if (touch.target.closest('#players-panel')) return true;
    }
    return false;
}

function setupMechanics() {
    const joystickZone = document.getElementById('joystick-zone');
    const jumpBtn = document.getElementById('jump-btn');
    
    if (joystickZone) {
        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (joystickTouchId !== null) return;
            const touch = e.changedTouches[0];
            joystickTouchId = touch.identifier;
            joystickActive = true;
            updateJoystick(touch, joystickZone);
        }, { passive: false });

        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (joystickTouchId === null) return;
            const touch = Array.from(e.changedTouches).find(t => t.identifier === joystickTouchId);
            if (!touch) return;
            updateJoystick(touch, joystickZone);
        }, { passive: false });

        const endJoystick = (e) => {
            if (joystickTouchId === null) return;
            const touch = Array.from(e.changedTouches).find(t => t.identifier === joystickTouchId);
            if (!touch) return;
            joystickTouchId = null;
            joystickActive = false;
            const knob = document.getElementById('joystick-knob');
            if (knob) knob.style.transform = 'translate(0px, 0px)';
            joystickVector.x = 0;
            joystickVector.y = 0;
        };
        joystickZone.addEventListener('touchend', endJoystick);
        joystickZone.addEventListener('touchcancel', endJoystick);
    }

    document.addEventListener('touchend', function(e) {
        if (joystickTouchId === null) return;
        const touch = Array.from(e.changedTouches).find(t => t.identifier === joystickTouchId);
        if (touch) {
            joystickTouchId = null;
            joystickActive = false;
            const knob = document.getElementById('joystick-knob');
            if (knob) knob.style.transform = 'translate(0px, 0px)';
            joystickVector.x = 0;
            joystickVector.y = 0;
        }
    });

    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            doJump();
        }, { passive: false });
        jumpBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            doJump();
        });
    }

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            if (isInsideUI(t1) || isInsideUI(t2)) return;
            pinchActive = true;
            cameraTouchId = null;
            pinchStartDist = getTouchDist(e.touches);
            pinchStartCamDist = camDist;
            return;
        }

        if (e.touches.length === 1 && !pinchActive) {
            if (cameraTouchId !== null) return;
            const touch = e.touches[0];
            if (isInsideUI(touch)) return;
            cameraTouchId = touch.identifier;
            cameraTouchStart = { x: touch.clientX, y: touch.clientY };
        }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && pinchActive) {
            e.preventDefault();
            const dist = getTouchDist(e.touches);
            if (pinchStartDist > 0) {
                const scale = pinchStartDist / dist;
                camDist = pinchStartCamDist * scale;
                if (camDist < 3) camDist = 3;
                if (camDist > 20) camDist = 20;
            }
            return;
        }

        if (cameraTouchId !== null && !pinchActive) {
            const touch = Array.from(e.changedTouches).find(t => t.identifier === cameraTouchId);
            if (!touch) return;
            if (isInsideUI(touch)) return;
            e.preventDefault();
            const dx = touch.clientX - cameraTouchStart.x;
            const dy = touch.clientY - cameraTouchStart.y;
            camYaw -= dx * 0.01;
            camPitch += dy * 0.01;
            if (camPitch > 1.2) camPitch = 1.2;
            if (camPitch < -0.8) camPitch = -0.8;
            cameraTouchStart = { x: touch.clientX, y: touch.clientY };
        }
    }, { passive: false });

    const endCamera = (e) => {
        if (e.touches.length < 2) pinchActive = false;
        if (cameraTouchId === null) return;
        const touch = Array.from(e.changedTouches).find(t => t.identifier === cameraTouchId);
        if (touch) cameraTouchId = null;
    };
    document.addEventListener('touchend', endCamera);
    document.addEventListener('touchcancel', endCamera);
}

function updateJoystick(touch, zone) {
    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 45);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * dist;
    const ky = Math.sin(angle) * dist;
    const knob = document.getElementById('joystick-knob');
    if (knob) knob.style.transform = `translate(${kx}px, ${ky}px)`;
    joystickVector.x = dx / 45;
    joystickVector.y = dy / 45;
    if (joystickVector.x > 1) joystickVector.x = 1;
    if (joystickVector.x < -1) joystickVector.x = -1;
    if (joystickVector.y > 1) joystickVector.y = 1;
    if (joystickVector.y < -1) joystickVector.y = -1;
}

function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function intersectsHorizontal(px, pz, r, obj) {
    return (px + r > obj.x - obj.w / 2 &&
        px - r < obj.x + obj.w / 2 &&
        pz + r > obj.z - obj.d / 2 &&
        pz - r < obj.z + obj.d / 2);
}

function getGroundHeight(px, pz, playerY, PLATFORMS) {
    let maxY = 0;
    const headY = playerY + PLAYER_HEIGHT;
    for (let plat of PLATFORMS) {
        if (intersectsHorizontal(px, pz, PLAYER_RADIUS, plat)) {
            if (plat.top <= headY + 0.1) {
                if (plat.top > maxY) maxY = plat.top;
            }
        }
    }
    return maxY;
}

function checkHorizontalCollision(px, pz, playerY, newX, newZ, WALLS, PLATFORMS) {
    const headY = playerY + PLAYER_HEIGHT;
    const feetY = playerY;
    for (let wall of WALLS) {
        if (headY > wall.bottom && feetY < wall.top) {
            if (newX + PLAYER_RADIUS > wall.x - wall.w / 2 &&
                newX - PLAYER_RADIUS < wall.x + wall.w / 2 &&
                newZ + PLAYER_RADIUS > wall.z - wall.d / 2 &&
                newZ - PLAYER_RADIUS < wall.z + wall.d / 2) {
                return true;
            }
        }
    }
    for (let plat of PLATFORMS) {
        if (headY > plat.bottom && feetY < plat.top - 0.1) {
            if (newX + PLAYER_RADIUS > plat.x - plat.w / 2 &&
                newX - PLAYER_RADIUS < plat.x + plat.w / 2 &&
                newZ + PLAYER_RADIUS > plat.z - plat.d / 2 &&
                newZ - PLAYER_RADIUS < plat.z + plat.d / 2) {
                return true;
            }
        }
    }
    return false;
}

function checkClimbing(px, pz, playerY, WALLS, PLATFORMS) {
    const headY = playerY + PLAYER_HEIGHT;
    const feetY = playerY;
    const checkRadius = PLAYER_RADIUS + 0.15;
    for (let wall of WALLS) {
        if (headY > wall.bottom && feetY < wall.top) {
            if (px + checkRadius > wall.x - wall.w / 2 &&
                px - checkRadius < wall.x + wall.w / 2 &&
                pz + checkRadius > wall.z - wall.d / 2 &&
                pz - checkRadius < wall.z + wall.d / 2) {
                return true;
            }
        }
    }
    for (let plat of PLATFORMS) {
        if (headY > plat.bottom && feetY < plat.top - 0.1) {
            if (px + checkRadius > plat.x - plat.w / 2 &&
                px - checkRadius < plat.x + plat.w / 2 &&
                pz + checkRadius > plat.z - plat.d / 2 &&
                pz - checkRadius < plat.z + plat.d / 2) {
                return true;
            }
        }
    }
    return false;
}

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

    if (canJump && speedMag > 0.5) {
        walkCycle += delta * 12;
        const swing = Math.sin(walkCycle) * 0.7;
        if (playerSkin.armL) playerSkin.armL.rotation.x = swing;
        if (playerSkin.armR) playerSkin.armR.rotation.x = -swing;
        if (playerSkin.legL) playerSkin.legL.rotation.x = -swing;
        if (playerSkin.legR) playerSkin.legR.rotation.x = swing;
    } else if (!canJump) {
        if (playerSkin.armL) playerSkin.armL.rotation.x = -2.5;
        if (playerSkin.armR) playerSkin.armR.rotation.x = -2.5;
        if (playerSkin.legL) playerSkin.legL.rotation.x = 0.4;
        if (playerSkin.legR) playerSkin.legR.rotation.x = -0.4;
    } else {
        if (playerSkin.armL) playerSkin.armL.rotation.x *= 0.7;
        if (playerSkin.armR) playerSkin.armR.rotation.x *= 0.7;
        if (playerSkin.legL) playerSkin.legL.rotation.x *= 0.7;
        if (playerSkin.legR) playerSkin.legR.rotation.x *= 0.7;
    }

    if (!isClimbing) {
        velocityY += GRAVITY * delta;
    }
    player.position.y += velocityY * delta;

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