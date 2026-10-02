import * as THREE from "three";
import { navLinks } from "@/data/content";

const stations = [
  { x: 0, z: 0, kind: "statue", reach: 2.15, labelY: 3.8, approach: 1.9 },
  { x: 0, z: -7.6, kind: "portal", reach: 1.55, labelY: 3.1, approach: 1.15 },
  { x: 6.4, z: -4.6, kind: "portal", reach: 1.55, labelY: 3.1, approach: 1.15 },
  { x: 6.2, z: 3.6, kind: "npc", reach: 1.8, labelY: 2.7, approach: 1.3 },
];
const islandRadius = 11.6;
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
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, far: 55 });
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

  mesh(new THREE.CylinderGeometry(islandRadius, 10.6, 0.65, 8), ground, 0, -0.35, 0);
  mesh(new THREE.CylinderGeometry(10.6, 7.4, 2.2, 8), stone, 0, -1.75, 0);
  mesh(new THREE.ConeGeometry(7.4, 3, 8), dark, 0, -4.35, 0).rotation.z = Math.PI;
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
    { x: -8.4, z: 1.4, r: .65 }, { x: 4.8, z: 6.8, r: .65 }, { x: -5, z: 7, r: .65 },
    { x: -3, z: -8.5, r: .65 }, { x: 8.6, z: -.5, r: .65 }, { x: -7.7, z: -3, r: .65 },
    { x: 3.5, z: -7.8, r: .65 }, { x: -2.8, z: 4.5, r: .65 },
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
  [[-8, -7], [9, .6], [-3.6, -9.2], [-1.8, 8.4], [-9, 3.5], [8, 6]].forEach(([x, z], i) => {
    const rock = mesh(new THREE.DodecahedronGeometry(.35 + i * .06, 0), stone, x, .2, z);
    rock.scale.y = .7;
  });
  const floats = [-1, 1].map((sign) => {
    const group = new THREE.Group();
    group.position.set(sign * 12.4, -1.6, sign * 5);
    scene.add(group);
    mesh(new THREE.DodecahedronGeometry(.85, 0), stone, 0, 0, 0, group);
    mesh(new THREE.ConeGeometry(.45, .9, 5), accent, 0, .85, 0, group);
    return group;
  });
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

  const villagers = [[-4, 1.8], [-3.8, -3.8], [2.8, -3.2], [2.2, 6], [-6.5, 4]].map(([x, z], index) => {
    const npc = robot(index % 2 ? stone : leaf);
    npc.root.position.set(x, 0, z);
    npc.root.scale.setScalar(.78 + index % 3 * .06);
    // Backpack and cap distinguish wandering residents from the player.
    box(.4, .4, .2, pale, 0, .72, -.3, npc.body);
    box(.76, .12, .6, index % 2 ? leaf : stone, 0, 1.56, 0, npc.body);
    return { ...npc, heading: Math.random() * Math.PI * 2, remaining: .6 + index * .4, resting: false };
  });
  const canMove = (x: number, z: number) => Math.hypot(x, z) < walkRadius && !obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r);
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
      let walking = false;
      if (!reduced.matches) {
        npc.remaining -= dt;
        if (npc.remaining <= 0) {
          npc.heading = Math.random() * Math.PI * 2;
          npc.resting = Math.random() < .3;
          npc.remaining = 1 + Math.random() * 3;
        }
        const x = npc.root.position.x + Math.sin(npc.heading) * dt * .7;
        const z = npc.root.position.z + Math.cos(npc.heading) * dt * .7;
        // Ambient wandering only: turn at obstacles instead of needing pathfinding.
        if (!npc.resting && Math.hypot(x - player.position.x, z - player.position.z) > 1) {
          if (canMove(x, z) && !villagers.some((other) => other !== npc && Math.hypot(x - other.root.position.x, z - other.root.position.z) < .85)) {
            npc.root.position.set(x, 0, z);
            npc.root.rotation.y = npc.heading;
            walking = true;
          } else npc.remaining = 0;
        }
      }
      const stride = walking ? Math.sin(elapsed * 7 + index) * .4 : 0;
      npc.legs[0].rotation.x = npc.arms[1].rotation.x = stride;
      npc.legs[1].rotation.x = npc.arms[0].rotation.x = -stride;
    });
    if (!reduced.matches) {
      serviceMarker.rotation.y = elapsed;
      service.root.rotation.y = nearby === 3 ? Math.atan2(player.position.x - service.root.position.x, player.position.z - service.root.position.z) : .2;
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
