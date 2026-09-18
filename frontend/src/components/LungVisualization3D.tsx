"use client";

import React, { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Float, Center, Html } from "@react-three/drei";
import * as THREE from "three";
import { Sparkles, Layers, RotateCw, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

interface LungModelProps {
  predLabel?: string | null;
  hemithorax?: string | null;
  zone?: string | null;
  salientPct?: number | null;
  isIdle?: boolean;
}

// ---------------------------------------------------------------------------
// Realistic Anatomical 3D Lung Model loaded from NIH 3D Human Reference Atlas
// ---------------------------------------------------------------------------
function RealisticLungMesh({
  predLabel,
  hemithorax,
  zone,
}: {
  predLabel?: string | null;
  hemithorax?: string | null;
  zone?: string | null;
}) {
  const { scene } = useGLTF("/models/lung.glb");
  const modelRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  // Clone scene so materials are isolated
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const isPneumonia = predLabel === "PNEUMONIA";
    const isNormal = predLabel === "NORMAL";

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const origName = (mesh.name || "").toLowerCase();
        const isBronchus = origName.includes("bronch") || origName.includes("cartilage") || origName.includes("hilum");

        if (isBronchus) {
          // Bioluminescent bronchial tree (from Dribbble shot)
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#22d3ee"),
            emissive: new THREE.Color("#0891b2"),
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.3,
            transparent: true,
            opacity: 0.9,
          });
        } else {
          // Transparent Glassy Lung Parenchyma (Cyan & Emerald/Rose gradient)
          const baseColor = isPneumonia
            ? new THREE.Color("#fb7185")
            : isNormal
            ? new THREE.Color("#34d399")
            : new THREE.Color("#38bdf8");

          const emissive = isPneumonia
            ? new THREE.Color("#f43f5e")
            : isNormal
            ? new THREE.Color("#10b981")
            : new THREE.Color("#0284c7");

          mesh.material = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: emissive,
            emissiveIntensity: 0.25,
            roughness: 0.25,
            metalness: 0.15,
            transparent: true,
            opacity: 0.82,
          });
        }
      }
    });
    return clone;
  }, [scene, predLabel]);

  // Subtle natural breathing rhythm
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (modelRef.current) {
      const breath = 1 + Math.sin(t * 1.5) * 0.022;
      modelRef.current.scale.set(breath, breath * 1.01, breath);
    }
    if (beaconRef.current) {
      const pulse = 1 + Math.sin(t * 4.5) * 0.3;
      beaconRef.current.scale.setScalar(pulse);
    }
  });

  // Calculate 3D hotspot beacon coordinate from diagnostic zone
  const hotspotPos = useMemo<[number, number, number] | null>(() => {
    if (!predLabel || predLabel !== "PNEUMONIA" || !hemithorax) return null;

    // Radiologic convention: Patient's Right = Viewer's Left (-X)
    const isPatientRight = hemithorax.includes("Right");
    const x = isPatientRight ? -0.55 : 0.55;

    let y = 0.0;
    if (zone?.includes("Upper")) y = 0.45;
    else if (zone?.includes("Mid")) y = 0.0;
    else if (zone?.includes("Lower")) y = -0.45;

    const z = 0.25;
    return [x, y, z];
  }, [predLabel, hemithorax, zone]);

  return (
    <group ref={modelRef}>
      <Center>
        <primitive object={clonedScene} scale={9.0} />
      </Center>

      {/* Grad-CAM Anatomical Hotspot Beacon */}
      {hotspotPos && (
        <group position={hotspotPos}>
          <mesh ref={beaconRef}>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial
              color="#f43f5e"
              emissive="#f43f5e"
              emissiveIntensity={3}
              roughness={0.2}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshBasicMaterial
              color="#fb7185"
              transparent
              opacity={0.35}
              wireframe
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-cyan-500/20 shadow-xl">
        <Activity className="w-5 h-5 text-cyan-400 animate-spin" />
        <span className="text-xs font-semibold text-slate-300">Rendering 3D Thoracic Twin...</span>
      </div>
    </Html>
  );
}

export default function LungVisualization3D({
  predLabel,
  hemithorax,
  zone,
  salientPct,
  isIdle = true,
}: LungModelProps) {
  const [viewMode, setViewMode] = useState<"interactive" | "sketchfab">("interactive");
  const isPneumonia = predLabel === "PNEUMONIA";

  return (
    <div className="w-full h-full min-h-[420px] flex flex-col relative rounded-3xl overflow-hidden clinora-card border border-white/[0.08] shadow-2xl">
      
      {/* Top Controls Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/40 border-b border-white/[0.06] backdrop-blur-xl z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
            Pneumora 3D Thoracic Twin
          </span>
          {predLabel && (
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isPneumonia
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isPneumonia ? "Lesion Focus" : "Aerated Parenchyma"}
            </span>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-full border border-white/[0.08] text-xs">
          <button
            onClick={() => setViewMode("interactive")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all font-semibold ${
              viewMode === "interactive"
                ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={12} />
            <span>Interactive Twin</span>
          </button>
          <button
            onClick={() => setViewMode("sketchfab")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all font-semibold ${
              viewMode === "sketchfab"
                ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers size={12} />
            <span>Sketchfab HD</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas / Sketchfab Frame */}
      <div className="flex-1 relative w-full h-full min-h-[350px]">
        {viewMode === "interactive" ? (
          <>
            <Canvas
              camera={{ position: [0, 0, 3.8], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
              style={{ background: "transparent" }}
            >
              <ambientLight intensity={0.75} />
              <directionalLight position={[5, 8, 5]} intensity={1.3} color="#f0f9ff" />
              <directionalLight position={[-5, -4, -3]} intensity={0.6} color="#38bdf8" />
              <pointLight position={[0, 3, 2]} intensity={0.9} color="#06b6d4" />
              <pointLight position={[0, -3, -2]} intensity={0.45} color="#10b981" />

              <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.25}>
                <Suspense fallback={<LoadingFallback />}>
                  <RealisticLungMesh
                    predLabel={predLabel}
                    hemithorax={hemithorax}
                    zone={zone}
                  />
                </Suspense>
              </Float>

              <OrbitControls
                enableZoom={true}
                enablePan={false}
                autoRotate={isIdle}
                autoRotateSpeed={0.8}
                maxPolarAngle={Math.PI / 1.4}
                minPolarAngle={Math.PI / 3.5}
                minDistance={2.5}
                maxDistance={5.5}
              />
            </Canvas>

            {/* Dribbble-Style Floating Callout Pill 1: Warning Hotspot Callout */}
            {isPneumonia && hemithorax && (
              <div className="absolute top-6 right-6 hud-callout p-3.5 max-w-xs animate-pulse-subtle pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertTriangle size={13} />
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">
                    Warning: Lung Activity Detected
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 pl-7 leading-tight">
                  {hemithorax} &bull; {zone || "Focal Infiltrate"}
                </p>
                {salientPct != null && (
                  <p className="text-[10px] text-rose-400 font-mono pl-7 mt-1">
                    Coverage: {salientPct.toFixed(1)}% of thoracic area
                  </p>
                )}
              </div>
            )}

            {/* Dribbble-Style Floating Callout Pill 2: Bottom-Left Vital Status */}
            {predLabel && (
              <div className="absolute bottom-12 left-6 hud-callout px-3.5 py-2.5 flex items-center gap-3 pointer-events-none">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    isPneumonia ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {isPneumonia ? <AlertTriangle size={15} /> : <ShieldCheck size={16} />}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {isPneumonia ? "Pneumonia Saliency" : "Normal Respiration"}
                  </span>
                  <span className="text-xs font-extrabold text-white font-mono">
                    {isPneumonia ? "Active Opacity" : "Physiological Radiolucency"}
                  </span>
                </div>
              </div>
            )}

            {/* Dribbble-Style Bottom Frequency / Timeline Ticks Ruler */}
            <div className="absolute bottom-3 inset-x-0 flex flex-col items-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-slate-400 mb-1 tracking-widest">
                τ = 0.50
              </span>
              <div className="scale-ticks">
                {Array.from({ length: 35 }).map((_, i) => (
                  <span
                    key={i}
                    className={`scale-tick ${i === 17 ? "major" : ""}`}
                  />
                ))}
              </div>
            </div>

            {/* Controls Tooltip */}
            <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/60 border border-white/[0.06] text-[10px] text-slate-400 backdrop-blur-sm">
              <RotateCw size={10} className="text-cyan-400 animate-spin" style={{ animationDuration: "8s" }} />
              <span>Rotate &bull; Zoom</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full relative">
            <iframe
              title="Realistic Human Lungs"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen; xr-spatial-tracking"
              src="https://sketchfab.com/models/ce09f4099a68467880f46e61eb9a3531/embed?autostart=1&ui_theme=dark&dnt=1"
              className="w-full h-full min-h-[350px] border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}

useGLTF.preload("/models/lung.glb");
