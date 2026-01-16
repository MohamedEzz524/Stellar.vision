import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FlakesTexture } from '../assets/js/FlakesTexture';
import btnModelUrl from '../assets/models/last button.compressed.glb?url';

export const Model = forwardRef<THREE.Group>((props, ref) => {
  const { scene: gltfScene } = useGLTF(btnModelUrl);
  const { scene } = useThree();
  const materialReadyRef = useRef(false);

  // Generate flakes texture
  const flakesTexture = useMemo(() => {
    const canvas = new FlakesTexture(512, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 6);
    return texture;
  }, []);

  const cubeMeshRef = useRef<THREE.Mesh | null>(null);

  // Apply material to button with explicit render order
  useEffect(() => {
    if (!materialReadyRef.current && gltfScene) {
      gltfScene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          const buttonMaterial = new THREE.MeshPhysicalMaterial({
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            metalness: 1.0,
            roughness: 0.0,
            color: 0xffffff,
            normalMap: flakesTexture,
            normalScale: new THREE.Vector2(0.15, 0.15),
            envMap: scene.environment,
            envMapIntensity: 8.0,
            // Add depthTest to prevent z-fighting
            depthTest: true,
            depthWrite: true,
          });

          buttonMaterial.envMap = scene.environment;
          buttonMaterial.envMapIntensity = 8.0;
          buttonMaterial.needsUpdate = true;
          child.material = buttonMaterial;

          // Set button to render FIRST (lower number)
          child.renderOrder = 0;
        }
      });
      materialReadyRef.current = true;
    }
  }, [gltfScene, flakesTexture, scene]);

  // Calculate cube geometry
  const [cubeGeometry, setCubeGeometry] = useState<THREE.BoxGeometry | null>(
    null,
  );
  const [cubePosition, setCubePosition] = useState<[number, number, number]>([
    0, 0, 0,
  ]);

  useEffect(() => {
    if (gltfScene) {
      const box = new THREE.Box3().setFromObject(gltfScene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // Slightly smaller cube to ensure it sits INSIDE the button
      const geometry = new THREE.BoxGeometry(
        size.x * 0.86,
        size.y * 0.8,
        size.z * 0.94,
      );
      setCubeGeometry(geometry);
      setCubePosition([center.x, center.y, center.z + 0.01]); // Slight offset in Z
    }
  }, [gltfScene]);

  // Cube material for text display - make sure it's DIFFERENT from button material
  const cubeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff, // white
        metalness: 0.3, // Slight metalness to match button
        roughness: 0.4, // Slightly rougher than button
        emissive: 0x000000, // No emission
        emissiveIntensity: 0,
        // Important: these settings control rendering order
        transparent: false,
        opacity: 1,
        depthTest: true,
        depthWrite: true,
      }),
    [],
  );

  // Apply text to cube material if needed
  useEffect(() => {
    // You can apply a texture or modify material for text here
    if (cubeMeshRef.current && props.textTexture) {
      cubeMeshRef.current.material.map = props.textTexture;
      cubeMeshRef.current.material.needsUpdate = true;
    }
  }, [props.textTexture]);

  return (
    <group ref={ref} {...props}>
      {/* Button renders FIRST (behind) */}
      <primitive object={gltfScene} dispose={null} />

      {/* Cube with text renders SECOND (in front) */}
      {cubeGeometry && (
        <mesh
          ref={cubeMeshRef}
          geometry={cubeGeometry}
          material={cubeMaterial}
          position={cubePosition}
          renderOrder={1} // Higher number = renders AFTER button
        />
      )}
    </group>
  );
});

Model.displayName = 'Model';
useGLTF.preload(btnModelUrl);
