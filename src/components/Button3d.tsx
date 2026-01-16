import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FlakesTexture } from '../assets/js/FlakesTexture';
import btnModelUrl from '../assets/models/last button.compressed.glb?url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Model = forwardRef<THREE.Group, any>((props, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { scene: gltfScene } = useGLTF(btnModelUrl) as any;
  const { scene } = useThree();
  const materialReadyRef = useRef(false);

  // Generate flakes texture for material normal map (same as star)
  const flakesTexture = useMemo(() => {
    const canvas = new FlakesTexture(512, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 6);
    return texture;
  }, []);

  const cubeMeshRef = useRef<THREE.Mesh | null>(null);

  // Apply material to all meshes (works with HDR environment)
  useEffect(() => {
    if (!materialReadyRef.current) {
      gltfScene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          // Material optimized for HDR environment map
          const buttonMaterial = new THREE.MeshPhysicalMaterial({
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            metalness: 1.0,
            roughness: 0.0,
            color: 0xffffff,
            normalMap: flakesTexture,
            normalScale: new THREE.Vector2(0.15, 0.15),
            envMap: scene.environment,
            envMapIntensity: 8.0, // Higher value = reflections appear more prominent/"zoomed"
            depthWrite: true, // Ensure button writes to depth buffer
          });

          // Explicitly set envMap after creation to ensure it's applied
          buttonMaterial.envMap = scene.environment;
          buttonMaterial.envMapIntensity = 8.0; // Higher value = reflections appear more prominent/"zoomed"
          buttonMaterial.needsUpdate = true;
          child.material = buttonMaterial;
          child.renderOrder = 1; // Ensure button renders AFTER cube
        }
      });
      materialReadyRef.current = true;
    }
  }, [gltfScene, flakesTexture, scene]);

  // Calculate button bounding box and create cube to match its dimensions
  const [cubeGeometry, setCubeGeometry] = useState<THREE.BoxGeometry | null>(
    null,
  );
  const [cubePosition, setCubePosition] = useState<[number, number, number]>([
    0, 0, 0,
  ]);

  useEffect(() => {
    if (gltfScene) {
      // Calculate bounding box of the button model
      const box = new THREE.Box3().setFromObject(gltfScene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // Create cube geometry at 80% of button width and height
      const geometry = new THREE.BoxGeometry(
        size.x * 0.86,
        size.y * 0.8,
        size.z * 0.94,
      );
      setCubeGeometry(geometry);
      setCubePosition([center.x, center.y, center.z]);
    }
  }, [gltfScene]);

  // white cube material - MAKE TRANSPARENT
  const cubeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff, // white
        metalness: 0.0,
        roughness: 0.8,
        transparent: true, // Add this
        opacity: 0, // Make invisible but interactive
      }),
    [],
  );

  // Cleanup cube geometry and material on unmount
  useEffect(() => {
    return () => {
      if (cubeGeometry) {
        cubeGeometry.dispose();
      }
      cubeMaterial.dispose();
    };
  }, [cubeGeometry, cubeMaterial]);

  return (
    <group ref={ref} {...props}>
      <primitive object={gltfScene} dispose={null} />
      {cubeGeometry && (
        <mesh
          ref={cubeMeshRef}
          geometry={cubeGeometry}
          material={cubeMaterial}
          position={cubePosition}
          renderOrder={0} // Cube renders first (lower number)
        />
      )}
    </group>
  );
});

Model.displayName = 'Model';

useGLTF.preload(btnModelUrl);
