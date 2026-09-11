"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

interface LungModelProps {
  predLabel?: string | null;
  hemithorax?: string | null;
  zone?: string | null;
  isIdle?: boolean;
}

function LungLobe({
  side,
  highlight,
  zoneHighlight,
  predLabel,
}: {
  side: "left" | "right";
  highlight: boolean;
  zoneHighlight: string | null;
  predLabel: string | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const xOffset = side === "left" ? -0.55 : 0.55;

  // Color based on prediction
  const baseColor = useMemo(() => {
    if (!predLabel) return new THREE.Color("#00bfa6");
    return predLabel === "PNEUMONIA"
      ? new THREE.Color("#f59e0b")
      : new THREE.Color("#22c55e");
  }, [predLabel]);

  const emissiveColor = useMemo(() => {
    if (!predLabel) return new THREE.Color("#00e5ff");
    return predLabel === "PNEUMONIA"
      ? new THREE.Color("#ef4444")
      : new THREE.Color("#00e5ff");
  }, [predLabel]);

  const emissiveIntensity = highlight ? 0.8 : 0.15;

  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.getElapsedTime();
      const scale = highlight ? 1.08 + Math.sin(t * 2) * 0.03 : 1.06;
      glowRef.current.scale.setScalar(scale);
    }
  });

  // Zone highlight: shift Y position of glow indicator
  const zoneY = useMemo(() => {
    if (!zoneHighlight) return 0;
    if (zoneHighlight.includes("Upper")) return 0.4;
    if (zoneHighlight.includes("Mid")) return 0;
    return -0.4;
  }, [zoneHighlight]);

  return (
    <group position={[xOffset, 0, 0]}>
      {/* Main lung lobe — capsule-like shape */}
      <mesh ref={meshRef}>
        <capsuleGeometry args={[0.35, 0.8, 16, 32]} />
        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={0.4}
          chromaticAberration={0.1}
          anisotropy={0.2}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          ior={1.25}
          color={baseColor}
          roughness={0.15}
          transmission={0.95}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Inner glow mesh */}
      <mesh ref={glowRef} scale={1.06}>
        <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={highlight ? 0.2 : 0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Zone highlight indicator */}
      {highlight && zoneHighlight && (
        <mesh position={[0, zoneY, 0.3]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color={predLabel === "PNEUMONIA" ? "#ef4444" : "#22c55e"}
            emissive={predLabel === "PNEUMONIA" ? "#ef4444" : "#22c55e"}
            emissiveIntensity={2}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
}

function Trachea() {
  return (
    <group position={[0, 0.9, 0]}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.08, 0.4, 12]} />
        <meshStandardMaterial
          color="#00bfa6"
          transparent
          opacity={0.5}
          emissive="#00e5ff"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function LungAssembly({ predLabel, hemithorax, zone, isIdle }: LungModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const highlightLeft = hemithorax?.includes("Right") ?? false; // Radiologic convention: patient's right = viewer's left
  const highlightRight = hemithorax?.includes("Left") ?? false;

  useFrame((state) => {
    if (groupRef.current) {
      if (isIdle) {
        groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      } else {
        // Gentle idle
        groupRef.current.rotation.y =
          Math.sin(state.clock.getElapsedTime() * 0.5) * 0.15;
      }
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={groupRef} scale={1.8}>
        <Trachea />
        <LungLobe
          side="left"
          highlight={highlightLeft}
          zoneHighlight={highlightLeft ? zone ?? null : null}
          predLabel={predLabel ?? null}
        />
        <LungLobe
          side="right"
          highlight={highlightRight}
          zoneHighlight={highlightRight ? zone ?? null : null}
          predLabel={predLabel ?? null}
        />
      </group>
    </Float>
  );
}

export default function LungVisualization3D({
  predLabel,
  hemithorax,
  zone,
  isIdle = true,
}: LungModelProps) {
  return (
    <div className="w-full h-full min-h-[350px] relative">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#00e5ff" />
        <pointLight position={[-5, -3, 3]} intensity={0.4} color="#22c55e" />
        <spotLight
          position={[0, 8, 4]}
          intensity={0.6}
          angle={0.4}
          penumbra={0.8}
          color="#ffffff"
        />
        <Environment preset="city" environmentIntensity={0.3} />
        <LungAssembly
          predLabel={predLabel}
          hemithorax={hemithorax}
          zone={zone}
          isIdle={isIdle}
        />
      </Canvas>

      {/* Static fallback gradient overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#010057]/30 rounded-2xl" />
    </div>
  );
}
