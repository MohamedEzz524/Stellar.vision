import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FlakesTexture } from '../assets/js/FlakesTexture';
import btnModelUrl from '../assets/models/last button.compressed.glb?url';

export const Model = forwardRef<THREE.Group, any>((props, ref) => {
  const { scene: gltfScene } = useGLTF(btnModelUrl) as any;

  const buttonMeshRef = useRef<THREE.Mesh | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  // Find the main button mesh (keep its material intact)
  useEffect(() => {
    gltfScene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && !buttonMeshRef.current) {
        buttonMeshRef.current = child; // only reference, DO NOT modify material
      }
    });
  }, [gltfScene]);

  // Create cube mesh in local space
  const cubeMesh = useMemo(() => {
    if (!buttonMeshRef.current) return null;

    // Calculate button bounding box
    const box = new THREE.Box3().setFromObject(buttonMeshRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);

    const geometry = new THREE.BoxGeometry(
      size.x * 0.86,
      size.y * 0.8,
      size.z * 0.7,
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.8,
      transparent: true,
      opacity: 0.8, // optional visual tweak
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0); // center in button local space
    return mesh;
  }, [buttonMeshRef.current]);

  // Parent cube to button mesh
  useEffect(() => {
    if (cubeMesh && buttonMeshRef.current) {
      buttonMeshRef.current.add(cubeMesh);
      cubeRef.current = cubeMesh;

      return () => {
        buttonMeshRef.current?.remove(cubeMesh);
        cubeMesh.geometry.dispose();
        cubeMesh.material.dispose();
      };
    }
  }, [cubeMesh]);

  return (
    <group ref={ref} {...props}>
      <primitive object={gltfScene} dispose={null} />
    </group>
  );
});

Model.displayName = 'Model';
useGLTF.preload(btnModelUrl);
