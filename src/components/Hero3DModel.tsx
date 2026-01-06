import { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Mesh, Group } from 'three';
import { gsap } from 'gsap';
import { registerModel3DRef, getModel3DRef } from '../utils/revealAnimation';
import starModelUrl from '../assets/models/star.obj?url';

interface Hero3DModelProps {
  onModelReady?: (modelRef: React.RefObject<Group | null>) => void;
}

const StarModel = ({
  onModelReady,
}: {
  onModelReady?: (modelRef: React.RefObject<Group | null>) => void;
}) => {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const obj = useLoader(OBJLoader, starModelUrl);

  useEffect(() => {
    if (obj && groupRef.current) {
      // Clone the object to avoid modifying the original
      const clonedObj = obj.clone();

      // Find the mesh in the object (for reference, but rotation will be on group)
      clonedObj.traverse((child) => {
        if (child instanceof Mesh) {
          meshRef.current = child;
        }
      });

      // Clear existing children and add cloned object
      groupRef.current.clear();
      groupRef.current.add(clonedObj);

      // Set initial rotation on the group to stand on ground (rotate 90 degrees on X axis)
      // The star is lying flat, so we rotate it to stand upright
      // state1 - Initial state (will be animated by GSAP)
      groupRef.current.rotation.x = -Math.PI / 2; // -90 degrees to stand on ground
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = 0;
      groupRef.current.scale.set(0.2, 0.2, 0.5); // state1 scale

      // Register ref for reveal animation
      registerModel3DRef(groupRef);

      // Dispatch event that model is ready
      window.dispatchEvent(new CustomEvent('model3DReady'));

      // Notify parent that model is ready
      if (onModelReady) {
        onModelReady(groupRef);
      }
    }

    return () => {
      // Cleanup: unregister ref when component unmounts
      registerModel3DRef(undefined);
    };
  }, [obj, onModelReady]);

  return <group ref={groupRef} />;
};

const Hero3DModel = ({ onModelReady }: Hero3DModelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<Group>(null);
  const [shouldRenderCanvas, setShouldRenderCanvas] = useState(false);

  // Render Canvas when button is clicked (before reveal starts)
  // This gives time for model to load before playRevealAnimation is called
  useEffect(() => {
    // Check if preloader exists
    const preloader = document.querySelector('.preloader-container');
    if (!preloader) {
      // No preloader, render immediately
      setShouldRenderCanvas(true);
      return;
    }

    // Listen for button click - render Canvas then to start loading model
    const handleButtonClick = () => {
      setShouldRenderCanvas(true);
    };

    // Watch for button click by observing when button becomes hidden
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          // Check if button is being hidden (clicked)
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

    // Also listen for click events on the button
    const button = document.querySelector(
      '[data-v-a05bfe24] button, .preloader button',
    );
    if (button) {
      button.addEventListener('click', handleButtonClick, { once: true });
    }

    // Observe preloader for button state changes
    observer.observe(preloader, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
    });

    // Fallback: render after a delay if preloader takes too long
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

  // Mouse interaction for 3D model (desktop only)
  useEffect(() => {
    // Only enable on desktop
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

    let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
    let mouseLeaveHandler: ((e: MouseEvent) => void) | null = null;
    let heroSection: HTMLElement | null = null;
    let animationFrameId: number | null = null;
    let targetRotationX = -Math.PI / 2;
    let targetRotationY = -7 * (Math.PI / 180);

    // Lerp function for smooth interpolation
    const lerp = (start: number, end: number, factor: number): number => {
      return start + (end - start) * factor;
    };

    // Wait for reveal animation to complete before enabling mouse interaction
    const handleRevealComplete = () => {
      if (!isDesktop()) {
        return;
      }

      heroSection = document.getElementById('hero-section');
      const modelRef = getModel3DRef();

      if (!heroSection || !modelRef?.current) {
        return;
      }

      // Initial rotation values (from reveal animation final state)
      const baseRotationY = -7 * (Math.PI / 180); // -7 degrees in radians (desktop)
      const maxRotationY = 30 * (Math.PI / 180); // ±30 degrees for more visible effect
      const maxRotationX = 20 * (Math.PI / 180); // ±20 degrees for more visible effect

      // Lerp factor (0-1) - lower value = smoother but slower
      const lerpFactor = 0.05;

      // Initialize target rotations
      targetRotationX = -Math.PI / 2;
      targetRotationY = baseRotationY;

      // Animation loop using requestAnimationFrame
      const animate = () => {
        if (!modelRef?.current || !isDesktop()) {
          return;
        }

        // Lerp current rotation towards target
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

      // Start animation loop
      animate();

      mouseMoveHandler = (e: MouseEvent) => {
        if (!modelRef?.current || !isDesktop() || !heroSection) {
          return;
        }

        const rect = heroSection.getBoundingClientRect();
        // Calculate center of hero section
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate offset from center to cursor
        const offsetX = e.clientX - centerX;
        const offsetY = e.clientY - centerY;
        
        // Normalize to -1 to 1 range based on distance from center
        const normalizedX = Math.max(-1, Math.min(1, (offsetX / (rect.width / 2))));
        const normalizedY = Math.max(-1, Math.min(1, (offsetY / (rect.height / 2))));

        // Calculate target rotations - model looks at cursor
        // Y rotation: left/right looking (horizontal angle)
        targetRotationY = baseRotationY + normalizedX * maxRotationY;
        // X rotation: up/down looking (vertical angle) - inverted Y
        targetRotationX = -Math.PI / 2 - normalizedY * maxRotationX;
      };

      mouseLeaveHandler = () => {
        if (!modelRef?.current) {
          return;
        }

        // Return to base rotation (lerp will handle the smooth transition)
        targetRotationX = -Math.PI / 2;
        targetRotationY = baseRotationY;
      };

      heroSection.addEventListener('mousemove', mouseMoveHandler);
      heroSection.addEventListener('mouseleave', mouseLeaveHandler);
    };

    window.addEventListener('revealAnimationComplete', handleRevealComplete as EventListener);

    // Handle resize to mobile - cleanup if switching to mobile
    const handleResize = () => {
      if (!isDesktop() && mouseMoveHandler && heroSection) {
        // Stop animation loop
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

        // Reset rotation when switching to mobile
        const modelRef = getModel3DRef();
        if (modelRef?.current) {
          const baseRotationY = -20 * (Math.PI / 180); // Mobile base rotation
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
      window.removeEventListener('revealAnimationComplete', handleRevealComplete as EventListener);
      window.removeEventListener('resize', handleResize);

      // Stop animation loop
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // Cleanup mouse handlers if they exist
      if (heroSection && mouseMoveHandler) {
        heroSection.removeEventListener('mousemove', mouseMoveHandler);
      }
      if (heroSection && mouseLeaveHandler) {
        heroSection.removeEventListener('mouseleave', mouseLeaveHandler);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="hero-image"
      className="absolute top-1/2 left-1/2 z-10 lg:h-[100%] flex items-center justify-center h-[150px] max-h-[500px] max-w-[390px] w-[120%] lg:w-[80%] -translate-x-1/2 -translate-y-[10rem] lg:max-h-full lg:max-w-full lg:-translate-y-1/2"
    >
      {shouldRenderCanvas && (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%', maxHeight: '100%' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />
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
