import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Rotate3D } from 'lucide-react';

type Point = [number, number, number];
type SceneProps = { kind?: 'heart' | 'mechanism' | 'gene'; playing?: boolean; step?: number; withPcsk9?: boolean; resetKey?: number };

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Tube({ points, radius, color }: { points: Point[]; radius: number; color: string }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), [points]);
  return <mesh><tubeGeometry args={[curve, 48, radius, 12, false]} /><meshPhysicalMaterial color={color} roughness={0.3} metalness={0.08} clearcoat={0.45} /></mesh>;
}

function Ellipsoid({ position, scale, color, rotation = [0, 0, 0] }: { position: Point; scale: Point; color: string; rotation?: Point }) {
  return <mesh position={position} scale={scale} rotation={rotation}><sphereGeometry args={[1, 48, 40]} /><meshPhysicalMaterial color={color} roughness={0.32} metalness={0.03} clearcoat={0.65} clearcoatRoughness={0.24} /></mesh>;
}

function Heart({ playing }: { playing: boolean }) {
  const group = useRef<THREE.Group>(null);
  const time = useRef(0);
  const geometry = useMemo(() => {
    const profile = [[0.04, -1.85], [0.33, -1.65], [0.62, -1.3], [0.86, -0.85], [1.02, -0.3], [1.05, 0.22], [0.98, 0.65], [0.72, 0.95], [0.27, 1.08], [0.04, 1.05]];
    const spline = new THREE.SplineCurve(profile.map(([x, y]) => new THREE.Vector2(x, y)));
    const geom = new THREE.LatheGeometry(spline.getPoints(70), 80);
    const p = geom.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setX(i, p.getX(i) + y * 0.2);
      p.setZ(i, p.getZ(i) * 0.74);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (!group.current || !playing) return;
    time.current += delta;
    const beat = 1 + Math.pow(Math.max(0, Math.sin(time.current * 5.2)), 10) * 0.024;
    group.current.scale.setScalar(beat);
    group.current.rotation.y = -0.25 + Math.sin(time.current * 0.28) * 0.12;
  });
  return <group ref={group} rotation={[0.05, -0.25, -0.2]} position={[0, -0.05, 0]}>
    <mesh geometry={geometry}><meshPhysicalMaterial color="#b71e45" roughness={0.33} clearcoat={0.7} clearcoatRoughness={0.2} /></mesh>
    <Ellipsoid position={[-0.58, -0.15, 0.25]} scale={[0.66, 1.1, 0.6]} rotation={[0, 0, -0.25]} color="#df3658" />
    <Ellipsoid position={[-0.65, 0.88, 0]} scale={[0.67, 0.61, 0.65]} color="#c74b67" />
    <Ellipsoid position={[0.58, 0.88, -0.18]} scale={[0.54, 0.5, 0.54]} color="#ca284d" />
    <Tube points={[[0.32, 0.55, -0.18], [0.32, 1.45, -0.24], [0.66, 1.95, -0.27], [1.12, 1.78, -0.25], [1.22, 1.1, -0.4]]} radius={0.26} color="#f14c68" />
    <Tube points={[[0.62, 1.77, -0.27], [0.64, 2.22, -0.27]]} radius={0.1} color="#f35570" />
    <Tube points={[[0.9, 1.82, -0.27], [1.01, 2.16, -0.27]]} radius={0.105} color="#ed4967" />
    <Tube points={[[1.12, 1.61, -0.24], [1.36, 1.97, -0.24]]} radius={0.1} color="#d53558" />
    <Tube points={[[-0.68, 0.9, -0.25], [-0.84, 1.55, -0.26], [-0.68, 2.2, -0.36]]} radius={0.24} color="#2d70c5" />
    <Tube points={[[0.1, 0.56, 0.43], [0.38, 1.18, 0.6], [0.83, 1.37, 0.65], [1.42, 1.19, 0.6]]} radius={0.245} color="#4d96d7" />
    <Tube points={[[0.16, 0.64, 0.65], [0.25, 0.19, 0.78], [0.29, -0.4, 0.71], [0.38, -1.1, 0.46], [0.34, -1.48, 0.22]]} radius={0.038} color="#f9b1a0" />
    <Tube points={[[0.22, 0.26, 0.77], [-0.25, 0.23, 0.87], [-0.69, -0.04, 0.76], [-0.97, -0.35, 0.54]]} radius={0.035} color="#ffc1ab" />
    <Tube points={[[0.29, -0.43, 0.72], [0.68, -0.68, 0.53], [0.7, -1.03, 0.29]]} radius={0.028} color="#ffbcaa" />
  </group>;
}

function Protein({ scale = 1 }: { scale?: number }) {
  const atoms = useMemo(() => Array.from({ length: 55 }, (_, i) => {
    const angle = i * 2.399963;
    const z = 1 - 2 * (i + 0.5) / 55;
    const r = Math.sqrt(1 - z * z);
    const lobe = i < 18 ? -0.32 : i < 38 ? 0.12 : 0.48;
    return { position: [r * Math.cos(angle) * 0.6 + lobe, z * 0.48, r * Math.sin(angle) * 0.45] as Point, size: 0.13 + (i % 4) * 0.026, color: i < 18 ? '#a684fa' : i < 38 ? '#805ce3' : '#c2a9ff' };
  }), []);
  return <group scale={scale}>{atoms.map((a, i) => <mesh key={i} position={a.position}><sphereGeometry args={[a.size, 16, 12]} /><meshStandardMaterial color={a.color} roughness={0.35} metalness={0.12} /></mesh>)}</group>;
}

function LDLParticle() {
  const points = useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const y = 1 - (i / 21) * 2;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(i * 2.4) * r * 0.34, y * 0.34, Math.sin(i * 2.4) * r * 0.34] as Point;
  }), []);
  return <group><mesh><sphereGeometry args={[0.3, 24, 20]} /><meshStandardMaterial color="#f6bd52" roughness={0.3} /></mesh>{points.map((p, i) => <mesh key={i} position={p}><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color="#ffe2a0" /></mesh>)}</group>;
}

function Receptor({ dim = false }: { dim?: boolean }) {
  return <group>
    <Tube points={[[0, -0.47, 0], [0, -0.1, 0], [-0.15, 0.19, 0], [-0.32, 0.28, 0], [-0.47, 0.17, 0]]} radius={0.07} color={dim ? '#b2a1be' : '#57c8d2'} />
    <Tube points={[[0, -0.09, 0], [0.2, 0.19, 0], [0.33, 0.28, 0], [0.47, 0.17, 0]]} radius={0.07} color={dim ? '#b2a1be' : '#57c8d2'} />
  </group>;
}

function Mechanism({ playing, step, withPcsk9 }: { playing: boolean; step: number; withPcsk9: boolean }) {
  const protein = useRef<THREE.Group>(null);
  const particle = useRef<THREE.Group>(null);
  const receptor = useRef<THREE.Group>(null);
  const time = useRef(0);
  useFrame((_, delta) => {
    if (playing) time.current += delta;
    const t = time.current;
    // Interpolation also responds to manual steps when playback is paused.
    const ease = 1 - Math.exp(-delta * 5);
    if (protein.current) {
      const target = step === 0 ? new THREE.Vector3(1.55, 1.2, 0.2) : new THREE.Vector3(0.65, step >= 2 ? -0.9 : 0.25, 0.25);
      protein.current.position.lerp(target, ease);
      protein.current.rotation.y = t * 0.28;
      protein.current.scale.lerp(new THREE.Vector3().setScalar(step === 3 ? 0.16 : 0.68), ease);
    }
    if (particle.current) {
      particle.current.position.lerp(new THREE.Vector3(step === 0 ? -1.1 : 0, step === 0 ? 1.1 + Math.sin(t) * 0.06 : step === 1 ? 0.5 : -1.1, 0.2), ease);
      particle.current.scale.lerp(new THREE.Vector3().setScalar(step === 3 ? 0.05 : 1), ease);
    }
    if (receptor.current) {
      const recycled = step === 3 && !withPcsk9;
      receptor.current.position.lerp(new THREE.Vector3(0, step >= 2 && !recycled ? -1.65 : -0.2, 0), ease);
      receptor.current.scale.lerp(new THREE.Vector3().setScalar(step === 3 && withPcsk9 ? 0.03 : 1), ease);
    }
  });
  return <group position={[0, 0.05, 0]}>
    <mesh position={[0, -0.9, -0.35]}><boxGeometry args={[5.4, 0.17, 1.25]} /><meshStandardMaterial color="#25485b" transparent opacity={0.65} /></mesh>
    {Array.from({ length: 24 }, (_, i) => <group key={i} position={[-2.6 + i * 0.225, -0.8, 0]}><mesh><sphereGeometry args={[0.085, 12, 10]} /><meshStandardMaterial color="#568ba0" /></mesh><mesh position={[0, -0.19, 0]}><sphereGeometry args={[0.085, 12, 10]} /><meshStandardMaterial color="#36687e" /></mesh></group>)}
    <group ref={receptor} position={[0, -0.2, 0]}><Receptor dim={step >= 2 && withPcsk9} /></group>
    <group position={[-1.85, -0.2, -0.3]}><Receptor /></group>
    <group position={[1.95, -0.2, -0.3]}><Receptor /></group>
    <group ref={particle} position={[-1.1, 1.1, 0.2]}><LDLParticle /></group>
    {withPcsk9 && <group ref={protein} position={[1.55, 1.2, 0.2]}><Protein scale={0.68} /></group>}
  </group>;
}

function DNA({ playing }: { playing: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pairs = useMemo(() => Array.from({ length: 27 }, (_, i) => {
    const a = i * 0.47;
    const y = (i - 13) * 0.16;
    return { a: [Math.cos(a) * 0.67, y, Math.sin(a) * 0.67] as Point, b: [Math.cos(a + Math.PI) * 0.67, y, Math.sin(a + Math.PI) * 0.67] as Point };
  }), []);
  useFrame((_, d) => { if (group.current && playing) group.current.rotation.y += d * 0.25; });
  return <group ref={group} rotation={[0, 0, -0.3]}>
    <Tube points={pairs.map(p => p.a)} radius={0.07} color="#64b5fa" />
    <Tube points={pairs.map(p => p.b)} radius={0.07} color="#ad83f6" />
    {pairs.map((p, i) => <group key={i}><Tube points={[p.a, p.b]} radius={0.027} color={i % 2 ? '#e9b86a' : '#61c6be'} />{[p.a, p.b].map((pos, j) => <mesh position={pos} key={j}><sphereGeometry args={[0.105, 16, 12]} /><meshStandardMaterial color={j ? '#b692fa' : '#8accff'} /></mesh>)}</group>)}
  </group>;
}

function Fallback({ kind }: { kind: SceneProps['kind'] }) {
  return <div className="scene-fallback"><svg viewBox="0 0 360 320" role="img" aria-label={kind === 'heart' ? 'Heart illustration' : 'LDL receptor schematic'}>
    <defs><radialGradient id="heart-fill"><stop stopColor="#ff8391"/><stop offset="1" stopColor="#b81b4b"/></radialGradient></defs>
    {kind === 'heart' ? <><path d="M176 94C89 18 36 121 83 200l87 83c62-54 113-93 112-146-1-60-68-84-106-43Z" fill="url(#heart-fill)"/><path d="M186 94c0-66 63-76 64-19M117 94 111 39" stroke="#548edf" strokeWidth="24" fill="none"/></> : <><path d="M30 225h300M160 225v-75m0 10-35-35m35 35 35-35" stroke="#69c6cd" strokeWidth="12" fill="none"/><circle cx="160" cy="95" r="29" fill="#f2bf5c"/><g fill="#ad86f5"><circle cx="248" cy="92" r="24"/><circle cx="268" cy="108" r="20"/><circle cx="238" cy="117" r="21"/></g><text x="70" y="265" fill="#bad1e2" fontSize="16">LDL receptor · liver cell</text></>}
  </svg><span>Static illustration · interactive 3D needs WebGL</span></div>;
}

function ResetCamera({ kind, resetKey }: { kind: SceneProps['kind']; resetKey: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.2, kind === 'heart' ? 7.9 : kind === 'gene' ? 8.4 : 7.7);
    camera.lookAt(0, 0, 0);
  }, [camera, kind, resetKey]);
  return null;
}

export default function Scene({ kind = 'heart', playing = true, step = 0, withPcsk9 = true, resetKey = 0 }: SceneProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    setSupported(Boolean(context));
    if (context) (context as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
  }, []);
  const fallback = <Fallback kind={kind} />;
  return <div className={`scene scene-${kind}`} role="group" aria-label={kind === 'heart' ? 'Interactive 3D heart illustration. Drag to rotate.' : kind === 'gene' ? 'Interactive schematic DNA double helix. Drag to rotate.' : 'Interactive 3D LDL receptor and PCSK9 mechanism. Drag to rotate.'}>
    {supported === null ? <div className="scene-loading"><Rotate3D size={28} /><span>Preparing your 3D view</span></div> : !supported ? fallback : <SceneBoundary fallback={fallback}>
      <Canvas dpr={[1, 1.7]} camera={{ position: [0, 0.2, kind === 'heart' ? 7.9 : kind === 'gene' ? 8.4 : 7.7], fov: 38 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[-3, 4, 5]} intensity={3.4} color="#f5f4ff" />
        <directionalLight position={[3, 1, 0]} intensity={2.1} color="#6cafff" />
        <pointLight position={[0, -2, 3]} intensity={12} color="#e8869f" />
        <ResetCamera kind={kind} resetKey={resetKey} />
        <Suspense fallback={null}>{kind === 'heart' ? <Heart key={resetKey} playing={playing} /> : kind === 'gene' ? <DNA key={resetKey} playing={playing} /> : <Mechanism key={resetKey} playing={playing} step={step} withPcsk9={withPcsk9} />}</Suspense>
        <OrbitControls key={`${kind}-${resetKey}`} enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.6} rotateSpeed={0.7} />
      </Canvas>
    </SceneBoundary>}
    {supported && kind === 'mechanism' && <div className="mechanism-overlay" aria-hidden="true"><span className="scene-label bloodstream-label">BLOODSTREAM</span><span className="scene-label liver-label">LIVER CELL</span><span className="scene-label membrane-label">Cell membrane</span>{step === 3 && <span className={`scene-outcome ${withPcsk9 ? 'purple' : ''}`}>{withPcsk9 ? 'Receptor broken down' : 'Receptor recycled'}</span>}</div>}
  </div>;
}
