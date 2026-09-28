import * as THREE from "three";
import { navLinks } from "@/data/content";

const stations = [
  { x: -6.4, z: -5 },
  { x: 0, z: -7.6 },
  { x: 6.4, z: -4.6 },
  { x: 6.8, z: 4.2 },
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
  // Windmill is outside the walking boundary, so its moving blades cannot block a portal.
  const windmill = new THREE.Group();
  windmill.position.set(-10.5, 0, -4);
  scene.add(windmill);
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
  const portalMaterial = new THREE.MeshStandardMaterial({ color: "#70d5b2", emissive: "#258666", emissiveIntensity: .5, transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false });
  materials.push(portalMaterial);
  const rings = stations.map((station, index) => {
    mesh(new THREE.CylinderGeometry(1.05, 1.15, .17, 24), dark, station.x, .06, station.z);
    box(.26, 1.6, .4, pale, station.x - .96, .85, station.z);
    box(.26, 1.6, .4, pale, station.x + .96, .85, station.z);
    const arch = mesh(new THREE.TorusGeometry(.96, .14, 8, 24, Math.PI), pale, station.x, 1.65, station.z);
    arch.castShadow = false;
    const ring = mesh(new THREE.TorusGeometry(.82, .045, 6, 40), accent, station.x, 1.25, station.z);
    ring.scale.y = 1.35;
    const surface = mesh(new THREE.CircleGeometry(.8, 40), portalMaterial, station.x, 1.25, station.z);
    surface.scale.y = 1.35;
    surface.castShadow = false;
    const beacon = mesh(new THREE.OctahedronGeometry(.16, 0), accent, station.x, 3, station.z);
    beacon.userData.phase = index;
    return { ring, beacon };
  });
  const labelNodes = Array.from(labels.querySelectorAll("button"));
  const projected = new THREE.Vector3();

  const player = new THREE.Group();
  player.position.set(0, 0, 2.3);
  scene.add(player);
  const body = new THREE.Group();
  player.add(body);
  box(.55, .62, .4, accent, 0, .72, 0, body);
  box(.7, .52, .56, pale, 0, 1.29, 0, body);
  box(.55, .24, .035, dark, 0, 1.29, .3, body);
  box(.1, .075, .03, pale, -.14, 1.3, .326, body);
  box(.1, .075, .03, pale, .14, 1.3, .326, body);
  box(.06, .22, .06, dark, 0, 1.65, 0, body);
  mesh(new THREE.SphereGeometry(.085, 8, 6), accent, 0, 1.79, 0, body);
  const legs = [-1, 1].map((side) => box(.18, .38, .24, dark, side * .18, .22, 0, body));
  const arms = [-1, 1].map((side) => box(.15, .48, .19, pale, side * .4, .72, 0, body));
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
      stations.forEach((station, index) => {
        projected.set(station.x, 3.1, station.z).project(camera);
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
    const next = stations.findIndex((station) => Math.hypot(player.position.x - station.x, player.position.z - station.z) < 1.55);
    if (next !== nearby || dirty) {
      nearby = next;
      host.dataset.nearby = String(next);
      hint.textContent = next < 0 ? "Masuk ke gerbang untuk membuka cerita di baliknya." : `Portal ${navLinks[next].label}. Berjalan masuk atau tekan E.`;
    }
    const inside = stations.findIndex((station) => Math.abs(player.position.x - station.x) < .65 && Math.abs(player.position.z - station.z) < .5 && player.position.y < .8);
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
      const canMove = (x: number, z: number) => Math.hypot(x, z) < walkRadius && !obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r) && !stations.some((o) => [-.96, .96].some((side) => Math.hypot(x - o.x - side, z - o.z) < .35));
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
    rings.forEach(({ ring, beacon }, index) => {
      ring.scale.set(index === nearby ? 1.06 : 1, index === nearby ? 1.43 : 1.35, 1);
      if (!reduced.matches) { beacon.rotation.y = elapsed; beacon.position.y = 3 + Math.sin(elapsed * 2 + index) * .12; }
    });
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
  return {
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
    reset() { player.position.set(0, 0, 2.3); player.rotation.y = 0; velocityY = 0; enteredPortal = -1; clearInput(); pointerLeave(); dirty = true; detectStation(); updateCamera(true); render(); },
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
      player.position.set(station.x, 0, station.z + 1.15);
      player.rotation.y = Math.PI;
      velocityY = 0;
      clearInput();
      dirty = true;
      detectStation();
      updateCamera(true);
      render();
    },
    dispose() {
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
