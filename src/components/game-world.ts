import * as THREE from "three";
import { navLinks } from "@/data/content";

const stations = [
  { x: 0, z: 0, kind: "statue", reach: 2.15, labelY: 3.8, approach: 1.9 },
  { x: 0, z: -7.6, kind: "portal", reach: 1.55, labelY: 3.1, approach: 1.15 },
  { x: 6.4, z: -4.6, kind: "portal", reach: 1.55, labelY: 3.1, approach: 1.15 },
  { x: 6.2, z: 3.6, kind: "npc", reach: 1.8, labelY: 2.7, approach: 1.3 },
];
const islandRadius = 15;
// Stay inside the octagonal shore, including the robot's footprint.
const walkRadius = islandRadius * Math.cos(Math.PI / 8) - .4;
const keys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "]);

export type GameWorld = ReturnType<typeof createGameWorld>;

export function createGameWorld(host: HTMLDivElement, hint: HTMLParagraphElement, labels: HTMLDivElement, onPortal: (index: number) => void, onError: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  // A separate sky pass keeps distant scenery behind the island at every camera angle.
  const sky = new THREE.Scene();
  const skyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 20);
  skyCamera.position.z = 10;
  renderer.autoClear = false;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const target = new THREE.Vector3(0, 0.5, 0);
  const cameraGoal = new THREE.Vector3();
  const materials: THREE.Material[] = [];
  const material = (color: string, roughness = 0.8) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
    materials.push(value);
    return value;
  };
  const ground = material("#93b8a4");
  const stone = material("#557967");
  const dark = material("#233f34");
  const pale = material("#e3ece1");
  const accent = material("#4ea783");
  const leaf = material("#39775a");
  const light = new THREE.HemisphereLight(0xe4f5ed, 0x354e40, 3);
  scene.add(light);
  const sun = new THREE.DirectionalLight(0xfff7e6, 3.4);
  sun.position.set(-10, 20, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 19, bottom: -19, far: 65 });
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  }

  const cloudMaterial = new THREE.MeshBasicMaterial({ color: "#fafcf4" });
  const celestialMaterial = new THREE.MeshBasicMaterial({ color: "#efd38f" });
  const craterMaterial = new THREE.MeshBasicMaterial({ color: "#a5b6b3" });
  materials.push(cloudMaterial, celestialMaterial, craterMaterial);
  const clouds = Array.from({ length: 6 }, (_, index) => {
    const group = new THREE.Group();
    group.position.set(-1.1 + index * .43, [.56, -.12, .78, -.64, .35, -.38][index], -index * .1);
    group.scale.setScalar(index % 2 ? .8 : 1);
    sky.add(group);
    [[-.15, 0, .12], [0, .04, .17], [.17, -.015, .13], [.29, -.04, .085]].forEach(([x, y, radius]) => {
      const puff = mesh(new THREE.SphereGeometry(radius, 10, 7), cloudMaterial, x, y, 0, group);
      puff.scale.y = .68;
    });
    return group;
  });
  const celestial = new THREE.Group();
  sky.add(celestial);
  mesh(new THREE.SphereGeometry(.115, 20, 12), celestialMaterial, 0, 0, 0, celestial);
  const rays = new THREE.Group();
  celestial.add(rays);
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5;
    const ray = box(.012, .04, .01, celestialMaterial, Math.sin(angle) * .156, Math.cos(angle) * .156, 0, rays);
    ray.rotation.z = -angle;
  }
  const craters = new THREE.Group();
  celestial.add(craters);
  [[-.035, .037, .028], [.045, -.016, .019], [-.015, -.054, .015]].forEach(([x, y, radius]) => {
    mesh(new THREE.CircleGeometry(radius, 12), craterMaterial, x, y, .113, craters);
  });
  craters.visible = false;

  mesh(new THREE.CylinderGeometry(islandRadius, islandRadius - 1, 0.65, 8), ground, 0, -0.35, 0);
  mesh(new THREE.CylinderGeometry(islandRadius - 1, islandRadius * .64, 2.2, 8), stone, 0, -1.75, 0);
  mesh(new THREE.ConeGeometry(islandRadius * .64, 3, 8), dark, 0, -4.35, 0).rotation.z = Math.PI;
  for (const station of stations) {
    const steps = Math.ceil(Math.hypot(station.x, station.z) / .9);
    for (let i = 1; i < steps; i++) {
      if (Math.hypot(station.x * i / steps, station.z * i / steps) < 1.8) continue;
      const tile = box(.78, .035, .65, pale, station.x * i / steps, 0, station.z * i / steps);
      tile.rotation.y = Math.atan2(station.x, station.z);
    }
  }
  // Small fixed set of obstacles, with circular collision footprints.
  const obstacles = [
    { x: -8.4, z: 1.4, r: .65 }, { x: 4.8, z: 6.8, r: .65 }, { x: -3.4, z: 9.2, r: .65 },
    { x: -3, z: -8.5, r: .65 }, { x: 8.6, z: -.5, r: .65 }, { x: -7.7, z: -3, r: .65 },
    { x: 3.5, z: -7.8, r: .65 }, { x: -2.8, z: 4.5, r: .65 },
    { x: -11.4, z: 3, r: .65 }, { x: -10, z: -8, r: .65 }, { x: 8, z: 9.5, r: .65 },
    { x: 11.5, z: -5, r: .65 }, { x: 1.8, z: 11.5, r: .65 },
  ];
  const crowns = obstacles.map((tree) => {
    mesh(new THREE.CylinderGeometry(.12, .18, 1.2, 6), dark, tree.x, .6, tree.z);
    const crown = new THREE.Group();
    crown.position.set(tree.x, 1.1, tree.z);
    scene.add(crown);
    mesh(new THREE.ConeGeometry(.8, 1.7, 5), leaf, 0, .65, 0, crown);
    mesh(new THREE.ConeGeometry(.57, 1.2, 5), accent, 0, 1.45, 0, crown);
    return crown;
  });
  // Both the base and the full blade sweep sit comfortably inside the shore.
  const windmill = new THREE.Group();
  windmill.position.set(-6.1, 0, -5.2);
  scene.add(windmill);
  mesh(new THREE.CylinderGeometry(.85, .95, .16, 8), stone, 0, .05, 0, windmill);
  obstacles.push({ x: windmill.position.x, z: windmill.position.z, r: 1.15 });
  mesh(new THREE.CylinderGeometry(.25, .5, 2.7, 8), pale, 0, 1.35, 0, windmill);
  mesh(new THREE.ConeGeometry(.55, .65, 8), accent, 0, 3, 0, windmill);
  const rotor = new THREE.Group();
  rotor.position.set(0, 2.35, .48);
  windmill.add(rotor);
  mesh(new THREE.SphereGeometry(.17, 10, 8), dark, 0, 0, .05, rotor);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group();
    blade.rotation.z = i * Math.PI / 2;
    rotor.add(blade);
    box(.09, 1.2, .07, dark, 0, .7, 0, blade);
    box(.3, .73, .045, pale, .13, .87, .04, blade);
  }
  const castle = new THREE.Group();
  castle.position.set(7.3, 0, -9.4);
  scene.add(castle);
  const castleStone = material("#b1bab0");
  const castleRoof = material("#58718a");
  box(3.5, .16, 3.1, stone, 0, .05, 0, castle);
  box(2.5, 1.7, 2, castleStone, 0, .95, 0, castle);
  box(1.15, 2.6, 1.1, pale, 0, 1.4, -.25, castle);
  const keepRoof = mesh(new THREE.ConeGeometry(1, .9, 4), castleRoof, 0, 3.15, -.25, castle);
  keepRoof.rotation.y = Math.PI / 4;
  for (const x of [-1.3, 1.3]) {
    for (const z of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(.43, .48, 2.3, 8), castleStone, x, 1.23, z, castle);
      mesh(new THREE.ConeGeometry(.59, .85, 8), castleRoof, x, 2.8, z, castle);
      box(.13, .38, .025, dark, x, 1.8, z + .43, castle);
    }
  }
  for (let i = 0; i < 7; i++) {
    for (const z of [-1, 1]) box(.22, .3, .25, pale, -1.05 + i * .35, 1.94, z, castle);
  }
  // A recessed gate is decorative; the keep remains a solid obstacle.
  box(.68, 1.03, .05, dark, 0, .64, 1.025, castle);
  for (const x of [-.22, 0, .22]) box(.04, .95, .025, castleStone, x, .62, 1.06, castle);
  box(.95, .08, .65, pale, 0, .08, 1.45, castle);
  mesh(new THREE.CylinderGeometry(.025, .025, .9, 6), dark, 0, 3.9, -.25, castle);
  const flagGeometry = new THREE.PlaneGeometry(.65, .32, 8, 2);
  flagGeometry.translate(.325, 0, 0);
  const flagMaterial = material("#bd855e");
  flagMaterial.side = THREE.DoubleSide;
  const castleFlag = mesh(flagGeometry, flagMaterial, 0, 4.12, -.25, castle);
  obstacles.push({ x: castle.position.x, z: castle.position.z, r: 2.75 });

  [[-8, -7], [9, .6], [-3.6, -9.2], [-1.8, 8.4], [-9, 3.5], [8, 6]].forEach(([x, z], i) => {
    const rock = mesh(new THREE.DodecahedronGeometry(.35 + i * .06, 0), stone, x, .2, z);
    rock.scale.y = .7;
  });
  const floats = [-1, 1].map((sign) => {
    const group = new THREE.Group();
    group.position.set(sign * (islandRadius + .8), -1.6, sign * 5);
    scene.add(group);
    mesh(new THREE.DodecahedronGeometry(.85, 0), stone, 0, 0, 0, group);
    mesh(new THREE.ConeGeometry(.45, .9, 5), accent, 0, .85, 0, group);
    return group;
  });

  const water = new THREE.MeshStandardMaterial({ color: "#4babb8", roughness: .25, transparent: true, opacity: .7, flatShading: true, side: THREE.DoubleSide });
  const foam = new THREE.MeshBasicMaterial({ color: "#d4f6ed", transparent: true, opacity: .65 });
  materials.push(water, foam);
  const pond = { x: -8, z: 7, radius: 2.15 };
  mesh(new THREE.CylinderGeometry(pond.radius, pond.radius + .1, .06, 32), dark, pond.x, .005, pond.z);
  const pondSurface = mesh(new THREE.CircleGeometry(pond.radius, 40), water, pond.x, .14, pond.z);
  pondSurface.rotation.x = -Math.PI / 2;
  pondSurface.castShadow = false;
  obstacles.push({ x: pond.x, z: pond.z, r: pond.radius + .3 });
  for (let i = 0; i < 18; i++) {
    const angle = i * Math.PI * 2 / 18;
    // Leave an outlet toward the waterfall.
    if (angle > .9 && angle < 1.5) continue;
    const rock = mesh(new THREE.DodecahedronGeometry(.22 + i % 3 * .04), stone, pond.x + Math.cos(angle) * 2.18, .11, pond.z + Math.sin(angle) * 2.18);
    rock.scale.y = .65;
  }
  const streamStart = new THREE.Vector3(-7.5, .13, 8.5);
  const streamEnd = new THREE.Vector3(-6, .13, islandRadius - 6 * Math.tan(Math.PI / 8));
  const streamLength = streamStart.distanceTo(streamEnd);
  const streamMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv; uniform float time;
      void main() {
        vUv = uv;
        vec3 p = position;
        float envelope = sin(uv.y * 3.14159265);
        p.y += sin(uv.y * 30.0 - time * 4.5 + uv.x * 5.0) * 0.025 * envelope;
        p.y += sin(uv.y * 47.0 - time * 6.0) * 0.012 * envelope;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `varying vec2 vUv; uniform float time;
      void main() {
        float lane = vUv.x + sin(vUv.y * 12.0 - time * 1.2) * 0.045;
        float flow = pow(0.5 + 0.5 * sin(vUv.y * 43.0 - time * 5.5 + sin(lane * 24.0) * 2.0), 7.0);
        float strands = pow(0.5 + 0.5 * sin(lane * 37.0 + vUv.y * 8.0), 4.0);
        float edge = smoothstep(0.0, 0.09, vUv.x) * smoothstep(0.0, 0.09, 1.0 - vUv.x);
        vec3 color = mix(vec3(0.22, 0.58, 0.63), vec3(0.82, 0.96, 0.9), flow * (0.3 + strands * 0.55));
        gl_FragColor = vec4(color, edge * (0.78 + flow * 0.15));
      }`,
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
  materials.push(streamMaterial);
  const streamGeometry = new THREE.PlaneGeometry(1, 1, 8, 48);
  const streamVertices = streamGeometry.attributes.position;
  const streamUV = streamGeometry.attributes.uv;
  for (let i = 0; i < streamVertices.count; i++) {
    const t = streamUV.getY(i);
    const bend = Math.sin(t * Math.PI) ** 2;
    streamVertices.setXYZ(i, .32 * bend + (streamUV.getX(i) - .5) * (.88 + .16 * Math.sin(t * Math.PI * 3)), .01 * (1 - t), t * streamLength);
  }
  streamGeometry.computeVertexNormals();
  streamGeometry.computeBoundingSphere();
  const stream = mesh(streamGeometry, streamMaterial, streamStart.x, streamStart.y, streamStart.z);
  stream.rotation.y = Math.atan2(streamEnd.x - streamStart.x, streamEnd.z - streamStart.z);
  stream.castShadow = false;
  for (let i = 0; i <= 10; i++) {
    const point = streamStart.clone().lerp(streamEnd, i / 10);
    const bend = .32 * Math.sin(i / 10 * Math.PI) ** 2;
    point.x += Math.cos(stream.rotation.y) * bend;
    point.z -= Math.sin(stream.rotation.y) * bend;
    obstacles.push({ x: point.x, z: point.z, r: .8 });
  }
  const fallHeight = 6.8;
  const fallDirection = streamEnd.clone().sub(streamStart).normalize();
  const basin = new THREE.Vector3(streamEnd.x + fallDirection.x * 1.3, streamEnd.y - fallHeight, streamEnd.z + fallDirection.z * 1.3);
  // A subdivided sheet rounds over the lip; moving foam and uneven edges break up the curtain.
  const fallMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, height: { value: fallHeight } },
    vertexShader: `varying vec2 vUv; uniform float time; uniform float height;
      void main() {
        vUv = uv;
        float t = 1.0 - uv.y;
        vec3 p = vec3(position.x * (0.88 + t * 0.45), -height * t * t, 1.3 * t);
        p.x += sin(t * 23.0 - time * 3.0) * 0.055 * t;
        p.z += sin(uv.x * 15.0 + t * 29.0 - time * 5.0) * 0.045 * t;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `varying vec2 vUv; uniform float time;
      void main() {
        float t = 1.0 - vUv.y;
        float strands = sin(vUv.x * 49.0 + sin(t * 17.0 - time * 3.0));
        float flow = pow(0.5 + 0.5 * sin(t * 65.0 - time * 9.0 + strands * 2.0), 5.0);
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(0.0, 0.12, 1.0 - vUv.x);
        float fade = 1.0 - smoothstep(0.88, 1.0, t);
        vec3 color = mix(vec3(0.22, 0.62, 0.68), vec3(0.84, 0.98, 0.94), flow * 0.65 + t * 0.18);
        gl_FragColor = vec4(color, edge * fade * (0.62 + flow * 0.25));
      }`,
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
  materials.push(fallMaterial);
  const waterfall = mesh(new THREE.PlaneGeometry(1, 1, 10, 48), fallMaterial, streamEnd.x, streamEnd.y, streamEnd.z);
  waterfall.rotation.y = stream.rotation.y;
  waterfall.castShadow = false;
  // Shader displacement extends beyond the source plane's bounds.
  waterfall.frustumCulled = false;
  mesh(new THREE.CylinderGeometry(1.65, 1.25, .42, 9), stone, basin.x, basin.y - .27, basin.z);
  mesh(new THREE.ConeGeometry(1.25, 1.6, 9), dark, basin.x, basin.y - 1.27, basin.z).rotation.z = Math.PI;
  const landingWater = mesh(new THREE.CircleGeometry(1.4, 32), water, basin.x, basin.y, basin.z);
  landingWater.rotation.x = -Math.PI / 2;
  landingWater.castShadow = false;
  for (let i = 0; i < 11; i++) {
    const angle = i * Math.PI * 2 / 11;
    const rock = mesh(new THREE.DodecahedronGeometry(.25), stone, basin.x + Math.cos(angle) * 1.5, basin.y, basin.z + Math.sin(angle) * 1.5);
    rock.scale.y = .6;
  }
  const splash = Array.from({ length: 16 }, (_, index) => {
    const drop = mesh(new THREE.SphereGeometry(.035 + index % 3 * .012, 5, 4), foam, basin.x, basin.y + .1, basin.z);
    drop.castShadow = false;
    return drop;
  });
  const mist = Array.from({ length: 5 }, (_, index) => {
    const mat = new THREE.MeshBasicMaterial({ color: "#ddf4ec", transparent: true, opacity: .1, depthWrite: false });
    materials.push(mat);
    const puff = mesh(new THREE.SphereGeometry(.4, 8, 6), mat, basin.x + Math.cos(index * 2.4) * .5, basin.y + .25, basin.z + Math.sin(index * 2.4) * .5);
    puff.scale.set(1.5, .65, 1);
    puff.castShadow = false;
    return puff;
  });
  const impactRipples = [0, 1, 2].map(() => {
    const ring = mesh(new THREE.TorusGeometry(.65, .018, 4, 32), foam, basin.x, basin.y + .025, basin.z);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = false;
    return ring;
  });
  const ripples = [0, 1, 2].map((index) => {
    const ripple = mesh(new THREE.TorusGeometry(.28 + index * .23, .015, 4, 32), foam, pond.x + .5, .155, pond.z);
    ripple.rotation.x = Math.PI / 2;
    ripple.castShadow = false;
    return ripple;
  });
  const fishColors = [material("#edb35c"), material("#ed8265"), pale];
  const fish = Array.from({ length: 6 }, (_, index) => {
    const root = new THREE.Group();
    scene.add(root);
    const radius = .6 + index % 3 * .42;
    const angle = index * Math.PI / 3;
    root.position.set(pond.x + Math.sin(angle) * radius, .08, pond.z + Math.cos(angle) * radius);
    const body = mesh(new THREE.SphereGeometry(.16, 8, 5), fishColors[index % 3], 0, 0, 0, root);
    body.scale.set(.65, .3, 1.6);
    const tail = mesh(new THREE.ConeGeometry(.13, .18, 3), fishColors[index % 3], 0, 0, -.27, root);
    tail.rotation.x = -Math.PI / 2;
    tail.scale.z = .3;
    for (const side of [-1, 1]) mesh(new THREE.SphereGeometry(.022, 5, 4), dark, side * .065, .035, .13, root);
    return { root, tail, radius, angle };
  });

  const fisherman = new THREE.Group();
  fisherman.position.set(-5.15, 0, 7);
  fisherman.rotation.y = -Math.PI / 2;
  scene.add(fisherman);
  const fishingCoat = material("#b98859");
  box(.55, .38, .5, stone, 0, .2, -.08, fisherman);
  mesh(new THREE.CylinderGeometry(.24, .3, .52, 8), fishingCoat, 0, .72, 0, fisherman);
  mesh(new THREE.SphereGeometry(.27, 8, 6), pale, 0, 1.2, .04, fisherman);
  mesh(new THREE.CylinderGeometry(.43, .43, .06, 10), fishingCoat, 0, 1.43, .04, fisherman);
  mesh(new THREE.CylinderGeometry(.24, .28, .2, 8), fishingCoat, 0, 1.55, .04, fisherman);
  for (const side of [-1, 1]) {
    box(.06, .06, .04, dark, side * .1, 1.23, .29, fisherman);
    box(.17, .2, .45, dark, side * .18, .39, .25, fisherman);
    box(.15, .35, .18, dark, side * .18, .19, .43, fisherman);
    box(.14, .17, .48, fishingCoat, side * .29, .8, .23, fisherman);
  }
  const rod = new THREE.Group();
  rod.position.set(.25, .85, .4);
  fisherman.add(rod);
  const pole = mesh(new THREE.CylinderGeometry(.018, .035, 1.65, 6), dark, 0, .6, .56, rod);
  pole.rotation.x = .75;
  const fishingLine = mesh(new THREE.CylinderGeometry(.006, .006, 1.88, 4), foam, .25, 1.08, 1.52, fisherman);
  fishingLine.castShadow = false;
  const bobber = mesh(new THREE.SphereGeometry(.065, 8, 6), fishColors[1], .25, .18, 1.52, fisherman);
  obstacles.push({ x: fisherman.position.x, z: fisherman.position.z, r: 1 });
  let disposed = false;
  const portalMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, strength: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float time; uniform float strength;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float angle = atan(p.y, p.x);
        float spiral = pow(0.5 + 0.5 * sin(angle * 3.0 + r * 19.0 - time * 2.2), 3.0);
        float ripple = 0.5 + 0.5 * sin(r * 32.0 - time * 3.0);
        float rim = smoothstep(0.65, 0.98, r);
        vec3 color = mix(vec3(0.06, 0.29, 0.23), vec3(0.48, 0.94, 0.74), spiral * 0.65 + rim * 0.35);
        float alpha = (0.4 + spiral * 0.28 + rim * 0.22 + ripple * 0.06 + strength * 0.08) * (1.0 - smoothstep(0.94, 1.0, r));
        gl_FragColor = vec4(color, alpha);
      }`,
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
  materials.push(portalMaterial);
  const energyMaterial = new THREE.MeshBasicMaterial({ color: "#96ebc8" });
  materials.push(energyMaterial);
  function animatePortal(root: THREE.Group) {
    const surface = root.getObjectByName("vortex") as THREE.Mesh<THREE.CircleGeometry, THREE.ShaderMaterial>;
    const orbit = root.getObjectByName("orbit")!;
    const beacon = root.getObjectByName("beacon")!;
    return (time: number, active = false) => {
      surface.material.uniforms.time.value = time;
      surface.material.uniforms.strength.value = active ? 1 : 0;
      orbit.rotation.z = -time * .32;
      orbit.scale.setScalar((active ? 1.06 : 1) + Math.sin(time * 2) * .018);
      beacon.rotation.y = time;
      beacon.position.y = 3 + Math.sin(time * 2) * .12;
    };
  }
  const rings = stations.map((station, index) => {
    if (station.kind !== "portal") return null;
    const root = new THREE.Group();
    root.position.set(station.x, 0, station.z);
    scene.add(root);
    obstacles.push(...[-.96, .96].map((side) => ({ x: station.x + side, z: station.z, r: .35 })));
    mesh(new THREE.CylinderGeometry(1.05, 1.15, .17, 24), dark, 0, .06, 0, root);
    box(.26, 1.6, .4, pale, -.96, .85, 0, root);
    box(.26, 1.6, .4, pale, .96, .85, 0, root);
    const arch = mesh(new THREE.TorusGeometry(.96, .14, 8, 24, Math.PI), pale, 0, 1.65, 0, root);
    arch.castShadow = false;
    const ring = mesh(new THREE.TorusGeometry(.82, .045, 6, 40), energyMaterial, 0, 1.25, 0, root);
    ring.scale.y = 1.35;
    const surfaceMaterial = portalMaterial.clone();
    materials.push(surfaceMaterial);
    const surface = mesh(new THREE.CircleGeometry(.8, 40), surfaceMaterial, 0, 1.25, .015, root);
    surface.name = "vortex";
    surface.scale.y = 1.35;
    surface.castShadow = false;
    const ellipse = new THREE.Group();
    ellipse.position.set(0, 1.25, .08);
    ellipse.scale.y = 1.35;
    root.add(ellipse);
    const orbit = new THREE.Group();
    orbit.name = "orbit";
    ellipse.add(orbit);
    for (let i = 0; i < 3; i++) {
      const arc = mesh(new THREE.TorusGeometry(.72 - i * .12, .012, 4, 32, Math.PI * 1.15), energyMaterial, 0, 0, i * .02, orbit);
      arc.rotation.z = i * Math.PI * .7;
    }
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8;
      mesh(new THREE.OctahedronGeometry(i % 3 ? .027 : .045), energyMaterial, Math.cos(a) * .9, Math.sin(a) * .9, Math.sin(a * 3) * .13, orbit);
    }
    const beacon = mesh(new THREE.OctahedronGeometry(.16, 0), accent, 0, 3, 0, root);
    beacon.name = "beacon";
    return { root, update: animatePortal(root), index };
  });
  const labelNodes = Array.from(labels.querySelectorAll("button"));
  const projected = new THREE.Vector3();

  function robot(coat: THREE.Material, shell = pale, trim = dark) {
    const root = new THREE.Group();
    scene.add(root);
    const body = new THREE.Group();
    root.add(body);
    box(.55, .62, .4, coat, 0, .72, 0, body);
    box(.7, .52, .56, shell, 0, 1.29, 0, body);
    box(.55, .24, .035, trim, 0, 1.29, .3, body);
    box(.1, .075, .03, shell, -.14, 1.3, .326, body);
    box(.1, .075, .03, shell, .14, 1.3, .326, body);
    box(.06, .22, .06, trim, 0, 1.65, 0, body);
    mesh(new THREE.SphereGeometry(.085, 8, 6), coat, 0, 1.79, 0, body);
    const legs = [-1, 1].map((side) => box(.18, .38, .24, trim, side * .18, .22, 0, body));
    const arms = [-1, 1].map((side) => box(.15, .48, .19, shell, side * .4, .72, 0, body));
    return { root, body, legs, arms };
  }
  const { root: player, body, legs, arms } = robot(accent);
  player.position.set(0, 0, 2.8);

  // A stepped stone altar and a larger, motionless carving at the island's center.
  const altar = new THREE.Group();
  scene.add(altar);
  mesh(new THREE.CylinderGeometry(1.55, 1.7, .18, 8), stone, 0, .06, 0, altar);
  mesh(new THREE.CylinderGeometry(1.2, 1.4, .2, 8), pale, 0, .24, 0, altar);
  box(1.05, .55, .95, stone, 0, .6, 0, altar);
  box(1.2, .12, 1.1, pale, 0, .93, 0, altar);
  box(.55, .19, .035, dark, 0, .61, .49, altar);
  const statue = robot(pale, pale, stone);
  altar.add(statue.root);
  statue.root.position.y = .99;
  statue.root.scale.setScalar(1.25);
  statue.arms[0].rotation.x = -.65;
  box(.34, .4, .09, stone, -.5, .88, .24, statue.body).rotation.x = -.35;
  obstacles.push({ x: 0, z: 0, r: 1.8 });

  const service = robot(material("#b59b68"));
  service.root.position.set(stations[3].x, 0, stations[3].z);
  box(.82, .1, .68, dark, 0, 1.58, 0, service.body);
  box(.5, .22, .44, pale, 0, 1.72, 0, service.body);
  box(.4, .32, .12, dark, -.42, .72, .22, service.body).rotation.z = -.2;
  service.arms[1].name = "greeting-arm";
  const serviceMarker = mesh(new THREE.OctahedronGeometry(.14), accent, stations[3].x, 2.25, stations[3].z);
  obstacles.push({ x: stations[3].x, z: stations[3].z, r: .85 });

  const activities = ["walk", "idle", "jump", "walk", "altar", "wave", "trip"] as const;
  type Activity = typeof activities[number] | "worship";
  const residentCoats = [material("#8d7cab"), material("#c39255"), material("#72999c"), material("#b76b53"), leaf];
  const villagers = [[-2.8, 1], [-3.8, -3.8], [2.8, -3.2], [2.2, 6], [-6.5, 4]].map(([x, z], index) => {
    // Share the limb layout, not the robot silhouette, so every resident can perform the same gestures.
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    scene.add(root);
    const coat = residentCoats[index];
    const torso = mesh(index === 0 ? new THREE.ConeGeometry(.38, .8, 7) : index === 1 ? new THREE.SphereGeometry(.43, 8, 6) : index === 2 ? new THREE.CylinderGeometry(.23, .31, .7, 8) : index === 3 ? new THREE.DodecahedronGeometry(.43) : new THREE.CylinderGeometry(.26, .35, .65, 6), coat, 0, .72, 0, body);
    if (index === 1) torso.scale.set(1, .85, .8);
    const head = mesh(index === 3 ? new THREE.DodecahedronGeometry(.34) : new THREE.SphereGeometry(.3, 8, 6), index === 3 ? stone : pale, 0, 1.27, 0, body);
    head.scale.set(index === 2 ? .8 : 1, index === 2 ? 1.2 : 1, .9);
    for (const side of [-1, 1]) box(.055, .07, .04, dark, side * .11, 1.29, .255, body);
    if (index === 0) {
      mesh(new THREE.CylinderGeometry(.42, .42, .07, 8), coat, 0, 1.52, 0, body);
      mesh(new THREE.ConeGeometry(.3, .65, 7), coat, 0, 1.85, 0, body).rotation.z = -.15;
    } else if (index === 1) {
      mesh(new THREE.CylinderGeometry(.46, .46, .07, 10), coat, 0, 1.5, 0, body);
      mesh(new THREE.SphereGeometry(.31, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), coat, 0, 1.5, 0, body);
      box(.45, .44, .24, leaf, 0, .73, -.36, body);
    } else if (index === 2) {
      for (const side of [-1, 1]) {
        const ear = mesh(new THREE.SphereGeometry(.13, 6, 4), coat, side * .15, 1.76, 0, body);
        ear.scale.set(.7, 2.4, .65);
        box(.22, .14, .38, pale, side * .18, .1, .09, body);
      }
    } else if (index === 3) {
      for (const side of [-1, 1]) mesh(new THREE.DodecahedronGeometry(.23), stone, side * .4, .96, 0, body);
      mesh(new THREE.OctahedronGeometry(.13), accent, 0, .8, .36, body);
    } else {
      const cap = mesh(new THREE.SphereGeometry(.51, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), coat, 0, 1.46, 0, body);
      cap.scale.y = .65;
      for (const side of [-1, 1]) mesh(new THREE.SphereGeometry(.08, 6, 4), pale, side * .23, 1.7, .24, body);
    }
    const legs = [-1, 1].map((side) => box(.17, .38, .23, index === 3 ? stone : dark, side * .18, .22, 0, body));
    const arms = [-1, 1].map((side) => box(index === 3 ? .24 : .15, .48, .2, coat, side * .4, .72, 0, body));
    const npc = { root, body, legs, arms };
    npc.root.position.set(x, 0, z);
    const scales = [[.8, .95, .8], [.95, .78, .95], [.72, 1, .72], [1, .86, 1], [.82, .68, .82]];
    npc.root.scale.set(...scales[index] as [number, number, number]);
    npc.root.name = ["mage", "hiker", "rabbit", "golem", "mushroom"][index];
    const step = [4, 0, 2, 6, 5][index];
    return { ...npc, heading: Math.random() * Math.PI * 2, step, action: activities[step] as Activity, age: 0, duration: 3 + index * .3 };
  });

  const wingColors = [material("#edb85e"), material("#ac92cd"), material("#74c8cf")];
  const butterflies = [[-3.4, 2.8], [-4.8, 3.5], [3.1, 4.6], [4.2, 5.2], [-3.5, -2.2], [1.8, -3.9], [6.9, .6]].map(([x, z], index) => {
    const root = new THREE.Group();
    root.position.set(x, 1.2, z);
    root.scale.setScalar(.45);
    scene.add(root);
    box(.045, .05, .26, dark, 0, 0, 0, root);
    const wings = [-1, 1].map((side) => {
      const wing = new THREE.Group();
      root.add(wing);
      for (const [offset, size] of [[.08, .2], [-.12, .14]]) {
        const lobe = mesh(new THREE.SphereGeometry(size, 6, 4), wingColors[index % 3], side * size * .8, 0, offset, wing);
        lobe.scale.set(1, .08, .8);
        lobe.castShadow = false;
      }
      return wing;
    });
    return { root, wings, x, z };
  });
  const fur = material("#c8783f");
  const cream = material("#f5dfb7");
  const foxes = [[3.5, 3.4], [-4.8, -.8]].map(([x, z], index) => {
    const root = new THREE.Group();
    root.position.set(x + Math.cos(index * Math.PI), 0, z);
    root.scale.setScalar(index ? .8 : 1);
    scene.add(root);
    const body = new THREE.Group();
    root.add(body);
    box(.42, .4, .78, fur, 0, .49, 0, body);
    box(.3, .22, .35, cream, 0, .39, .29, body);
    const head = new THREE.Group();
    head.position.set(0, .69, .4);
    body.add(head);
    box(.45, .37, .38, fur, 0, 0, 0, head);
    const muzzle = mesh(new THREE.ConeGeometry(.19, .35, 4), cream, 0, -.08, .27, head);
    muzzle.rotation.x = Math.PI / 2;
    box(.09, .08, .07, dark, 0, -.08, .46, head);
    for (const side of [-1, 1]) {
      mesh(new THREE.ConeGeometry(.13, .3, 4), fur, side * .15, .3, -.03, head);
      mesh(new THREE.ConeGeometry(.07, .18, 3), dark, side * .15, .29, .025, head);
      box(.045, .06, .045, dark, side * .2, .035, .195, head);
    }
    const tail = new THREE.Group();
    tail.position.set(0, .48, -.35);
    tail.rotation.x = -.4;
    body.add(tail);
    box(.27, .27, .58, fur, 0, 0, -.27, tail);
    box(.23, .23, .24, cream, 0, 0, -.66, tail);
    const legs = [-1, 1].flatMap((side) => [-1, 1].map((end) => box(.11, .32, .13, dark, side * .16, .18, end * .26, root)));
    return { root, body, head, tail, legs, x, z, angle: index * Math.PI };
  });
  const inhabitants = [
    { root: player, radius: .48 },
    { root: service.root, radius: .6 },
    ...villagers.map(({ root }) => ({ root, radius: .85 * Math.max(root.scale.x, root.scale.y) })),
    ...foxes.map(({ root }) => ({ root, radius: 1.05 * root.scale.x })),
    ...butterflies.map(({ root }) => ({ root, radius: .18 })),
  ];
  // Reserve shortcut/reset landings so teleporting never places the player inside a resident.
  const landings = [{ x: 0, z: 2.8 }, ...stations.map((station) => ({ x: station.x, z: station.z + station.approach }))];
  function canMove(x: number, z: number, root = player) {
    const radius = inhabitants.find((actor) => actor.root === root)!.radius;
    const padding = Math.max(0, radius - .4);
    return Math.hypot(x, z) < walkRadius - padding
      && !obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + padding)
      && (root === player || !landings.some((p) => Math.hypot(x - p.x, z - p.z) < radius + .65))
      && !inhabitants.some((other) => other.root !== root && Math.hypot(x - other.root.position.x, z - other.root.position.z) < radius + other.radius);
  }
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: "#20382b", transparent: true, opacity: .2, depthWrite: false });
  materials.push(shadowMaterial);
  const shadow = mesh(new THREE.CircleGeometry(.5, 24), shadowMaterial, 0, .015, 2.3);
  shadow.rotation.x = -Math.PI / 2;
  shadow.castShadow = false;

  const pressed = new Set<string>();
  const pointer = new THREE.Vector2();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  let contextLost = false;
  let visible = true;
  let lastTime = 0;
  let elapsed = 0;
  let weatherTime = 0;
  let velocityY = 0;
  let nearby = -1;
  let enteredPortal = -1;
  let distance = 19;
  let dirty = true;

  function render() {
    if (!disposed) {
      renderer.clear();
      renderer.render(sky, skyCamera);
      renderer.clearDepth();
      renderer.render(scene, camera);
      host.dataset.weather = `${clouds[0].position.x.toFixed(4)},${rotor.rotation.z.toFixed(4)},${crowns[0].rotation.z.toFixed(4)}`;
      host.dataset.npcs = JSON.stringify(villagers.map(({ root }) => [Number(root.position.x.toFixed(3)), Number(root.position.z.toFixed(3))]));
      host.dataset.npcActions = JSON.stringify(villagers.map(({ action, root, body }) => ({ action, y: root.position.y, bow: body.rotation.x, facing: root.rotation.y })));
      host.dataset.fauna = JSON.stringify({ butterflies: butterflies.map(({ root, wings }) => [...root.position.toArray(), wings[0].rotation.z]), foxes: foxes.map(({ root, head, tail }) => [...root.position.toArray(), head.rotation.x, tail.rotation.y]) });
      host.dataset.inhabitants = JSON.stringify(inhabitants.map(({ root, radius }) => ({ x: root.position.x, z: root.position.z, radius })));
      host.dataset.npcShapes = villagers.map(({ root }) => root.name).join(",");
      host.dataset.butterflyScale = String(butterflies[0].root.scale.x);
      host.dataset.walkRadius = String(walkRadius);
      host.dataset.pond = `${pond.x},${pond.z},${pond.radius + .3}`;
      host.dataset.waterlife = JSON.stringify({ fish: fish.map(({ root }) => root.position.toArray()), stream: streamMaterial.uniforms.time.value, fall: fallMaterial.uniforms.time.value, splash: splash[0].position.toArray(), mist: mist[0].scale.x, fishing: rod.rotation.x, bobber: bobber.position.y });
      host.dataset.waterfall = JSON.stringify({ height: fallHeight, basin: basin.toArray(), outlet: streamEnd.toArray(), landingRadius: 1.4, splash: splash.length, mist: mist.length });
      host.dataset.fishermanClearance = String(Math.min(...crowns.map((crown) => Math.hypot(crown.position.x - fisherman.position.x, crown.position.z - fisherman.position.z))));
      host.dataset.castle = JSON.stringify({ x: castle.position.x, z: castle.position.z, radius: 2.75, flag: castleFlag.geometry.attributes.position.getZ(8) });
      host.dataset.windmill = `${windmill.position.x},${windmill.position.z}`;
      host.dataset.portalTime = String(rings[1]?.root.getObjectByName("orbit")?.rotation.z);
      stations.forEach((station, index) => {
        projected.set(station.x, station.labelY, station.z).project(camera);
        const label = labelNodes[index];
        if (label) {
          label.style.left = `${(projected.x * .5 + .5) * 100}%`;
          label.style.top = `${(-projected.y * .5 + .5) * 100}%`;
          label.style.visibility = projected.z > 1 || projected.z < -1 || Math.abs(projected.x) > .9 || Math.abs(projected.y) > .88 ? "hidden" : "visible";
        }
      });
    }
  }
  function clearInput() { pressed.clear(); }
  function detectStation() {
    const next = stations.findIndex((station) => Math.hypot(player.position.x - station.x, player.position.z - station.z) < station.reach);
    if (next !== nearby || dirty) {
      nearby = next;
      host.dataset.nearby = String(next);
      hint.textContent = next < 0 ? "Dekati patung, temui NPC kontak, atau jelajahi gerbang." : next === 0 ? "Patung Wildan. Tekan E atau Interaksi untuk membaca tentang saya." : next === 3 ? "NPC Kontak. Tekan E atau Interaksi untuk melihat layanan dan kontak." : `Portal ${navLinks[next].label}. Berjalan masuk atau tekan E.`;
    }
    const inside = stations.findIndex((station) => station.kind === "portal" && Math.abs(player.position.x - station.x) < .65 && Math.abs(player.position.z - station.z) < .5 && player.position.y < .8);
    if (inside < 0) enteredPortal = -1;
    else if (inside !== enteredPortal && !paused) {
      enteredPortal = inside;
      paused = true;
      schedule();
      onPortal(inside);
    }
  }
  function updateCamera(instant: boolean, dt = .016) {
    const amount = reduced.matches ? 0 : 1;
    // Tracking is essential on the larger map; reduced motion removes lag and parallax.
    const followX = player.position.x;
    const followZ = player.position.z;
    target.set(followX, .05, followZ);
    cameraGoal.set(distance * .36 + pointer.x * 1.25 * amount + followX, distance * .64 - pointer.y * .8 * amount, distance * .79 + followZ);
    if (instant) camera.position.copy(cameraGoal);
    else camera.position.lerp(cameraGoal, 1 - Math.exp(-4 * dt));
    camera.lookAt(target);
    host.dataset.camera = `${camera.position.x.toFixed(3)},${camera.position.y.toFixed(3)},${target.y.toFixed(3)}`;
  }
  function frame(time: number) {
    const dt = Math.min((time - (lastTime || time)) / 1000, .04);
    lastTime = time;
    elapsed += dt;
    if (!reduced.matches) {
      weatherTime += dt;
      clouds.forEach((cloud, index) => {
        const span = camera.aspect * 2 + 1;
        cloud.position.x = ((weatherTime * (.018 + index * .003) + index / clouds.length * span) % span) - span / 2;
      });
      rays.rotation.z = weatherTime * .055;
      rotor.rotation.z = -weatherTime * .7;
      crowns.forEach((crown, index) => { crown.rotation.z = Math.sin(weatherTime * 1.4 + index * .7) * .035; });
      const flagVertices = castleFlag.geometry.attributes.position;
      for (let i = 0; i < flagVertices.count; i++) {
        const x = flagVertices.getX(i);
        flagVertices.setZ(i, Math.sin(x * 10 - weatherTime * 4) * x * .18);
      }
      flagVertices.needsUpdate = true;
      castleFlag.geometry.computeVertexNormals();
      fish.forEach((swimmer, index) => {
        const angle = swimmer.angle + weatherTime * (.3 + index * .035);
        swimmer.root.position.set(pond.x + Math.sin(angle) * swimmer.radius, .08, pond.z + Math.cos(angle) * swimmer.radius);
        swimmer.root.rotation.y = Math.atan2(Math.cos(angle), -Math.sin(angle));
        swimmer.tail.rotation.y = Math.sin(weatherTime * 9 + index) * .4;
      });
      fallMaterial.uniforms.time.value = weatherTime;
      streamMaterial.uniforms.time.value = weatherTime;
      splash.forEach((drop, index) => {
        const life = (weatherTime * .8 + index / splash.length) % 1;
        const angle = index * 2.4;
        drop.position.set(basin.x + Math.cos(angle) * life * 1.15, basin.y + .04 + Math.sin(life * Math.PI) * (.35 + index % 4 * .12), basin.z + Math.sin(angle) * life * 1.15);
        drop.scale.setScalar(Math.sin(life * Math.PI));
      });
      mist.forEach((puff, index) => {
        puff.position.y = basin.y + .25 + Math.sin(weatherTime * .9 + index) * .12;
        puff.scale.set(1.5 + Math.sin(weatherTime + index) * .25, .65, 1);
      });
      impactRipples.forEach((ring, index) => { ring.scale.setScalar(.3 + (weatherTime * .65 + index / 3) % 1 * 1.7); });
      ripples.forEach((ripple, index) => { ripple.scale.setScalar(.75 + (weatherTime * .3 + index / 3) % 1 * .5); });
      rod.rotation.x = Math.sin(weatherTime * 1.5) * .035;
      bobber.position.y = .18 + Math.sin(weatherTime * 3) * .035;
    }
    const right = Number(pressed.has("d") || pressed.has("arrowright")) - Number(pressed.has("a") || pressed.has("arrowleft"));
    const forward = Number(pressed.has("s") || pressed.has("arrowdown")) - Number(pressed.has("w") || pressed.has("arrowup"));
    const length = Math.hypot(right, forward);
    if (length) {
      // Match movement to the camera's screen axes; normalize diagonal speed.
      const dx = (right * .91 + forward * .41) / length * dt * 3.2;
      const dz = (-right * .41 + forward * .91) / length * dt * 3.2;
      if (canMove(player.position.x + dx, player.position.z)) player.position.x += dx;
      if (canMove(player.position.x, player.position.z + dz)) player.position.z += dz;
      player.rotation.y = Math.atan2(dx, dz);
    }
    if (player.position.y > 0 || velocityY > 0) {
      dirty = true;
      velocityY -= 12 * dt;
      player.position.y = Math.max(0, player.position.y + velocityY * dt);
      if (player.position.y === 0) velocityY = 0;
    }
    const stride = length && !reduced.matches ? Math.sin(elapsed * 13) * .5 : 0;
    legs[0].rotation.x = arms[1].rotation.x = stride;
    legs[1].rotation.x = arms[0].rotation.x = -stride;
    body.position.y = reduced.matches ? 0 : (length ? Math.abs(Math.sin(elapsed * 13)) * .045 : Math.sin(elapsed * 2) * .025);
    shadow.position.set(player.position.x, .015, player.position.z);
    shadow.scale.setScalar(1 - Math.min(player.position.y * .2, .35));
    detectStation();
    rings.forEach((portal) => {
      if (!portal) return;
      portal.update(reduced.matches ? 0 : elapsed + portal.index, portal.index === nearby);
    });
    villagers.forEach((npc, index) => {
      if (reduced.matches) return;
      let walking = false;
      npc.age += dt;
      if (npc.age >= npc.duration) {
        const leavingAltar = npc.action === "worship";
        npc.step = (npc.step + 1) % activities.length;
        npc.action = leavingAltar ? "walk" : activities[npc.step];
        npc.heading = leavingAltar ? Math.atan2(npc.root.position.x, npc.root.position.z) : Math.random() * Math.PI * 2;
        npc.age = 0;
        npc.duration = npc.action === "altar" ? 12 : 2.5 + Math.random() * 2;
      }
      if (npc.action === "altar") {
        npc.heading = Math.atan2(-npc.root.position.x, -npc.root.position.z);
        npc.root.rotation.y = npc.heading;
        if (Math.hypot(npc.root.position.x, npc.root.position.z) <= 2.5) {
          npc.action = "worship";
          npc.age = 0;
          npc.duration = 5 + index * .25;
        }
      }
      if (npc.action === "walk" || npc.action === "altar") {
        const speed = .65 + index * .09;
        const x = npc.root.position.x + Math.sin(npc.heading) * dt * speed;
        const z = npc.root.position.z + Math.cos(npc.heading) * dt * speed;
        if (canMove(x, z, npc.root)) {
          npc.root.position.set(x, 0, z);
          npc.root.rotation.y = npc.heading;
          walking = true;
        } else {
          // A blocked altar visit becomes a wander; retry on the next activity cycle.
          npc.action = "walk";
          npc.heading += Math.PI * (.6 + Math.random() * .4);
        }
      }
      const progress = Math.min(npc.age / npc.duration, 1);
      const ease = Math.min(1, npc.age * 3, (npc.duration - npc.age) * 3);
      const stride = walking ? Math.sin(weatherTime * (7 + index * .6) + index) * .4 : 0;
      npc.root.position.y = 0;
      npc.body.position.set(0, walking ? Math.abs(stride) * .09 : 0, 0);
      npc.body.rotation.set(0, 0, 0);
      npc.arms.forEach((arm, side) => { arm.position.set(side ? .4 : -.4, .72, 0); arm.rotation.set(0, 0, 0); });
      npc.legs[0].rotation.x = npc.arms[1].rotation.x = stride;
      npc.legs[1].rotation.x = npc.arms[0].rotation.x = -stride;
      if (npc.action === "worship") {
        npc.body.rotation.x = ease * (.55 + Math.sin(progress * Math.PI * 4) * .16);
        npc.body.position.y = -.1 * ease;
        npc.body.position.z = -.2 * ease;
        npc.legs.forEach((leg) => { leg.rotation.x = -.9 * ease; });
        npc.arms.forEach((arm, side) => {
          arm.rotation.x = -1.1 * ease;
          arm.rotation.z = (side ? .45 : -.45) * ease;
          arm.position.x = (side ? 1 : -1) * (.4 - .2 * ease);
          arm.position.z = .27 * ease;
        });
      } else if (npc.action === "jump") {
        const hop = Math.max(0, Math.sin(progress * Math.PI * 4));
        npc.root.position.y = hop * .7;
        npc.legs.forEach((leg) => { leg.rotation.x = -.35 * hop; });
        npc.arms.forEach((arm, side) => { arm.rotation.z = (side ? -1 : 1) * hop; });
      } else if (npc.action === "trip") {
        const fall = THREE.MathUtils.smoothstep(progress, 0, .22) * (1 - THREE.MathUtils.smoothstep(progress, .6, 1));
        npc.body.rotation.x = fall * 1.4;
        npc.body.position.y = fall * .3;
        npc.body.position.z = -fall * .55;
        npc.arms.forEach((arm) => { arm.rotation.x = -fall * 1.5; });
        npc.legs[0].rotation.x = Math.sin(progress * Math.PI * 10) * fall * .25;
      } else if (npc.action === "wave") {
        if (npc.root.position.distanceTo(player.position) < 4) npc.root.rotation.y = Math.atan2(player.position.x - npc.root.position.x, player.position.z - npc.root.position.z);
        npc.arms[1].rotation.z = (-2.3 + Math.sin(npc.age * 9) * .35) * ease;
      } else if (npc.action === "idle") npc.body.rotation.y = Math.sin(progress * Math.PI * 2) * .35;
    });
    if (!reduced.matches) {
      butterflies.forEach((butterfly, index) => {
        const t = weatherTime * (.65 + index * .035) + index * 1.7;
        const x = butterfly.x + Math.sin(t) * .7;
        const z = butterfly.z + Math.cos(t * .8) * .55;
        const step = Math.min(1, dt * 3);
        const nextX = THREE.MathUtils.lerp(butterfly.root.position.x, x, step);
        const nextZ = THREE.MathUtils.lerp(butterfly.root.position.z, z, step);
        if (canMove(nextX, nextZ, butterfly.root)) butterfly.root.position.set(nextX, 1.25 + Math.sin(t * 1.7) * .4, nextZ);
        butterfly.root.rotation.y = Math.atan2(Math.cos(t) * .7, -Math.sin(t * .8) * .44);
        butterfly.wings.forEach((wing, side) => { wing.rotation.z = (side ? -1 : 1) * (.35 + Math.sin(weatherTime * 18 + index) * .75); });
      });
      foxes.forEach((fox, index) => {
        let trotting = (weatherTime + index * 4) % 12 < 8;
        const nextAngle = fox.angle + (trotting ? dt * .65 : 0);
        const x = fox.x + Math.cos(nextAngle);
        const z = fox.z + Math.sin(nextAngle) * .85;
        if (canMove(x, z, fox.root)) {
          fox.angle = nextAngle;
          fox.root.position.set(x, 0, z);
        } else trotting = false;
        fox.root.rotation.y = Math.atan2(-Math.sin(fox.angle), Math.cos(fox.angle) * .85);
        fox.body.position.y = trotting ? Math.abs(Math.sin(weatherTime * 10 + index)) * .045 : 0;
        fox.head.rotation.x = trotting ? -.08 : .5 + Math.sin(weatherTime * 5) * .1;
        fox.tail.rotation.y = Math.sin(weatherTime * (trotting ? 5 : 2) + index) * .3;
        fox.legs.forEach((leg, limb) => { leg.rotation.x = trotting ? Math.sin(weatherTime * 10 + index + (limb === 0 || limb === 3 ? 0 : Math.PI)) * .45 : 0; });
      });
      serviceMarker.rotation.y = elapsed;
      service.root.rotation.y = nearby === 3 ? Math.atan2(player.position.x - service.root.position.x, player.position.z - service.root.position.z) : .2;
      service.arms[1].rotation.z = nearby === 3 ? -2.2 + Math.sin(weatherTime * 6) * .25 : 0;
    }
    if (!reduced.matches) floats.forEach((island, index) => { island.position.y = -1.6 + Math.sin(elapsed * .8 + index * 2) * .16; });
    updateCamera(reduced.matches, dt);
    host.dataset.playerX = player.position.x.toFixed(3);
    host.dataset.playerZ = player.position.z.toFixed(3);
    host.dataset.playerY = player.position.y.toFixed(3);
    if (!reduced.matches || length || velocityY || dirty) render();
    dirty = false;
  }
  function schedule() {
    lastTime = 0;
    clearInput();
    renderer.setAnimationLoop(!contextLost && !paused && visible && !document.hidden ? frame : null);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    skyCamera.left = -camera.aspect;
    skyCamera.right = camera.aspect;
    skyCamera.updateProjectionMatrix();
    celestial.position.set(camera.aspect * .66, .66, 1);
    distance = camera.aspect < 1 ? Math.max(24, 15 / camera.aspect) : 17;
    camera.updateProjectionMatrix();
    updateCamera(true);
    render();
  }
  function pointerMove(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    const rect = host.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
  }
  function pointerLeave() { pointer.set(0, 0); }
  function themeChange() {
    const isDark = document.documentElement.classList.contains("dark");
    ground.color.set(isDark ? "#426454" : "#93b8a4");
    light.intensity = isDark ? 2 : 3;
    sun.intensity = isDark ? 2.4 : 3.4;
    sun.color.set(isDark ? "#c3ddd8" : "#fff7e6");
    cloudMaterial.color.set(isDark ? "#314b46" : "#fafcf4");
    celestialMaterial.color.set(isDark ? "#e0ede5" : "#efd38f");
    rays.visible = !isDark;
    craters.visible = isDark;
    host.dataset.sky = isDark ? "moon" : "sun";
    dirty = true;
    render();
  }
  function motionChange() { dirty = true; updateCamera(true); render(); }
  function lostContext(event: Event) { event.preventDefault(); contextLost = true; renderer.setAnimationLoop(null); clearInput(); onError(); }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
  intersection.observe(host);
  const themeObserver = new MutationObserver(themeChange);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  host.addEventListener("pointermove", pointerMove);
  host.addEventListener("pointerleave", pointerLeave);
  window.addEventListener("blur", clearInput);
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", motionChange);
  renderer.domElement.addEventListener("webglcontextlost", lostContext);
  resize();
  themeChange();
  schedule();

  function jump() {
    if (!paused && visible && player.position.y === 0) { velocityY = 4.4; dirty = true; }
  }
  let closePreview: (() => void) | undefined;
  function preview(host: HTMLDivElement, index: number) {
    closePreview?.();
    const source = index === 0 ? altar : index === 3 ? service.root : rings[index]?.root;
    if (!source) return;
    const view = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    view.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    view.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(view.domElement);
    const model = source.clone(true);
    model.position.set(0, 0, 0);
    model.rotation.set(0, -.18, 0);
    // Share world geometry; animated uniforms belong to the portrait alone.
    const vortex = model.getObjectByName("vortex") as THREE.Mesh<THREE.CircleGeometry, THREE.ShaderMaterial> | undefined;
    if (vortex) vortex.material = vortex.material.clone();
    const updatePortal = vortex ? animatePortal(model) : undefined;
    const arm = model.getObjectByName("greeting-arm");
    const stage = new THREE.Scene();
    stage.add(model);
    const fill = new THREE.HemisphereLight(0xe4f5ed, 0x354e40, 3);
    const key = new THREE.DirectionalLight(0xfff7e6, 3);
    key.position.set(-3, 6, 5);
    stage.add(fill, key);
    const lens = new THREE.PerspectiveCamera(34, 1, .1, 40);
    let time = 0;
    let previous = 0;
    let inView = true;
    let closed = false;
    function draw() {
      if (closed) return;
      const still = reduced.matches;
      updatePortal?.(still ? 0 : time, true);
      if (arm) arm.rotation.z = still ? -.45 : -.65 + Math.sin(time * 2.8) * .22;
      if (index === 3) model.position.y = still ? 0 : Math.sin(time * 2) * .035;
      view.render(stage, lens);
      host.dataset.previewTime = (still ? 0 : time).toFixed(3);
    }
    function tick(now: number) {
      time += Math.min((now - (previous || now)) / 1000, .04);
      previous = now;
      draw();
    }
    function schedulePreview() {
      if (closed) return;
      previous = 0;
      view.setAnimationLoop(!document.hidden && inView && !reduced.matches && index !== 0 ? tick : null);
      draw();
    }
    function resizePreview() {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      view.setSize(width, height, false);
      lens.aspect = width / height;
      lens.updateProjectionMatrix();
      const size = index === 3 ? 2.5 : 4.2;
      const distance = size / (2 * Math.tan(THREE.MathUtils.degToRad(17))) / Math.min(lens.aspect, 1);
      const center = index === 3 ? .95 : 1.55;
      lens.position.set(distance * .25, center + distance * .18, distance);
      lens.lookAt(0, center, 0);
      draw();
    }
    function themePreview() {
      const isDark = document.documentElement.classList.contains("dark");
      fill.intensity = isDark ? 2.5 : 3;
      key.color.set(isDark ? "#c3ddd8" : "#fff7e6");
      draw();
    }
    function previewLost(event: Event) {
      event.preventDefault();
      cleanup();
      host.dataset.preview = "error";
    }
    const observer = new ResizeObserver(resizePreview);
    observer.observe(host);
    const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; schedulePreview(); });
    visibility.observe(host);
    const theme = new MutationObserver(themePreview);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    reduced.addEventListener("change", schedulePreview);
    document.addEventListener("visibilitychange", schedulePreview);
    view.domElement.addEventListener("webglcontextlost", previewLost);
    function cleanup() {
      if (closed) return;
      closed = true;
      view.setAnimationLoop(null);
      observer.disconnect(); visibility.disconnect(); theme.disconnect();
      reduced.removeEventListener("change", schedulePreview);
      document.removeEventListener("visibilitychange", schedulePreview);
      view.domElement.removeEventListener("webglcontextlost", previewLost);
      vortex?.material.dispose();
      view.dispose(); view.forceContextLoss(); view.domElement.remove();
      if (closePreview === cleanup) closePreview = undefined;
    }
    closePreview = cleanup;
    resizePreview(); themePreview(); schedulePreview();
    host.dataset.preview = "ready";
    return cleanup;
  }
  return {
    preview,
    setKey(key: string, down: boolean) {
      if (!keys.has(key)) return false;
      dirty = true;
      if (!down) pressed.delete(key);
      else if (!paused && visible) {
        if (key === " " && !pressed.has(key)) jump();
        pressed.add(key);
      }
      return true;
    },
    jump,
    clearInput,
    nearby: () => paused ? -1 : nearby,
    pause(value: boolean) { paused = value; schedule(); },
    reset() { player.position.set(0, 0, 2.8); player.rotation.y = 0; velocityY = 0; enteredPortal = -1; clearInput(); pointerLeave(); dirty = true; detectStation(); updateCamera(true); render(); },
    leavePortal() {
      const station = stations[enteredPortal];
      if (station) player.position.set(station.x, 0, station.z + 1.3);
      enteredPortal = -1;
      velocityY = 0;
      clearInput();
      dirty = true;
      detectStation();
      updateCamera(true);
      render();
    },
    visit(index: number) {
      const station = stations[index];
      if (!station) return;
      player.position.set(station.x, 0, station.z + station.approach);
      player.rotation.y = Math.PI;
      velocityY = 0;
      clearInput();
      dirty = true;
      detectStation();
      updateCamera(true);
      render();
    },
    dispose() {
      closePreview?.();
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect(); intersection.disconnect(); themeObserver.disconnect();
      host.removeEventListener("pointermove", pointerMove); host.removeEventListener("pointerleave", pointerLeave);
      window.removeEventListener("blur", clearInput); document.removeEventListener("visibilitychange", schedule);
      reduced.removeEventListener("change", motionChange);
      renderer.domElement.removeEventListener("webglcontextlost", lostContext);
      scene.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
      sky.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
      materials.forEach((value) => value.dispose());
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
