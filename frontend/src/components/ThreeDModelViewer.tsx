import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import type { PlanGeometrySnapshot } from '@hausco/shared';

interface ThreeDModelViewerProps {
  geometry: PlanGeometrySnapshot;
}

const HouseScene: React.FC<{ geometry: PlanGeometrySnapshot }> = ({ geometry }) => {
  const w = geometry.footprintWidthM;
  const d = geometry.footprintDepthM;
  const wallHeight = geometry.storeys === 2 ? 5.8 : 3.0;
  const cx = w / 2;
  const cz = d / 2;

  return (
    <>
      <Sky sunPosition={[12, 16, 10]} turbidity={4} rayleigh={0.8} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[14, 20, 12]} intensity={1.15} castShadow />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial color="#EFEAD8" />
      </mesh>

      {/* Floor slab */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[w + 0.5, 0.2, d + 0.5]} />
        <meshStandardMaterial color="#D6CDB8" />
      </mesh>

      {/* Extruded rooms & walls */}
      {geometry.rooms.map((room) => (
        <mesh
          key={room.id}
          position={[room.x + room.width / 2 - cx, 0.21, room.y + room.depth / 2 - cz]}
        >
          <boxGeometry args={[Math.max(0.2, room.width - 0.15), 0.04, Math.max(0.2, room.depth - 0.15)]} />
          <meshStandardMaterial color={room.category === 'BATHROOM' ? '#E2E8F0' : '#FDE8A5'} />
        </mesh>
      ))}

      {geometry.walls.map((wall) => {
        const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
        const mx = (wall.x1 + wall.x2) / 2 - cx;
        const mz = (wall.y1 + wall.y2) / 2 - cz;
        const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
        return (
          <mesh
            key={wall.id}
            position={[mx, 0.2 + wallHeight / 2, mz]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[len, wallHeight, wall.thicknessM]} />
            <meshStandardMaterial color={wall.isExterior ? '#FAF7EE' : '#EAE3D0'} />
          </mesh>
        );
      })}

      {/* Upper storey intermediate slab */}
      {geometry.storeys === 2 ? (
        <mesh position={[0, 3.05, 0]}>
          <boxGeometry args={[w + 0.3, 0.2, d + 0.3]} />
          <meshStandardMaterial color="#C8BFA8" />
        </mesh>
      ) : null}

      {/* Roof geometry matching selected roofType */}
      {geometry.roofType === 'FLAT_SLAB' ? (
        <mesh position={[0, wallHeight + 0.35, 0]}>
          <boxGeometry args={[w + 0.7, 0.28, d + 0.7]} />
          <meshStandardMaterial color="#D9940A" />
        </mesh>
      ) : (
        <mesh position={[0, wallHeight + 1.1, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[Math.max(w, d) * 0.78, 1.9, 4]} />
          <meshStandardMaterial color="#D9940A" />
        </mesh>
      )}

      <OrbitControls enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2 - 0.05} />
    </>
  );
};

export const ThreeDModelViewer: React.FC<ThreeDModelViewerProps> = ({ geometry }) => {
  return (
    <div className="h-[380px] w-full rounded-lg border border-[#1C1C1A]/15 overflow-hidden bg-[#FAF7EE]">
      <Canvas camera={{ position: [15, 11, 16], fov: 44 }} shadows>
        <HouseScene geometry={geometry} />
      </Canvas>
    </div>
  );
};
