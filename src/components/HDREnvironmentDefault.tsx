import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import hdrTextureUrl from '../assets/texture/vertopal.com_360_F_273357547_Ic0xehzpiQgKdGqsyaDFo8jcJtUnMGnU.hdr?url';

// HDR rotation on Y-axis: 0.0 = 0°, 0.25 = 90°, 0.5 = 180°, 0.75 = 270°
const HDR_ROTATION_Y = 0.25; // Adjust this value to rotate the HDR environment horizontally
// HDR rotation on X-axis: 0.0 = 0°, 0.25 = 90°, 0.5 = 180°, 0.75 = 270°
const HDR_ROTATION_X = 0.0; // Adjust this value to rotate the HDR environment vertically

interface HDREnvironmentProps {
  hdrUrl?: string;
  rotationY?: number;
  rotationX?: number;
  intensity?: number; // Intensity multiplier for regular images (default: 1.0, can be increased for more "emission")
}

/**
 * HDR Environment Component
 * Loads and sets up HDR environment map for IBL lighting
 * Add this component inside any Canvas to provide HDR lighting
 */
export const HDREnvironment = ({
  hdrUrl = hdrTextureUrl,
  rotationY = HDR_ROTATION_Y,
  rotationX = HDR_ROTATION_X,
  intensity = 2.0,
}: HDREnvironmentProps) => {
  const { gl, scene } = useThree();
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    console.log('Starting HDR load from:', hdrUrl);
    const loader = new HDRLoader();

    loader.load(
      hdrUrl,
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
        texture.wrapT = THREE.RepeatWrapping;

        // Apply rotation: offset.x rotates around Y-axis (horizontal), offset.y rotates around X-axis (vertical)
        texture.offset.x = rotationY;
        texture.offset.y = rotationX;

        try {
          // Convert to PMREM for optimized IBL - this is crucial for proper lighting
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

          // Set as scene environment - provides IBL lighting to all materials
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
          // Rotation already applied above
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
        console.error('HDR URL was:', hdrUrl);
      },
    );
  }, [gl, scene, hdrUrl, rotationY, rotationX, intensity]);

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
