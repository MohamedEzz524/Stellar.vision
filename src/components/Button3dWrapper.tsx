import React, { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Model } from './Button3d';
import * as THREE from 'three';
import { gsap } from 'gsap';
import hdrTextureUrl from '../assets/texture/hdr.jpeg?url';

interface Button3dWrapperProps {
  onClick?: () => void;
  text?: string;
  className?: string;
  viewState?: number;
}

// Configure renderer: tone mapping and color encoding
const RendererConfig = () => {
  const { gl } = useThree();
  useEffect(() => {
    // @ts-expect-error - outputEncoding exists in this version of Three.js
    gl.outputEncoding = THREE.sRGBEncoding;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 5.0;
  }, [gl]);
  return null;
};

// Load HDR texture and set as scene environment
const EnvironmentSetup = () => {
  const { gl, scene } = useThree();

  useEffect(() => {
    const loader = new THREE.TextureLoader();

    loader.load(
      hdrTextureUrl,
      (texture: THREE.Texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.flipY = false;
        texture.wrapS = THREE.RepeatWrapping;
        texture.offset.x = 0.25;

        try {
          const pmremGenerator = new THREE.PMREMGenerator(gl);
          const envMapResult = pmremGenerator.fromEquirectangular(texture);
          const envMapTexture = envMapResult.texture;

          scene.environment = envMapTexture;

          envMapResult.dispose();
          pmremGenerator.dispose();
          texture.dispose();
        } catch (pmremError) {
          console.warn(
            'PMREM conversion failed, using texture directly:',
            pmremError,
          );
          scene.environment = texture;
        }
      },
      undefined,
      (error: unknown) => {
        console.error('Error loading HDR texture:', error);
      },
    );

    return () => {
      if (scene.environment) {
        scene.environment.dispose();
        scene.environment = null;
      }
    };
  }, [gl, scene]);

  return null;
};

const Button3dWrapper: React.FC<Button3dWrapperProps> = ({
  onClick,
  text,
  className = '',
  viewState = 0,
}) => {
  const modelRef = useRef<THREE.Group>(null);

  // Animate rotation when viewState changes
  useEffect(() => {
    if (modelRef.current) {
      const targetRotationX = viewState === 0 ? 0 : -Math.PI; // 90deg to 270deg
      gsap.to(modelRef.current.rotation, {
        x: targetRotationX,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  }, [viewState]);

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <RendererConfig />
        <EnvironmentSetup />
        {/* Reduced supplemental lighting - HDR provides main IBL via scene.environment */}
        <ambientLight intensity={1} />
        <directionalLight position={[0, 0, 5]} intensity={1} />
        <Model ref={modelRef} scale={2.5} rotation={[0, 0, 0]} />
      </Canvas>
      {text && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-grid text-2xl font-bold text-white uppercase lg:text-4xl">
            {text}
          </span>
        </div>
      )}
    </div>
  );
};

export default Button3dWrapper;
