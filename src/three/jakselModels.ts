import * as THREE from 'three';
import { TokenId } from '../shared/jakselBoard';

export function createTokenModel(token: TokenId, colorHex: string): THREE.Group {
  const group = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.28,
    metalness: 0.25,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: '#F6F2E9',
    roughness: 0.4,
    metalness: 0.05,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: '#182220',
    roughness: 0.65,
    metalness: 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#93C5FD',
    roughness: 0.12,
    metalness: 0.6,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#E5A93C',
    roughness: 0.25,
    metalness: 0.85,
  });

  // Base pedestal disc (bottom-center pivot at y=0)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.5, 0.1, 24),
    brassMat
  );
  base.position.y = 0.05;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  if (token === 'bajaj') {
    // 7-part Bajaj Jaksel
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.24, 0.52), paintMat);
    chassis.position.set(0, 0.3, 0);
    chassis.castShadow = true;
    group.add(chassis);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.28, 0.48), creamMat);
    canopy.position.set(-0.04, 0.55, 0);
    canopy.castShadow = true;
    group.add(canopy);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.52), paintMat);
    roof.position.set(-0.02, 0.71, 0);
    roof.castShadow = true;
    group.add(roof);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.4), glassMat);
    windshield.position.set(0.25, 0.52, 0);
    windshield.rotation.z = -0.2;
    group.add(windshield);

    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), brassMat);
    headlight.position.set(0.37, 0.33, 0);
    group.add(headlight);

    const wheelGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.09, 16);
    wheelGeo.rotateX(Math.PI / 2);
    for (const [wx, wz] of [
      [0.24, 0],
      [-0.22, 0.24],
      [-0.22, -0.24],
    ]) {
      const wheel = new THREE.Mesh(wheelGeo, darkMat);
      wheel.position.set(wx, 0.18, wz);
      wheel.castShadow = true;
      group.add(wheel);
    }
    return group;
  }

  if (token === 'vespa') {
    // 7-part Vespa Senopati
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.26), paintMat);
    body.position.set(-0.06, 0.32, 0);
    body.castShadow = true;
    group.add(body);

    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.28), creamMat);
    shield.position.set(0.22, 0.44, 0);
    shield.rotation.z = 0.18;
    shield.castShadow = true;
    group.add(shield);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.22), darkMat);
    seat.position.set(-0.1, 0.46, 0);
    group.add(seat);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 10), brassMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.2, 0.67, 0);
    group.add(handle);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), creamMat);
    lamp.position.set(0.27, 0.67, 0);
    group.add(lamp);

    const wheelGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.09, 16);
    wheelGeo.rotateX(Math.PI / 2);
    for (const wx of [0.24, -0.24]) {
      const w = new THREE.Mesh(wheelGeo, darkMat);
      w.position.set(wx, 0.2, 0);
      w.castShadow = true;
      group.add(w);
    }
    return group;
  }

  if (token === 'mrt') {
    // 6-part MRT Ratangga
    const car = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.36, 0.4), creamMat);
    car.position.set(0, 0.34, 0);
    car.castShadow = true;
    group.add(car);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.08, 0.42), paintMat);
    stripe.position.set(0, 0.28, 0);
    group.add(stripe);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.34), glassMat);
    cab.position.set(0.37, 0.39, 0);
    group.add(cab);

    const acPod1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.24), darkMat);
    acPod1.position.set(-0.18, 0.55, 0);
    group.add(acPod1);

    const acPod2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.24), darkMat);
    acPod2.position.set(0.14, 0.55, 0);
    group.add(acPod2);

    const bogie = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.09, 0.32), darkMat);
    bogie.position.set(0, 0.14, 0);
    group.add(bogie);
    return group;
  }

  // 5-part Kopi Cipete Cup
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.2, 0.56, 20),
    creamMat
  );
  cup.position.y = 0.38;
  cup.castShadow = true;
  group.add(cup);

  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.265, 0.23, 0.24, 20),
    paintMat
  );
  sleeve.position.y = 0.38;
  group.add(sleeve);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.07, 20),
    creamMat
  );
  lid.position.y = 0.68;
  lid.castShadow = true;
  group.add(lid);

  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.32, 10),
    brassMat
  );
  straw.position.set(0.07, 0.82, 0);
  straw.rotation.z = -0.22;
  group.add(straw);

  return group;
}

export function createHouseModel(): THREE.Group {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: '#10B981', roughness: 0.45 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#065F46', roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.32), wallMat);
  body.position.y = 0.11;
  body.castShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.18, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.31;
  roof.castShadow = true;
  g.add(roof);

  return g;
}

export function createHotelModel(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#DC2626', roughness: 0.35 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#E5A93C', roughness: 0.25, metalness: 0.7 });

  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.36), bodyMat);
  tower.position.y = 0.28;
  tower.castShadow = true;
  g.add(tower);

  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.24), trimMat);
  crown.position.y = 0.62;
  crown.castShadow = true;
  g.add(crown);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), trimMat);
  spire.position.y = 0.77;
  g.add(spire);

  return g;
}

export function createDieMesh(): THREE.Mesh {
  const materials: THREE.MeshStandardMaterial[] = [];
  // Box faces order in Three.js: +X (3), -X (4), +Y (1), -Y (6), +Z (2), -Z (5)
  const faceValues = [3, 4, 1, 6, 2, 5];
  const pips: Record<number, Array<[number, number]>> = {
    1: [[64, 64]],
    2: [
      [34, 34],
      [94, 94],
    ],
    3: [
      [34, 34],
      [64, 64],
      [94, 94],
    ],
    4: [
      [34, 34],
      [94, 34],
      [34, 94],
      [94, 94],
    ],
    5: [
      [34, 34],
      [94, 34],
      [64, 64],
      [34, 94],
      [94, 94],
    ],
    6: [
      [34, 30],
      [94, 30],
      [34, 64],
      [94, 64],
      [34, 98],
      [94, 98],
    ],
  };

  for (const val of faceValues) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#F6F2E9';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#D6CEBE';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 122, 122);

    ctx.fillStyle = val === 1 ? '#E05A47' : '#182220';
    for (const [px, py] of pips[val]) {
      ctx.beginPath();
      ctx.arc(px, py, val === 1 ? 15 : 11, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    materials.push(
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.3,
        metalness: 0.05,
      })
    );
  }

  const die = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), materials);
  die.castShadow = true;
  die.receiveShadow = true;
  return die;
}

export function setDieTopFaceRotation(die: THREE.Mesh, value: number): void {
  // Orient die so `value` sits on +Y face
  switch (value) {
    case 1:
      die.rotation.set(0, 0, 0);
      break;
    case 6:
      die.rotation.set(Math.PI, 0, 0);
      break;
    case 2:
      die.rotation.set(-Math.PI / 2, 0, 0);
      break;
    case 5:
      die.rotation.set(Math.PI / 2, 0, 0);
      break;
    case 3:
      die.rotation.set(0, 0, Math.PI / 2);
      break;
    case 4:
      die.rotation.set(0, 0, -Math.PI / 2);
      break;
    default:
      die.rotation.set(0, 0, 0);
  }
}

export function createCornerMiniLandmarks(): THREE.Group {
  const root = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#E5A93C',
    roughness: 0.25,
    metalness: 0.85,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.55,
  });
  const emeraldMat = new THREE.MeshStandardMaterial({
    color: '#10B981',
    roughness: 0.45,
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: '#EF4444',
    roughness: 0.4,
  });

  // Tile 0 (Bundaran Senayan +6.75, +6.75): Mini Patung Pemuda pedestal on outer corner
  const senayan = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 10, 24), stoneMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  senayan.add(ring);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.65, 12), stoneMat);
  pillar.position.y = 0.35;
  pillar.castShadow = true;
  senayan.add(pillar);
  const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), goldMat);
  flame.position.y = 0.78;
  senayan.add(flame);
  senayan.position.set(7.55, 0.2, 7.55);
  root.add(senayan);

  // Tile 14 (Taman Literasi -6.75, -6.75): Circular green garden pavilion
  const taman = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.14, 20), emeraldMat);
  pad.position.y = 0.07;
  taman.add(pad);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.24, 16), goldMat);
  roof.position.y = 0.48;
  taman.add(roof);
  taman.position.set(-7.55, 0.2, -7.55);
  root.add(taman);

  // Tile 21 (Tilang ETLE +6.75, -6.75): Traffic camera post
  const etle = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 10), stoneMat);
  post.position.y = 0.4;
  etle.add(post);
  const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.2), redMat);
  camBox.position.set(-0.15, 0.78, 0.15);
  etle.add(camBox);
  etle.position.set(7.55, 0.2, -7.55);
  root.add(etle);

  return root;
}
