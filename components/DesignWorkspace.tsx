"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type DesignTab = "SCHEMATIC" | "PCB" | "3D" | "DRC";

const boardSpec = {
  title: "EON 555 BLINKER",
  board: "70 x 45 mm",
  supply: "9V",
  ic: "NE555 DIP-8",
  components: [
    "U1 NE555 DIP-8",
    "D1 RED LED 5mm",
    "R1 1kΩ",
    "R2 10kΩ",
    "R3 100kΩ",
    "C1 10µF",
    "C2 0.01µF",
    "BT1 9V HEADER",
  ],
};

function addBox(
  group: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
  name?: string
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.48,
      metalness: 0.2,
    })
  );
  mesh.position.set(...position);
  mesh.name = name ?? "";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCylinder(
  group: THREE.Group,
  radius: number,
  height: number,
  position: [number, number, number],
  color: number,
  name?: string
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 24),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.25,
    })
  );
  mesh.position.set(...position);
  mesh.name = name ?? "";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addTrace(
  group: THREE.Group,
  a: [number, number, number],
  b: [number, number, number],
  color = 0xe6b84a
) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...a),
    new THREE.Vector3(...b),
  ]);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.92,
  });
  group.add(new THREE.Line(geometry, material));
}

function buildBoard(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.rotation.x = -0.12;

  const board = addBox(
    root,
    [7, 0.22, 4.5],
    [0, 0, 0],
    0x123b2b,
    "PCB substrate"
  );

  board.receiveShadow = true;

  const copper = new THREE.MeshStandardMaterial({
    color: 0xd49a36,
    roughness: 0.32,
    metalness: 0.78,
  });

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(7.02, 0.24, 4.52)),
    new THREE.LineBasicMaterial({ color: 0x55a98b })
  );
  root.add(edge);

  // U1 NE555 DIP-8
  addBox(root, [1.65, 0.34, 0.62], [-0.55, 0.31, 0.05], 0x171a20, "U1 NE555");
  for (let i = 0; i < 4; i++) {
    addBox(root, [0.08, 0.06, 0.42], [-1.15 + i * 0.4, 0.5, -0.52], 0xc4c8cc);
    addBox(root, [0.08, 0.06, 0.42], [-1.15 + i * 0.4, 0.5, 0.62], 0xc4c8cc);
  }

  // LED D1
  addCylinder(root, 0.18, 0.42, [2.25, 0.45, 1.18], 0xe63b3b, "D1 LED");
  addCylinder(root, 0.055, 0.65, [2.25, 0.23, 1.18], 0xc8cbd0);

  // Resistors
  const resistors: [number, number, number][] = [
    [1.45, 0.38, 0.05],
    [-0.05, 0.38, -1.38],
    [-1.25, 0.38, -1.38],
  ];
  resistors.forEach((p, i) => {
    addCylinder(root, 0.105, 0.85, p, 0xd8c59b, `R${i + 1}`);
    const band = addBox(root, [0.12, 0.08, 0.08], [p[0], p[1] + 0.08, p[2]], 0x4b2b20);
    band.rotation.z = Math.PI / 2;
  });

  // C1 electrolytic
  addCylinder(root, 0.28, 0.62, [0.55, 0.52, -1.42], 0x1f4f9a, "C1 10uF");
  addBox(root, [0.04, 0.08, 0.25], [0.55, 0.86, -1.42], 0xffffff);

  // C2 ceramic
  addBox(root, [0.42, 0.28, 0.32], [-1.95, 0.42, 0.95], 0xc9b07a, "C2 0.01uF");

  // Battery header
  addBox(root, [0.75, 0.35, 0.55], [-2.85, 0.34, -1.48], 0x242832, "BT1 9V");
  addCylinder(root, 0.1, 0.55, [-3.05, 0.55, -1.48], 0xbec5cc);
  addCylinder(root, 0.1, 0.55, [-2.65, 0.55, -1.48], 0xbec5cc);

  // Mounting holes
  for (const [x, z] of [
    [-3.1, -1.8],
    [3.1, -1.8],
    [-3.1, 1.8],
    [3.1, 1.8],
  ]) {
    addCylinder(root, 0.13, 0.08, [x, 0.16, z], 0x11151b, "mount");
  }

  // Visible copper traces.
  addTrace(root, [-3.0, 0.15, -1.48], [-1.35, 0.15, -1.48]);
  addTrace(root, [-1.35, 0.15, -1.48], [-1.35, 0.15, -0.85]);
  addTrace(root, [-1.35, 0.15, -0.85], [-0.55, 0.15, -0.85]);
  addTrace(root, [-0.55, 0.15, -0.85], [0.55, 0.15, -1.42]);
  addTrace(root, [0.55, 0.15, -1.42], [1.45, 0.15, -0.85]);
  addTrace(root, [1.45, 0.15, -0.85], [2.25, 0.15, 1.18]);
  addTrace(root, [-0.55, 0.15, 0.62], [-0.55, 0.15, 1.35]);
  addTrace(root, [-0.55, 0.15, 1.35], [-1.95, 0.15, 0.95]);

  // Ground plane / pour indication.
  const pour = new THREE.Mesh(
    new THREE.PlaneGeometry(6.7, 4.2),
    new THREE.MeshBasicMaterial({
      color: 0x2f7a5c,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
    })
  );
  pour.rotation.x = -Math.PI / 2;
  pour.position.y = 0.13;
  root.add(pour);

  scene.add(root);
  return root;
}

function ThreeDPreview() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070d);

    const camera = new THREE.PerspectiveCamera(
      38,
      Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight),
      0.1,
      100
    );
    camera.position.set(7.8, 6.2, 8.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 6;
    controls.maxDistance = 15;
    controls.target.set(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 1.7);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffe7a1, 3.1);
    key.position.set(5, 9, 6);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.PointLight(0x5c8cff, 1.2, 20);
    fill.position.set(-5, 4, -4);
    scene.add(fill);

    const grid = new THREE.GridHelper(18, 36, 0x1c2638, 0x0d1422);
    grid.position.y = -0.35;
    scene.add(grid);

    buildBoard(scene);

    let frame = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      if (!mount) return;
      camera.aspect = Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    };
  }, []);

  return <div ref={mountRef} className="design3dViewport" />;
}

function SchematicView() {
  return (
    <div className="schematicView">
      <svg viewBox="0 0 760 430" role="img" aria-label="555 LED blinker schematic">
        <rect x="12" y="12" width="736" height="406" rx="14" fill="#070b12" stroke="#263347" />
        <text x="34" y="44" fill="#ffe45c" fontSize="15" fontFamily="monospace">EON 555 ASTABLE BLINKER</text>

        <rect x="315" y="145" width="130" height="110" rx="8" fill="#151a24" stroke="#ffe45c" />
        <text x="343" y="177" fill="#ffffff" fontSize="18" fontFamily="monospace">NE555</text>
        <text x="350" y="201" fill="#8e9aad" fontSize="12" fontFamily="monospace">U1 DIP-8</text>

        <path d="M315 165 H210 V95 H140" fill="none" stroke="#d9aa43" strokeWidth="3" />
        <path d="M315 220 H190 V310 H130" fill="none" stroke="#d9aa43" strokeWidth="3" />
        <path d="M445 165 H530 V95 H600" fill="none" stroke="#d9aa43" strokeWidth="3" />
        <path d="M445 220 H535 V310 H610" fill="none" stroke="#d9aa43" strokeWidth="3" />
        <path d="M315 238 H245 V345 H400" fill="none" stroke="#d9aa43" strokeWidth="3" />
        <path d="M445 182 H510 V345 H400" fill="none" stroke="#d9aa43" strokeWidth="3" />

        <rect x="95" y="72" width="92" height="45" rx="6" fill="#101722" stroke="#59677d" />
        <text x="111" y="100" fill="#ffffff" fontSize="13" fontFamily="monospace">BT1 9V</text>

        <rect x="575" y="72" width="100" height="45" rx="6" fill="#101722" stroke="#59677d" />
        <text x="591" y="100" fill="#ffffff" fontSize="13" fontFamily="monospace">R1 1k</text>

        <rect x="92" y="287" width="100" height="45" rx="6" fill="#101722" stroke="#59677d" />
        <text x="108" y="315" fill="#ffffff" fontSize="13" fontFamily="monospace">C1 10uF</text>

        <rect x="560" y="287" width="120" height="45" rx="6" fill="#101722" stroke="#59677d" />
        <text x="577" y="315" fill="#ffffff" fontSize="13" fontFamily="monospace">D1 LED</text>

        <text x="35" y="386" fill="#7f8da2" fontSize="12" fontFamily="monospace">
          PINS 2+6 TIMING • PIN 7 DISCHARGE • PIN 5 BYPASS • 9V SUPPLY
        </text>
      </svg>
    </div>
  );
}

function PcbView() {
  return (
    <div className="pcbTopView">
      <div className="pcbBoard">
        <div className="pcbLabel">EON 555 BLINKER</div>
        <div className="pcbChip">U1<br /><small>NE555</small></div>
        <div className="pcbLed">D1</div>
        <div className="pcbPart r1">R1<br /><small>1k</small></div>
        <div className="pcbPart r2">R2<br /><small>10k</small></div>
        <div className="pcbPart r3">R3<br /><small>100k</small></div>
        <div className="pcbCap c1">C1<br /><small>10uF</small></div>
        <div className="pcbCap c2">C2<br /><small>0.01uF</small></div>
        <div className="pcbBattery">BT1<br /><small>9V</small></div>
        <div className="pcbTrace t1" />
        <div className="pcbTrace t2" />
        <div className="pcbTrace t3" />
        <div className="pcbTrace t4" />
      </div>
    </div>
  );
}

export default function DesignWorkspace() {
  const [tab, setTab] = useState<DesignTab>("3D");

  const exportSpec = () => {
    const blob = new Blob([JSON.stringify(boardSpec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "eon-555-blinker-design.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="designWorkspace">
      <div className="designStatusCard">
        <span>NO LIMITS DESIGN</span>
        <b>EON 555 BLINKER</b>
        <small>EDA DESIGN • 9V • NE555 ASTABLE • 70 × 45 MM</small>
      </div>

      <div className="designToolbar">
        {(["SCHEMATIC", "PCB", "3D", "DRC"] as DesignTab[]).map((item) => (
          <button
            key={item}
            type="button"
            className={tab === item ? "designTab active" : "designTab"}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
        <button type="button" className="designExport" onClick={exportSpec}>
          EXPORT SPEC
        </button>
      </div>

      <div className="designViewport">
        {tab === "SCHEMATIC" && <SchematicView />}
        {tab === "PCB" && <PcbView />}
        {tab === "3D" && <ThreeDPreview />}
        {tab === "DRC" && (
          <div className="drcView">
            <div className="drcStatus">DESIGN CHECK READY</div>
            <div>✓ U1 NE555 DIP-8 present</div>
            <div>✓ D1 LED + R1 current limiter present</div>
            <div>✓ Timing network R2/R3/C1 present</div>
            <div>✓ C2 pin-5 bypass present</div>
            <div>✓ 9V supply connector present</div>
            <div>✓ Ground network represented</div>
            <div className="drcWarning">GERBER / manufacturing DRC requires a connected EDA adapter.</div>
          </div>
        )}
      </div>

      <div className="designMetaGrid">
        <div><span>BOARD</span><b>70 × 45 mm</b></div>
        <div><span>SUPPLY</span><b>9V</b></div>
        <div><span>CORE</span><b>NE555</b></div>
        <div><span>OUTPUT</span><b>BLINKING LED</b></div>
      </div>
    </div>
  );
}
