import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Model } from './Button3d';
import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { gsap } from 'gsap';
import hdrTextureUrl from '../assets/texture/citrus_orchard_road_puresky_1k.hdr?url';

// HDR rotation on Y-axis: 0.0 = 0°, 0.25 = 90°, 0.5 = 180°, 0.75 = 270°
const HDR_ROTATION_Y = 0.25; // Adjust this value to rotate the HDR environment

interface Button3dWrapperProps {
  onClick?: () => void;
  text?: string;
  className?: string;
  viewState?: number;
}

// Configure renderer: tone mapping and color encoding (same as star)
const RendererConfig = () => {
  const { gl } = useThree();
  useEffect(() => {
    // @ts-expect-error - outputEncoding exists in this version of Three.js
    gl.outputEncoding = THREE.sRGBEncoding;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.2; // Same as star
  }, [gl]);
  return null;
};

// Load HDR texture and set as scene environment (same as star)
const EnvironmentSetup = () => {
  const { gl, scene } = useThree();
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    console.log('Starting HDR load from:', hdrTextureUrl);
    const loader = new HDRLoader();

    loader.load(
      hdrTextureUrl,
      (texture: THREE.DataTexture) => {
        console.log('HDR texture loaded:', {
          width: texture.image?.width,
          height: texture.image?.height,
          type: texture.type,
          format: texture.format,
        });

        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.flipY = false;
        texture.wrapS = THREE.RepeatWrapping;
        texture.offset.x = HDR_ROTATION_Y; // Rotate HDR on Y-axis

        try {
          console.log('Converting to PMREM...');
          const pmremGenerator = new THREE.PMREMGenerator(gl);
          pmremGenerator.compileEquirectangularShader();
          const envMapResult = pmremGenerator.fromEquirectangular(texture);
          const envMapTexture = envMapResult.texture;

          console.log('PMREM conversion complete:', {
            envMapType: envMapTexture?.type,
            envMapFormat: envMapTexture?.format,
            hasImage: !!envMapTexture?.image,
          });

          scene.environment = envMapTexture;

          // Don't dispose envMapResult - it contains the texture we need
          // Only dispose the generator and original texture
          pmremGenerator.dispose();
          texture.dispose();

          setEnvMap(envMapTexture);
          console.log('HDR environment map loaded successfully', {
            hasEnvironment: !!scene.environment,
            envMapType: envMapTexture?.type,
            envMapFormat: envMapTexture?.format,
            sceneHasEnv: !!scene.environment,
          });
        } catch (pmremError) {
          console.error(
            'PMREM conversion failed, using texture directly:',
            pmremError,
          );
          scene.environment = texture;
          setEnvMap(texture);
        }
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log(
            'HDR loading progress:',
            percentComplete.toFixed(2) + '%',
          );
        }
      },
      (error: unknown) => {
        console.error('Error loading HDR texture:', error);
        console.error('HDR URL was:', hdrTextureUrl);
      },
    );
  }, [gl, scene]);

  // Cleanup: clear scene environment and dispose textures
  useEffect(() => {
    return () => {
      if (scene.environment === envMap) {
        scene.environment = null;
      }
      if (envMap) {
        envMap.dispose();
      }
    };
  }, [envMap, scene]);

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
      const targetRotationX = viewState === 0 ? Math.PI / 2 : (3 * Math.PI) / 2; // 90deg to 270deg
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
        {/* No lights - HDR provides main IBL via scene.environment (same as star) */}
        <Model ref={modelRef} scale={2.5} rotation={[Math.PI / 2, 0, 0]} />
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
