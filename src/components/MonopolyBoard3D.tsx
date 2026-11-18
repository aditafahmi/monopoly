import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  LocateFixed,
} from 'lucide-react';
import {
  JAKSEL_TILES,
  JAIL_FINE,
  RoomState,
  formatRp,
} from '../shared/jakselBoard';
import { soundEngine } from '../utils/sound';
import {
  ATLAS_COLS,
  ATLAS_H,
  ATLAS_ROWS,
  ATLAS_W,
  TILE_LANDMARK_CAPTION,
  createCenterBoardTexture,
  drawAllTilesAtlas,
} from '../three/jakselTileArt';
import {
  createCornerMiniLandmarks,
  createDieMesh,
  createHotelModel,
  createHouseModel,
  createTokenModel,
  setDieTopFaceRotation,
} from '../three/jakselModels';

interface MonopolyBoard3DProps {
  state: RoomState;
  yourPlayerId: string | null;
  selectedTileIndex: number | null;
  onSelectTile: (index: number) => void;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onSkipBuy: () => void;
  onEndTurn: () => void;
  onPayJailFine: () => void;
  onUseJailCard: () => void;
  onStartGame: () => void;
}

type CameraPreset = 'iso' | 'overhead' | 'follow';

interface TilePlacement {
  x: number;
  z: number;
  width: number;
  depth: number;
  rotY: number;
}

const TILE_W = 1.8;
const TILE_D = 2.7;
const EDGE_POS = 6.75; // 8.1 - 1.35
const EDGE_INNER_LIMIT = 5.4; // 6.75 - 1.35

export function getTilePlacement(index: number): TilePlacement {
  if (index === 0) {
    return { x: EDGE_POS, z: EDGE_POS, width: TILE_D, depth: TILE_D, rotY: 0 };
  }
  if (index >= 1 && index <= 6) {
    return {
      x: EDGE_INNER_LIMIT - (index - 0.5) * TILE_W,
      z: EDGE_POS,
      width: TILE_W,
      depth: TILE_D,
      rotY: 0,
    };
  }
  if (index === 7) {
    return {
      x: -EDGE_POS,
      z: EDGE_POS,
      width: TILE_D,
      depth: TILE_D,
      rotY: -Math.PI / 2,
    };
  }
  if (index >= 8 && index <= 13) {
    return {
      x: -EDGE_POS,
      z: EDGE_INNER_LIMIT - (index - 7 - 0.5) * TILE_W,
      width: TILE_W,
      depth: TILE_D,
      rotY: -Math.PI / 2,
    };
  }
  if (index === 14) {
    return {
      x: -EDGE_POS,
      z: -EDGE_POS,
      width: TILE_D,
      depth: TILE_D,
      rotY: Math.PI,
    };
  }
  if (index >= 15 && index <= 20) {
    return {
      x: -EDGE_INNER_LIMIT + (index - 14 - 0.5) * TILE_W,
      z: -EDGE_POS,
      width: TILE_W,
      depth: TILE_D,
      rotY: Math.PI,
    };
  }
  if (index === 21) {
    return {
      x: EDGE_POS,
      z: -EDGE_POS,
      width: TILE_D,
      depth: TILE_D,
      rotY: Math.PI / 2,
    };
  }
  return {
    x: EDGE_POS,
    z: -EDGE_INNER_LIMIT + (index - 21 - 0.5) * TILE_W,
    width: TILE_W,
    depth: TILE_D,
    rotY: Math.PI / 2,
  };
}

// Pre-allocated scratch math helpers outside the render loop
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

export const MonopolyBoard3D: React.FC<MonopolyBoard3DProps> = ({
  state,
  yourPlayerId,
  selectedTileIndex,
  onSelectTile,
  onRollDice,
  onBuyProperty,
  onSkipBuy,
  onEndTurn,
  onPayJailFine,
  onUseJailCard,
  onStartGame,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredTileIndex, setHoveredTileIndex] = useState<number | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [cashPopup, setCashPopup] = useState<{
    id: number;
    text: string;
    positive: boolean;
  } | null>(null);

  // Latest reactive refs for stable 3D animation loop
  const stateRef = useRef(state);
  stateRef.current = state;
  const selectedTileRef = useRef(selectedTileIndex);
  selectedTileRef.current = selectedTileIndex;
  const hoveredTileRef = useRef<number | null>(null);
  hoveredTileRef.current = hoveredTileIndex;
  const onSelectTileRef = useRef(onSelectTile);
  onSelectTileRef.current = onSelectTile;
  const cameraPresetRef = useRef<CameraPreset>('iso');
  const cameraTransitioningRef = useRef<boolean>(false);

  const prevCashRef = useRef<Record<string, number>>({});
  const activeMoveRef = useRef<{
    sequenceId: string;
    playerId: string;
    fullPath: number[];
    startTime: number;
    lastHopSoundIdx: number;
    finished: boolean;
  } | null>(null);
  const lastHandledMoveIdRef = useRef<string | null>(null);
  const tokenCurrentTileRef = useRef<Record<string, number>>({});
  const diceAnimRef = useRef<{ active: boolean; startTime: number }>({
    active: false,
    startTime: 0,
  });
  const rippleStateRef = useRef<{
    active: boolean;
    startTime: number;
    x: number;
    z: number;
    color: string;
  }>({ active: false, startTime: 0, x: 0, z: 0, color: '#E5A93C' });

  // Track cash deltas for subtle feedback toast
  useEffect(() => {
    const targetPlayer =
      state.players.find((p) => p.id === yourPlayerId) ??
      state.players[state.currentTurnIndex];
    if (!targetPlayer) return;
    const prev = prevCashRef.current[targetPlayer.id];
    if (prev !== undefined && prev !== targetPlayer.cash) {
      const delta = targetPlayer.cash - prev;
      setCashPopup({
        id: Date.now(),
        text: `${delta > 0 ? '+' : ''}${formatRp(delta)}`,
        positive: delta > 0,
      });
      if (delta > 0) soundEngine.playCashIn();
      else soundEngine.playRentPaid();
    }
    for (const p of state.players) {
      prevCashRef.current[p.id] = p.cash;
    }
  }, [state.players, state.currentTurnIndex, yourPlayerId]);

  // Trigger 3D token hop sequence & 3D dice tumble on new move
  useEffect(() => {
    const move = state.lastMove;
    if (!move || move.sequenceId === lastHandledMoveIdRef.current) return;
    lastHandledMoveIdRef.current = move.sequenceId;
    if (move.steps.length === 0) return;

    const startTile =
      tokenCurrentTileRef.current[move.playerId] ?? move.steps[0];
    activeMoveRef.current = {
      sequenceId: move.sequenceId,
      playerId: move.playerId,
      fullPath: [startTile, ...move.steps],
      startTime: performance.now() + 340,
      lastHopSoundIdx: -1,
      finished: false,
    };
    diceAnimRef.current = { active: true, startTime: performance.now() };
    soundEngine.playDiceRoll();
  }, [state.lastMove]);

  // Initialize token baseline positions
  useEffect(() => {
    for (const p of state.players) {
      if (tokenCurrentTileRef.current[p.id] === undefined) {
        tokenCurrentTileRef.current[p.id] = p.position;
      }
    }
  }, [state.players]);

  const handlePresetChange = (preset: CameraPreset) => {
    setCameraPreset(preset);
    cameraPresetRef.current = preset;
    cameraTransitioningRef.current = true;
  };

  // Mount Three.js 3D Scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#08241D');
    scene.fog = new THREE.Fog('#08241D', 24, 52);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.2, 100);
    camera.position.set(0, 14.5, 14.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = 0.22;
    controls.maxPolarAngle = Math.PI / 2.22;
    controls.minDistance = 11.5;
    controls.maxDistance = 29;
    controls.target.set(0, 0, 0);
    controls.addEventListener('start', () => {
      cameraTransitioningRef.current = false;
    });

    // Studio 3-point Lighting Rig
    const hemi = new THREE.HemisphereLight('#BDE3F2', '#0A241D', 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight('#FFF5E0', 1.65);
    keyLight.position.set(10, 18, 11);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 42;
    const d = 11;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#38BDF8', 0.45);
    rimLight.position.set(-12, 9, -12);
    scene.add(rimLight);

    // Tabletop Felt Plane
    const tableMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(28, 28, 0.4, 48),
      new THREE.MeshStandardMaterial({
        color: '#0A2920',
        roughness: 0.92,
        metalness: 0.02,
      })
    );
    tableMesh.position.y = -0.42;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Sculpted Mahogany & Brass Monopoly Board Base
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    const mahoganyFrame = new THREE.Mesh(
      new THREE.BoxGeometry(17.1, 0.44, 17.1),
      new THREE.MeshStandardMaterial({
        color: '#3B2317',
        roughness: 0.48,
        metalness: 0.12,
      })
    );
    mahoganyFrame.position.y = -0.04;
    mahoganyFrame.receiveShadow = true;
    mahoganyFrame.castShadow = true;
    boardGroup.add(mahoganyFrame);

    const brassTrim = new THREE.Mesh(
      new THREE.BoxGeometry(16.46, 0.24, 16.46),
      new THREE.MeshStandardMaterial({
        color: '#E5A93C',
        roughness: 0.28,
        metalness: 0.82,
      })
    );
    brassTrim.position.y = 0.09;
    boardGroup.add(brassTrim);

    // Center Courtyard Textured Surface
    const centerCanvas = createCenterBoardTexture();
    const centerTex = new THREE.CanvasTexture(centerCanvas);
    centerTex.colorSpace = THREE.SRGBColorSpace;
    centerTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const centerSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(10.8, 10.8),
      new THREE.MeshStandardMaterial({
        map: centerTex,
        roughness: 0.7,
        metalness: 0.05,
      })
    );
    centerSurface.rotation.x = -Math.PI / 2;
    centerSurface.position.y = 0.215;
    centerSurface.receiveShadow = true;
    boardGroup.add(centerSurface);

    // 3D Chance & Community Chest card stacks on center courtyard
    const createCardDeck = (color: string, x: number, z: number) => {
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 0.22, 1.15),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
      );
      deck.position.set(x, 0.32, z);
      deck.rotation.y = Math.PI / 4;
      deck.castShadow = true;
      deck.receiveShadow = true;
      boardGroup.add(deck);
    };
    createCardDeck('#F59E0B', -2.85, -2.85);
    createCardDeck('#0284C7', 2.85, 2.85);

    // 3D Corner Mini Landmarks
    const cornerDioramas = createCornerMiniLandmarks();
    boardGroup.add(cornerDioramas);

    // Shared Animated Tile Atlas CanvasTexture
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = ATLAS_W;
    atlasCanvas.height = ATLAS_H;
    const atlasCtx = atlasCanvas.getContext('2d')!;
    drawAllTilesAtlas(atlasCtx, 0, stateRef.current.properties, {}, null, null);

    const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
    atlasTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const tileMaterial = new THREE.MeshStandardMaterial({
      map: atlasTexture,
      roughness: 0.55,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    // Build 28 Classic Perimeter Tile Meshes
    const tileMeshes: THREE.Mesh[] = [];
    const tileRaycasterGroup = new THREE.Group();
    boardGroup.add(tileRaycasterGroup);

    for (const tile of JAKSEL_TILES) {
      const place = getTilePlacement(tile.index);
      const geo = new THREE.PlaneGeometry(place.width - 0.03, place.depth - 0.03);
      const col = tile.index % ATLAS_COLS;
      const row = Math.floor(tile.index / ATLAS_COLS);
      const u0 = col / ATLAS_COLS;
      const u1 = (col + 1) / ATLAS_COLS;
      const v1 = 1 - row / ATLAS_ROWS;
      const v0 = 1 - (row + 1) / ATLAS_ROWS;

      const uv = geo.attributes.uv;
      uv.setXY(0, u0, v1);
      uv.setXY(1, u1, v1);
      uv.setXY(2, u0, v0);
      uv.setXY(3, u1, v0);
      uv.needsUpdate = true;

      const mesh = new THREE.Mesh(geo, tileMaterial);
      mesh.rotation.order = 'YXZ';
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.y = place.rotY;
      mesh.position.set(place.x, 0.22, place.z);
      mesh.receiveShadow = true;
      mesh.userData.tileIndex = tile.index;

      tileRaycasterGroup.add(mesh);
      tileMeshes.push(mesh);
    }

    // 3D Houses & Hotels Group
    const buildingsGroup = new THREE.Group();
    boardGroup.add(buildingsGroup);
    let lastBuildingSignature = '';

    // 3D Dice Pair in Center Courtyard
    const die1 = createDieMesh();
    const die2 = createDieMesh();
    die1.position.set(-0.62, 0.58, 0.25);
    die2.position.set(0.62, 0.58, -0.25);
    setDieTopFaceRotation(die1, stateRef.current.lastRoll?.[0] ?? 3);
    setDieTopFaceRotation(die2, stateRef.current.lastRoll?.[1] ?? 4);
    boardGroup.add(die1);
    boardGroup.add(die2);

    // Landing Ripple Ring Mesh
    const rippleMat = new THREE.MeshBasicMaterial({
      color: '#E5A93C',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const rippleMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.72, 28),
      rippleMat
    );
    rippleMesh.rotation.x = -Math.PI / 2;
    rippleMesh.position.y = 0.24;
    rippleMesh.visible = false;
    boardGroup.add(rippleMesh);

    // Dynamic Player Tokens Registry
    const tokenGroups = new Map<string, THREE.Group>();

    const syncPlayersAndBuildings = () => {
      const s = stateRef.current;
      // Sync player token meshes
      const activeIds = new Set(
        s.players.filter((p) => !p.bankrupt).map((p) => p.id)
      );
      for (const [id, grp] of tokenGroups.entries()) {
        if (!activeIds.has(id)) {
          boardGroup.remove(grp);
          tokenGroups.delete(id);
        }
      }
      for (const p of s.players) {
        if (p.bankrupt) continue;
        if (!tokenGroups.has(p.id)) {
          const mdl = createTokenModel(p.token, p.color);
          const place = getTilePlacement(p.position);
          mdl.position.set(place.x, 0.22, place.z);
          boardGroup.add(mdl);
          tokenGroups.set(p.id, mdl);
        }
      }

      // Sync Houses & Hotels when ownership/houses change
      const sig = JAKSEL_TILES.map((t) => {
        const pr = s.properties[t.index];
        return pr ? `${t.index}:${pr.houses}:${pr.ownerId ?? ''}` : '';
      }).join('|');

      if (sig !== lastBuildingSignature) {
        lastBuildingSignature = sig;
        while (buildingsGroup.children.length > 0) {
          buildingsGroup.remove(buildingsGroup.children[0]);
        }
        for (const tile of JAKSEL_TILES) {
          const prop = s.properties[tile.index];
          if (!prop || prop.houses <= 0) continue;
          const place = getTilePlacement(tile.index);
          const group = new THREE.Group();
          group.position.set(place.x, 0.22, place.z);
          group.rotation.y = place.rotY;

          if (prop.houses === 5) {
            const hotel = createHotelModel();
            hotel.position.set(0, 0, -place.depth * 0.36);
            group.add(hotel);
          } else {
            const spacing = 0.36;
            const startX = -((prop.houses - 1) * spacing) / 2;
            for (let h = 0; h < prop.houses; h++) {
              const house = createHouseModel();
              house.position.set(startX + h * spacing, 0, -place.depth * 0.36);
              group.add(house);
            }
          }
          buildingsGroup.add(group);
        }
      }
    };

    // Raycast Hover & Click Interaction
    let pointerDownPos = { x: 0, y: 0 };
    let lastMoveCheck = 0;

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 6) return; // Ignore orbit drag
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.intersectObjects(tileMeshes, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.tileIndex as number;
        onSelectTileRef.current(idx);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveCheck < 40) return;
      lastMoveCheck = now;
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.intersectObjects(tileMeshes, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.tileIndex as number;
        renderer.domElement.style.cursor = 'pointer';
        if (hoveredTileRef.current !== idx) {
          setHoveredTileIndex(idx);
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
        if (hoveredTileRef.current !== null) {
          setHoveredTileIndex(null);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 320);
      const h = Math.max(container.clientHeight, 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Animation Loop
    let frameId = 0;
    let disposed = false;
    let frameCounter = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const nowMs = performance.now();
      const s = stateRef.current;

      syncPlayersAndBuildings();

      // Animate 28 landmark illustrations in round-robin batches (7 tiles/frame)
      frameCounter += 1;
      const ownerColorById: Record<string, string> = {};
      for (const p of s.players) {
        ownerColorById[p.id] = p.color;
      }
      if (!isSoftwareGl || frameCounter % 3 === 0) {
        const batch = isSoftwareGl ? undefined : frameCounter % 4;
        drawAllTilesAtlas(
          atlasCtx,
          elapsed,
          s.properties,
          ownerColorById,
          hoveredTileRef.current,
          selectedTileRef.current,
          batch
        );
        atlasTexture.needsUpdate = true;
      }

      // Compute stationary tile slot offsets
      const byTile = new Map<number, string[]>();
      for (const p of s.players) {
        if (p.bankrupt) continue;
        const arr = byTile.get(p.position) ?? [];
        arr.push(p.id);
        byTile.set(p.position, arr);
      }

      // Update 3D player token positions & hopping animations
      const activePlayer = s.players[s.currentTurnIndex];
      const move = activeMoveRef.current;

      for (const p of s.players) {
        if (p.bankrupt) continue;
        const grp = tokenGroups.get(p.id);
        if (!grp) continue;

        if (move && move.playerId === p.id && !move.finished) {
          const stepDur = move.fullPath.length > 7 ? 155 : 195;
          const moveElapsed = nowMs - move.startTime;
          if (moveElapsed >= 0) {
            const rawStep = moveElapsed / stepDur;
            const segIdx = Math.min(
              move.fullPath.length - 2,
              Math.floor(rawStep)
            );
            const t = Math.min(1, rawStep - segIdx);
            const fromPlace = getTilePlacement(move.fullPath[segIdx]);
            const toPlace = getTilePlacement(move.fullPath[segIdx + 1]);

            const eased = 1 - Math.pow(1 - t, 2.2);
            const x = THREE.MathUtils.lerp(fromPlace.x, toPlace.x, eased);
            const z = THREE.MathUtils.lerp(fromPlace.z, toPlace.z, eased);
            const hopY = 0.22 + Math.sin(t * Math.PI) * 0.95;

            grp.position.set(x, hopY, z);
            // Face direction of travel
            const dx = toPlace.x - fromPlace.x;
            const dz = toPlace.z - fromPlace.z;
            if (Math.abs(dx) + Math.abs(dz) > 0.01) {
              grp.rotation.y = Math.atan2(-dz, dx);
            }
            const stretch = 1 + Math.sin(t * Math.PI) * 0.14;
            grp.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));

            if (segIdx > move.lastHopSoundIdx) {
              move.lastHopSoundIdx = segIdx;
              soundEngine.playTokenHop(segIdx);
            }

            if (rawStep >= move.fullPath.length - 1) {
              move.finished = true;
              const finalIdx = move.fullPath[move.fullPath.length - 1];
              tokenCurrentTileRef.current[p.id] = finalIdx;
              const finalPlace = getTilePlacement(finalIdx);
              grp.scale.set(1, 1, 1);
              rippleStateRef.current = {
                active: true,
                startTime: nowMs,
                x: finalPlace.x,
                z: finalPlace.z,
                color: p.color,
              };
            }
          }
        } else {
          // Stationary resting position + subtle idle bob for active turn player
          const place = getTilePlacement(p.position);
          const groupIds = byTile.get(p.position) ?? [p.id];
          const slotIdx = groupIds.indexOf(p.id);
          let offX = 0;
          let offZ = 0;
          if (groupIds.length > 1) {
            const angle = (slotIdx / groupIds.length) * Math.PI * 2;
            offX = Math.cos(angle) * 0.45;
            offZ = Math.sin(angle) * 0.45;
          }
          const isActive =
            s.phase !== 'LOBBY' &&
            s.phase !== 'GAME_OVER' &&
            activePlayer?.id === p.id;
          const bob = isActive ? Math.abs(Math.sin(elapsed * 3.2)) * 0.14 : 0;

          grp.position.x = THREE.MathUtils.damp(
            grp.position.x,
            place.x + offX,
            10,
            delta
          );
          grp.position.z = THREE.MathUtils.damp(
            grp.position.z,
            place.z + offZ,
            10,
            delta
          );
          grp.position.y = 0.22 + bob;
          grp.scale.set(1, 1, 1);
          grp.rotation.y = THREE.MathUtils.damp(
            grp.rotation.y,
            place.rotY + Math.PI,
            8,
            delta
          );
        }
      }

      // 3D Dice Tumble Animation
      const dAnim = diceAnimRef.current;
      if (dAnim.active) {
        const dt = (nowMs - dAnim.startTime) / 1000;
        if (dt < 0.65) {
          const arc = Math.sin((dt / 0.65) * Math.PI);
          die1.position.y = 0.58 + arc * 1.45;
          die2.position.y = 0.58 + arc * 1.65;
          die1.rotation.x += delta * 14;
          die1.rotation.y += delta * 11;
          die2.rotation.z += delta * 15;
          die2.rotation.y -= delta * 12;
        } else {
          dAnim.active = false;
          die1.position.y = 0.58;
          die2.position.y = 0.58;
          setDieTopFaceRotation(die1, s.lastRoll?.[0] ?? 3);
          setDieTopFaceRotation(die2, s.lastRoll?.[1] ?? 4);
        }
      }

      // Landing Ripple Effect
      const rip = rippleStateRef.current;
      if (rip.active) {
        const rAge = (nowMs - rip.startTime) / 650;
        if (rAge < 1) {
          rippleMesh.visible = true;
          rippleMesh.position.set(rip.x, 0.24, rip.z);
          const sc = 0.8 + rAge * 1.8;
          rippleMesh.scale.set(sc, sc, 1);
          rippleMat.color.set(rip.color);
          rippleMat.opacity = (1 - rAge) * 0.85;
        } else {
          rip.active = false;
          rippleMesh.visible = false;
        }
      }

      // Smooth Camera Preset Transitions (canceled immediately on user drag)
      if (cameraTransitioningRef.current) {
        const preset = cameraPresetRef.current;
        if (preset === 'iso') {
          _targetCamPos.set(0, 14.5, 14.5);
          _targetLookAt.set(0, 0, 0);
        } else if (preset === 'overhead') {
          _targetCamPos.set(0, 21, 5.2);
          _targetLookAt.set(0, 0, 0);
        } else if (preset === 'follow' && activePlayer) {
          const pl = getTilePlacement(activePlayer.position);
          _targetCamPos.set(pl.x * 1.35, 10.5, pl.z * 1.35 + 4.5);
          _targetLookAt.set(pl.x * 0.45, 0.3, pl.z * 0.45);
        }
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          _targetCamPos.x,
          5,
          delta
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          _targetCamPos.y,
          5,
          delta
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          _targetCamPos.z,
          5,
          delta
        );
        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          _targetLookAt.x,
          5,
          delta
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          _targetLookAt.y,
          5,
          delta
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          _targetLookAt.z,
          5,
          delta
        );
        if (camera.position.distanceTo(_targetCamPos) < 0.08) {
          cameraTransitioningRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      tick();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      controls.dispose();
      centerTex.dispose();
      atlasTexture.dispose();
      tileMaterial.dispose();
      tileMeshes.forEach((m) => m.geometry.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const currentPlayer = state.players[state.currentTurnIndex];
  const isYourTurn = Boolean(currentPlayer && currentPlayer.id === yourPlayerId);
  const isHost = yourPlayerId === state.hostId;
  const activeTile = currentPlayer ? JAKSEL_TILES[currentPlayer.position] : null;
  const hoveredTile = hoveredTileIndex !== null ? JAKSEL_TILES[hoveredTileIndex] : null;

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-[#F6F2E9]/10 bg-[#08241D]">
      {/* Dedicated WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top-Left Minimal Hover Landmark Tooltip (no backdrop-blur over WebGL) */}
      {hoveredTile && (
        <div className="pointer-events-none absolute top-3 left-3 z-10 rounded-xl bg-[#0B261F]/95 border border-[#E5A93C]/40 px-3.5 py-2 shadow-lg max-w-[270px]">
          <div className="text-xs font-bold text-[#F6F2E9]">
            {hoveredTile.name}
          </div>
          <div className="text-[11px] text-[#E5A93C] mt-0.5 leading-snug">
            {TILE_LANDMARK_CAPTION[hoveredTile.index] ?? hoveredTile.sublabel}
          </div>
          {hoveredTile.price && (
            <div className="font-mono text-[11px] text-[#F6F2E9]/80 mt-0.5 tabular-nums">
              Harga {formatRp(hoveredTile.price)}
            </div>
          )}
        </div>
      )}

      {/* Top-Right Compact Pot & Camera View Switcher */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <div className="hidden sm:block rounded-xl bg-[#0B261F]/92 border border-[#F6F2E9]/12 px-3 py-1.5 text-[11px] font-mono text-[#F6F2E9]/85 tabular-nums">
          Kas Literasi: {formatRp(state.freeParkingPot)}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B261F]/92 border border-[#F6F2E9]/12">
          <button
            type="button"
            onClick={() => handlePresetChange('iso')}
            title="Sudut 3D Klasik"
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              cameraPreset === 'iso'
                ? 'bg-[#E5A93C] text-[#08241D] font-bold'
                : 'text-[#F6F2E9]/75 hover:text-white'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>3D</span>
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('overhead')}
            title="Sudut Atas 3D"
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              cameraPreset === 'overhead'
                ? 'bg-[#E5A93C] text-[#08241D] font-bold'
                : 'text-[#F6F2E9]/75 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Atas</span>
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('follow')}
            title="Fokus Pion Aktif"
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              cameraPreset === 'follow'
                ? 'bg-[#E5A93C] text-[#08241D] font-bold'
                : 'text-[#F6F2E9]/75 hover:text-white'
            }`}
          >
            <LocateFixed className="w-3 h-3" />
            <span>Pion</span>
          </button>
        </div>
      </div>

      {/* Floating Cash Delta Feedback */}
      {cashPopup && (
        <div
          key={cashPopup.id}
          className={`pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-20 animate-float-delta font-mono font-bold text-sm px-3 py-1 rounded-lg shadow-lg ${
            cashPopup.positive
              ? 'bg-emerald-950/95 text-emerald-300 border border-emerald-400/50'
              : 'bg-rose-950/95 text-rose-300 border border-rose-400/50'
          }`}
        >
          {cashPopup.text}
        </div>
      )}

      {/* Collapsible Unified Bottom Control Dock (zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex flex-col items-center px-3">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1 rounded-lg bg-[#0B261F]/95 border border-[#F6F2E9]/15 px-3 py-1 text-[11px] font-medium text-[#F6F2E9]/80 hover:text-white transition-colors cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>Tampilkan Kontrol</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>Sembunyikan</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full max-w-[660px] rounded-2xl bg-[#0B261F]/95 border border-[#E5A93C]/35 px-4 py-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Turn & Status Readout */}
            <div className="min-w-0 text-center sm:text-left">
              {state.phase === 'LOBBY' ? (
                <>
                  <div className="text-[11px] font-mono text-[#E5A93C]">
                    MEJA {state.roomId} · {state.players.length}/4 PEMAIN
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-[#F6F2E9] truncate">
                    Seret papan untuk memutar sudut 3D · Klik petak untuk info
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs">
                    {currentPlayer && (
                      <>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: currentPlayer.color }}
                        />
                        <span className="font-bold text-[#F6F2E9] truncate">
                          {currentPlayer.id === yourPlayerId
                            ? 'Giliran Anda'
                            : `Giliran ${currentPlayer.name}`}
                        </span>
                      </>
                    )}
                    <span className="text-[#F6F2E9]/40">·</span>
                    <span className="font-mono text-[#E5A93C] tabular-nums">
                      Putaran {state.turnCount}
                    </span>
                    {state.lastRoll && (
                      <>
                        <span className="text-[#F6F2E9]/40">·</span>
                        <span className="font-mono text-[#F6F2E9]/85 tabular-nums">
                          Dadu {state.lastRoll[0]}+{state.lastRoll[1]}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-[#F6F2E9]/75 truncate mt-0.5">
                    {state.actionBanner}
                  </div>
                </>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {state.phase === 'LOBBY' && isHost && (
                <button
                  type="button"
                  onClick={onStartGame}
                  disabled={state.players.length < 2}
                  className="rounded-xl bg-[#E5A93C] hover:bg-[#EEB64E] disabled:opacity-45 disabled:cursor-not-allowed text-[#08241D] font-bold text-xs sm:text-sm py-2 px-4 shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Mulai Permainan
                </button>
              )}

              {state.phase === 'LOBBY' && !isHost && (
                <span className="text-xs font-medium text-[#E5A93C] whitespace-nowrap">
                  Menunggu Host...
                </span>
              )}

              {isYourTurn && state.phase === 'ROLL' && (
                <>
                  {currentPlayer?.inJail && (
                    <>
                      <button
                        type="button"
                        onClick={onPayJailFine}
                        disabled={currentPlayer.cash < JAIL_FINE}
                        className="rounded-xl bg-[#153D33] hover:bg-[#1C4D40] disabled:opacity-40 text-xs font-semibold text-[#F6F2E9] py-2 px-3 cursor-pointer whitespace-nowrap"
                      >
                        Denda {formatRp(JAIL_FINE)}
                      </button>
                      {currentPlayer.jailFreeCards > 0 && (
                        <button
                          type="button"
                          onClick={onUseJailCard}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white py-2 px-3 cursor-pointer whitespace-nowrap"
                        >
                          Kartu Bebas
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={onRollDice}
                    className="rounded-xl bg-[#E5A93C] hover:bg-[#EEB64E] text-[#08241D] font-bold text-xs sm:text-sm py-2 px-4 shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    {currentPlayer?.inJail ? 'Lempar Kembar' : 'Lempar Dadu'}
                  </button>
                </>
              )}

              {isYourTurn && state.phase === 'BUY_DECISION' && activeTile && (
                <>
                  <button
                    type="button"
                    onClick={onBuyProperty}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#052018] font-bold text-xs sm:text-sm py-2 px-3.5 shadow-md transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    Beli {formatRp(activeTile.price ?? 0)}
                  </button>
                  <button
                    type="button"
                    onClick={onSkipBuy}
                    className="rounded-xl bg-[#153D33] hover:bg-[#1E4F43] text-[#F6F2E9] font-semibold text-xs sm:text-sm py-2 px-3 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Lewati
                  </button>
                </>
              )}

              {isYourTurn && state.phase === 'END_TURN' && (
                <button
                  type="button"
                  onClick={onEndTurn}
                  className="rounded-xl bg-[#E05A47] hover:bg-[#EC6C59] text-white font-bold text-xs sm:text-sm py-2 px-4 shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {state.lastRollWasDouble && !currentPlayer?.inJail
                    ? 'Lempar Lagi (Kembar!)'
                    : 'Akhiri Giliran'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
