const SKIN = {
    torsoColor: 0xffffff,
    limbColor: 0x111111,
    torsoW: 0.8,
    torsoH: 0.9,
    torsoD: 0.45,
    armW: 0.4,
    armH: 1.0,
    armD: 0.4,
    legW: 0.4,
    legH: 1.0,
    legD: 0.45
};

function createSkin() {
    const group = new THREE.Group();

    const torsoMat = new THREE.MeshStandardMaterial({ color: SKIN.torsoColor, roughness: 0.7 });
    const limbMat = new THREE.MeshStandardMaterial({ color: SKIN.limbColor, roughness: 0.7 });

    const torsoGeo = new THREE.BoxGeometry(SKIN.torsoW, SKIN.torsoH, SKIN.torsoD);
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = SKIN.legH + SKIN.torsoH / 2;
    torso.castShadow = true;
    group.add(torso);

    const armGeo = new THREE.BoxGeometry(SKIN.armW, SKIN.armH, SKIN.armD);
    const legGeo = new THREE.BoxGeometry(SKIN.legW, SKIN.legH, SKIN.legD);

    const armLGroup = new THREE.Group();
    armLGroup.position.set(-(SKIN.torsoW / 2 + SKIN.armW / 2), SKIN.legH + SKIN.torsoH, 0);
    const armLMesh = new THREE.Mesh(armGeo, limbMat);
    armLMesh.geometry.translate(0, -SKIN.armH / 2, 0);
    armLMesh.castShadow = true;
    armLGroup.add(armLMesh);
    group.add(armLGroup);

    const armRGroup = new THREE.Group();
    armRGroup.position.set(SKIN.torsoW / 2 + SKIN.armW / 2, SKIN.legH + SKIN.torsoH, 0);
    const armRMesh = new THREE.Mesh(armGeo, limbMat);
    armRMesh.geometry.translate(0, -SKIN.armH / 2, 0);
    armRMesh.castShadow = true;
    armRGroup.add(armRMesh);
    group.add(armRGroup);

    const legLGroup = new THREE.Group();
    legLGroup.position.set(-SKIN.legW / 2, SKIN.legH, 0);
    const legLMesh = new THREE.Mesh(legGeo, limbMat);
    legLMesh.geometry.translate(0, -SKIN.legH / 2, 0);
    legLMesh.castShadow = true;
    legLGroup.add(legLMesh);
    group.add(legLGroup);

    const legRGroup = new THREE.Group();
    legRGroup.position.set(SKIN.legW / 2, SKIN.legH, 0);
    const legRMesh = new THREE.Mesh(legGeo, limbMat);
    legRMesh.geometry.translate(0, -SKIN.legH / 2, 0);
    legRMesh.castShadow = true;
    legRGroup.add(legRMesh);
    group.add(legRGroup);

    return {
        group: group,
        armL: armLGroup,
        armR: armRGroup,
        legL: legLGroup,
        legR: legRGroup
    };
}

window.SKIN = SKIN;
window.createSkin = createSkin;