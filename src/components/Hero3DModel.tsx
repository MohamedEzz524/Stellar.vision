import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FlakesTexture } from '../assets/js/FlakesTexture';
import { gsap } from 'gsap';
import { registerModel3DRef, getModel3DRef } from '../utils/revealAnimation';
import starModelUrl from '../assets/models/star.obj?url';
import hdrTextureUrl from '../assets/texture/hdr.jpeg?url';

interface Hero3DModelProps {
  onModelReady?: (modelRef: React.RefObject<THREE.Group | null>) => void;
}

const StarModel = ({
  onModelReady,
}: {
  onModelReady?: (modelRef: React.RefObject<THREE.Group | null>) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const obj = useLoader(OBJLoader, starModelUrl);
  const { gl, scene } = useThree();
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);
  const [materialReady, setMaterialReady] = useState(false);

  // Load HDR texture and set as scene environment for IBL lighting
  useEffect(() => {
    const loader = new THREE.TextureLoader();

    loader.load(
      hdrTextureUrl,
      (texture: THREE.Texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.flipY = false;

        try {
          // Convert to PMREM for optimized IBL
          const pmremGenerator = new THREE.PMREMGenerator(gl);
          const envMapResult = pmremGenerator.fromEquirectangular(texture);
          const envMapTexture = envMapResult.texture;

          // Set as scene environment - provides IBL lighting to all materials
          scene.environment = envMapTexture;

          envMapResult.dispose();
          pmremGenerator.dispose();
          texture.dispose();

          setEnvMap(envMapTexture);
        } catch (pmremError) {
          console.warn(
            'PMREM conversion failed, using texture directly:',
            pmremError,
          );
          scene.environment = texture;
          setEnvMap(texture);
        }
      },
      undefined,
      (error: unknown) => {
        console.error('Error loading HDR texture:', error);
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

  // Generate flakes texture for material normal map
  const flakesTexture = useMemo(() => {
    const canvas = new FlakesTexture(512, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 6);
    return texture;
  }, []);

  // Apply metallic material to mesh when model and envMap are ready
  useEffect(() => {
    if (obj && groupRef.current && envMap && !materialReady) {
      const clonedObj = obj.clone();

      clonedObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshRef.current = child;

          // Metallic material: uses scene.environment for IBL automatically
          const ballMaterial = new THREE.MeshPhysicalMaterial({
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            metalness: 1.0,
            roughness: 0.15, // Allows IBL diffuse to show light/shadow variations
            color: 0xffffff,
            normalMap: flakesTexture,
            normalScale: new THREE.Vector2(0.15, 0.15),
            envMapIntensity: 25.0,
          });

          ballMaterial.needsUpdate = true;

          (child as THREE.Mesh).material = ballMaterial;
        }
      });

      groupRef.current.clear();
      groupRef.current.add(clonedObj);
      // Rotate to stand upright (initial state for GSAP animation)
      groupRef.current.rotation.set(-Math.PI / 2, 0, 0);
      groupRef.current.scale.set(0.2, 0.2, 0.5);

      setMaterialReady(true);
      registerModel3DRef(groupRef);
      window.dispatchEvent(new CustomEvent('model3DReady'));

      if (onModelReady) {
        onModelReady(groupRef);
      }
    }

    return () => {
      if (materialReady) {
        registerModel3DRef(undefined);
      }
      flakesTexture.dispose();
    };
  }, [obj, envMap, materialReady, flakesTexture, onModelReady, scene]);

  return <group ref={groupRef} />;
};

const Hero3DModel = ({ onModelReady }: Hero3DModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [shouldRenderCanvas, setShouldRenderCanvas] = useState(false);

  // Render Canvas when preloader button is clicked (gives time for model to load)
  useEffect(() => {
    const preloader = document.querySelector('.preloader-container');
    if (!preloader) {
      setShouldRenderCanvas(true);
      return;
    }

    const handleButtonClick = () => {
      setShouldRenderCanvas(true);
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          if (
            target.getAttribute('style')?.includes('opacity: 0') ||
            target.classList.contains('opacity-0')
          ) {
            handleButtonClick();
            observer.disconnect();
            return;
          }
        }
      }
    });

    const button = document.querySelector(
      '[data-v-a05bfe24] button, .preloader button',
    );
    if (button) {
      button.addEventListener('click', handleButtonClick, { once: true });
    }

    observer.observe(preloader, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
    });

    const fallbackTimer = setTimeout(() => {
      setShouldRenderCanvas(true);
      observer.disconnect();
    }, 10000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
      if (button) {
        button.removeEventListener('click', handleButtonClick);
      }
    };
  }, []);

  // Mouse interaction: rotate model based on cursor position (desktop only)
  useEffect(() => {
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

    let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
    let mouseLeaveHandler: ((e: MouseEvent) => void) | null = null;
    let heroSection: HTMLElement | null = null;
    let animationFrameId: number | null = null;
    let targetRotationX = -Math.PI / 2;
    let targetRotationY = -7 * (Math.PI / 180);

    const lerp = (start: number, end: number, factor: number): number => {
      return start + (end - start) * factor;
    };

    const handleRevealComplete = () => {
      if (!isDesktop()) {
        return;
      }

      heroSection = document.getElementById('hero-section');
      const modelRef = getModel3DRef();

      if (!heroSection || !modelRef?.current) {
        return;
      }

      const baseRotationY = -7 * (Math.PI / 180);
      const maxRotationY = 30 * (Math.PI / 180);
      const maxRotationX = 20 * (Math.PI / 180);
      const lerpFactor = 0.05;

      targetRotationX = -Math.PI / 2;
      targetRotationY = baseRotationY;

      const animate = () => {
        if (!modelRef?.current || !isDesktop()) {
          return;
        }
        modelRef.current.rotation.x = lerp(
          modelRef.current.rotation.x,
          targetRotationX,
          lerpFactor,
        );
        modelRef.current.rotation.y = lerp(
          modelRef.current.rotation.y,
          targetRotationY,
          lerpFactor,
        );
        animationFrameId = requestAnimationFrame(animate);
      };

      animate();

      mouseMoveHandler = (e: MouseEvent) => {
        if (!modelRef?.current || !isDesktop() || !heroSection) {
          return;
        }

        const rect = heroSection.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offsetX = e.clientX - centerX;
        const offsetY = e.clientY - centerY;
        const normalizedX = Math.max(
          -1,
          Math.min(1, offsetX / (rect.width / 2)),
        );
        const normalizedY = Math.max(
          -1,
          Math.min(1, offsetY / (rect.height / 2)),
        );

        targetRotationY = baseRotationY + normalizedX * maxRotationY;
        targetRotationX = -Math.PI / 2 - normalizedY * maxRotationX;
      };

      mouseLeaveHandler = () => {
        if (!modelRef?.current) {
          return;
        }
        targetRotationX = -Math.PI / 2;
        targetRotationY = baseRotationY;
      };

      heroSection.addEventListener('mousemove', mouseMoveHandler);
      heroSection.addEventListener('mouseleave', mouseLeaveHandler);
    };

    window.addEventListener(
      'revealAnimationComplete',
      handleRevealComplete as EventListener,
    );

    const handleResize = () => {
      if (!isDesktop() && mouseMoveHandler && heroSection) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }

        heroSection.removeEventListener('mousemove', mouseMoveHandler);
        if (mouseLeaveHandler) {
          heroSection.removeEventListener('mouseleave', mouseLeaveHandler);
        }
        mouseMoveHandler = null;
        mouseLeaveHandler = null;

        const modelRef = getModel3DRef();
        if (modelRef?.current) {
          const baseRotationY = -20 * (Math.PI / 180);
          gsap.to(modelRef.current.rotation, {
            x: -Math.PI / 2,
            y: baseRotationY,
            duration: 0.5,
            ease: 'power2.out',
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener(
        'revealAnimationComplete',
        handleRevealComplete as EventListener,
      );
      window.removeEventListener('resize', handleResize);

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (heroSection && mouseMoveHandler) {
        heroSection.removeEventListener('mousemove', mouseMoveHandler);
      }
      if (heroSection && mouseLeaveHandler) {
        heroSection.removeEventListener('mouseleave', mouseLeaveHandler);
      }
    };
  }, []);

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

  return (
    <div
      id="hero-image"
      className="absolute top-1/2 left-1/2 z-10 flex h-[150px] max-h-[500px] w-[120%] max-w-[390px] -translate-x-1/2 -translate-y-[10rem] items-center justify-center lg:h-[100%] lg:max-h-full lg:w-[80%] lg:max-w-full lg:-translate-y-1/2"
    >
      {shouldRenderCanvas && (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%', maxHeight: '100%' }}
        >
          <RendererConfig />
          {/* Supplemental lighting - HDR provides main IBL via scene.environment */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={2.0} />
          <directionalLight position={[-5, -5, -5]} intensity={1.0} />
          <directionalLight position={[0, 10, 0]} intensity={1.5} />
          <StarModel
            onModelReady={(ref) => {
              groupRef.current = ref.current;
              if (onModelReady) {
                onModelReady(groupRef);
              }
            }}
          />
        </Canvas>
      )}
    </div>
  );
};

export default Hero3DModel;
