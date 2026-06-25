import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useGlobeStore, type WeatherLayer } from "@/store/globeStore";

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function getColorForValue(layer: WeatherLayer, value: number): THREE.Color {
  const c = new THREE.Color();
  switch (layer) {
    case "temperature": {
      const t = Math.max(0, Math.min(1, (value + 20) / 60));
      if (t < 0.33) c.setRGB(0.1, 0.3 + t * 1.5, 1 - t * 0.5);
      else if (t < 0.66) c.setRGB(t * 1.5, 0.8, 0.2);
      else c.setRGB(1, 0.3 - (t - 0.66) * 0.8, 0.1);
      break;
    }
    case "pressure": {
      const p = Math.max(0, Math.min(1, (value - 950) / 100));
      c.setRGB(0.2 + p * 0.8, 0.3, 1 - p * 0.6);
      break;
    }
    case "humidity": {
      const h = Math.max(0, Math.min(1, value / 100));
      c.setRGB(0.1, 0.4 + h * 0.5, 0.7 + h * 0.3);
      break;
    }
    case "wind": {
      const w = Math.max(0, Math.min(1, value / 100));
      c.setRGB(0.2 + w * 0.8, 0.7 - w * 0.5, 0.4 + w * 0.3);
      break;
    }
    case "precipitation": {
      const pr = Math.max(0, Math.min(1, value / 50));
      c.setRGB(0.1, 0.3 + pr * 0.5, 0.6 + pr * 0.4);
      break;
    }
    default:
      c.setHex(0x888888);
  }
  return c;
}

function getSeverityColor(severity: string): THREE.Color {
  switch (severity) {
    case "extreme": return new THREE.Color(0xFF2200);
    case "high": return new THREE.Color(0xFF6600);
    case "moderate": return new THREE.Color(0xFFAA00);
    default: return new THREE.Color(0xFFCC44);
  }
}

interface GlobeSceneProps {
  onDataPointHover?: (point: { lat: number; lon: number; value: number } | null) => void;
}

export default function GlobeScene({ onDataPointHover }: GlobeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth || 800;
    const height = parent.clientHeight || 600;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.8;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0x445566, 0.4);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    // Globe with textures
    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.SphereGeometry(1, 64, 32);

    const diffuseMap = textureLoader.load("/assets/earth_topology.jpg");
    const bumpMap = textureLoader.load("/assets/earth_bump.jpg");
    const specularMap = textureLoader.load("/assets/earth_specular.jpg");

    const material = new THREE.MeshPhongMaterial({
      map: diffuseMap,
      bumpMap: bumpMap,
      bumpScale: 0.02,
      specularMap: specularMap,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });

    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Atmosphere glow
    const atmosphereGeo = new THREE.SphereGeometry(1.12, 64, 32);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);

    // Data markers
    const markerGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xFF4500 });
    const markers = new THREE.InstancedMesh(markerGeo, markerMat, 500);
    markers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    globe.add(markers);

    // Interaction state
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-10, -10);
    let isDragging = false;
    let prevPointer = { x: 0, y: 0 };
    const rotation = { x: 0, y: 0 };
    let hoveredInstance = -1;
    const markerData: Array<{ lat: number; lon: number; value: number; type: string }> = [];

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      if (useGlobeStore.getState().autoRotate && !isDragging) {
        globe.rotation.y += 0.001;
      }

      globe.rotation.y += rotation.y;
      globe.rotation.x += rotation.x;
      rotation.x *= 0.95;
      rotation.y *= 0.95;

      // Update markers
      const state = useGlobeStore.getState();
      const dummy = new THREE.Object3D();
      let idx = 0;
      markerData.length = 0;

      if (state.activeLayer !== "none" && state.weatherGrid.length > 0) {
        for (const pt of state.weatherGrid) {
          if (idx >= 499) break;
          const pos = latLonToVector3(pt.lat, pt.lon, 1.02);
          dummy.position.copy(pos);
          dummy.lookAt(0, 0, 0);
          dummy.scale.setScalar(0.5 + Math.min(1, Math.abs(pt.value) / 50));
          dummy.updateMatrix();
          markers.setMatrixAt(idx, dummy.matrix);
          markers.setColorAt(idx, getColorForValue(state.activeLayer, pt.value));
          markerData.push({ lat: pt.lat, lon: pt.lon, value: pt.value, type: "weather" });
          idx++;
        }
      }

      if (state.showAnomalies && state.anomalies.length > 0) {
        for (const a of state.anomalies) {
          if (idx >= 499) break;
          const pos = latLonToVector3(a.lat, a.lon, 1.02);
          dummy.position.copy(pos);
          dummy.lookAt(0, 0, 0);
          const scale = a.severity === "extreme" ? 1.5 : a.severity === "high" ? 1.2 : 0.8;
          dummy.scale.setScalar(scale);
          dummy.updateMatrix();
          markers.setMatrixAt(idx, dummy.matrix);
          markers.setColorAt(idx, getSeverityColor(a.severity));
          markerData.push({ lat: a.lat, lon: a.lon, value: a.deviation, type: "anomaly" });
          idx++;
        }
      }

      for (let i = idx; i < 500; i++) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        markers.setMatrixAt(i, dummy.matrix);
      }

      markers.instanceMatrix.needsUpdate = true;
      if (markers.instanceColor) markers.instanceColor.needsUpdate = true;

      // Raycasting
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(markers);

      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const instanceId = intersects[0].instanceId;
        if (hoveredInstance !== instanceId) {
          hoveredInstance = instanceId;
          const data = markerData[instanceId];
          if (data && onDataPointHover) {
            onDataPointHover(data);
          }
        }
      } else if (hoveredInstance !== -1) {
        hoveredInstance = -1;
        if (onDataPointHover) onDataPointHover(null);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      const w = parent.clientWidth || 800;
      const h = parent.clientHeight || 600;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Pointer handlers
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointer = { x: e.clientX, y: e.clientY };
      useGlobeStore.getState().setAutoRotate(false);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevPointer.x;
        const dy = e.clientY - prevPointer.y;
        rotation.y += dx * 0.003;
        rotation.x += dy * 0.003;
        prevPointer = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => {
        useGlobeStore.getState().setAutoRotate(true);
      }, 2000);
    };

    const onWheel = (e: WheelEvent) => {
      const zoom = e.deltaY * 0.001;
      camera.position.z = Math.max(1.8, Math.min(8, camera.position.z + zoom));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [onDataPointHover]);

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none", display: "block" }}
      />
    </div>
  );
}
