import { useRef, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Mesh, Group } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import starModelUrl from '../assets/models/star.obj?url';
// import ikeaModelUrl from '../assets/models/ikea.obj?url';

gsap.registerPlugin(ScrollTrigger, SplitText);

interface Model3DProps {
  modelUrl: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onModelReady?: (ref: React.RefObject<Group | null>) => void;
}

const Model3D = ({
  modelUrl,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  onModelReady,
}: Model3DProps) => {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const obj = useLoader(OBJLoader, modelUrl);

  useEffect(() => {
    if (obj && groupRef.current) {
      const clonedObj = obj.clone();

      clonedObj.traverse((child) => {
        if (child instanceof Mesh) {
          meshRef.current = child;
        }
      });

      groupRef.current.clear();
      groupRef.current.add(clonedObj);

      groupRef.current.rotation.x = rotation[0];
      groupRef.current.rotation.y = rotation[1];
      groupRef.current.rotation.z = rotation[2];
      groupRef.current.scale.set(scale, scale, scale);
      groupRef.current.position.set(position[0], position[1], position[2]);

      if (onModelReady) {
        onModelReady(groupRef);
      }
    }
  }, [obj, position, rotation, scale, onModelReady]);

  return <group ref={groupRef} />;
};

interface ScrollTrigger3DSectionProps {
  texts?: string[];
  objectAnimationStartVh?: {
    row1?: number; // vh to scroll after pinning before row1 reaches end state, default 70vh
    row2?: number; // vh to scroll after pinning before row2 reaches end state, default 110vh
  };
}

const ScrollTrigger3DSection = ({
  texts = [],
  objectAnimationStartVh = {
    row1: 70, // Default 70vh
    row2: 180, // Default 110vh
  },
}: ScrollTrigger3DSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textTrackRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const objectRefs = useRef<Array<React.RefObject<Group | null>>>([]);
  const objectContainerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const splitInstancesRef = useRef<SplitText[]>([]);
  const textElementsRef = useRef<HTMLElement[]>([]);
  const lineElementsRef = useRef<HTMLElement[]>([]);

  // Initialize refs for 4 objects
  for (let i = 0; i < 4; i++) {
    if (!objectRefs.current[i]) {
      objectRefs.current[i] = { current: null };
    }
    objectContainerRefs.current[i] = null;
  }

  useEffect(() => {
    if (
      !sectionRef.current ||
      !textTrackRef.current ||
      !textContainerRef.current
    ) {
      return;
    }

    const section = sectionRef.current;
    const textTrack = textTrackRef.current;
    const textContainer = textContainerRef.current;

    // Split text into lines using SplitText
    const splitTextIntoLines = () => {
      // Clear previous split instances
      splitInstancesRef.current.forEach((split) => split.revert());
      splitInstancesRef.current = [];
      lineElementsRef.current = [];
      textElementsRef.current = [];

      // Get all text elements
      const textElements = textContainer.querySelectorAll(
        '[data-text-index]',
      ) as NodeListOf<HTMLElement>;

      textElements.forEach((textEl) => {
        textElementsRef.current.push(textEl);

        // Split text into lines
        const split = SplitText.create(textEl, {
          type: 'lines',
          linesClass: 'line',
        });

        splitInstancesRef.current.push(split);

        const lines = split.lines as HTMLElement[];

        // Set initial opacity to 0.3 for all lines
        lines.forEach((line) => {
          gsap.set(line, { opacity: 0.3 });
          lineElementsRef.current.push(line);
        });
      });
    };

    // Track height will be measured from actual content height (text is relative, not absolute)

    // Initial state:
    // Track: top 0%, translateY(150vh)
    // Row 1: top 110%
    // Row 2: top 170%
    gsap.set(textTrack, { top: '0%', y: '150vh', x: '0%' });

    // Set initial positions for object containers (relative to section height)
    // Row 1: top 110% of section height
    // Row 2: top 170% of section height
    const sectionHeight = section.offsetHeight;
    const row1InitialTop = (sectionHeight * 105) / 100; // 105% of section height
    const row2InitialTop = (sectionHeight * 170) / 100; // 170% of section height

    // Object 0: add static offset down by 200% of its height
    if (objectContainerRefs.current[0]) {
      const container0Height = objectContainerRefs.current[0].offsetHeight;
      const offset0 = (container0Height * 100) / 100; // 100% of height (down)
      gsap.set(objectContainerRefs.current[0], {
        top: `${row1InitialTop + offset0}px`,
        y: '0px',
      });
    }
    // Object 1: normal position
    if (objectContainerRefs.current[1]) {
      gsap.set(objectContainerRefs.current[1], {
        top: `${row1InitialTop}px`,
        y: '0px',
      });
    }
    // Object 2: normal position
    if (objectContainerRefs.current[2]) {
      gsap.set(objectContainerRefs.current[2], {
        top: `${row2InitialTop}px`,
        y: '0px',
      });
    }
    // Object 3: add static offset up by 150% of its height
    if (objectContainerRefs.current[3]) {
      const container3Height = objectContainerRefs.current[3].offsetHeight;
      const offset3 = (container3Height * -150) / 100; // -150% of height (up)
      gsap.set(objectContainerRefs.current[3], {
        top: `${row2InitialTop + offset3}px`,
        y: '0px',
      });
    }

    // Split text into lines after a short delay to ensure DOM is ready
    setTimeout(() => {
      splitTextIntoLines();
    }, 100);

    // Wait a bit for models to load, then setup ScrollTrigger
    const setupScrollTrigger = () => {
      // Check if all containers are available
      const allContainersReady = objectContainerRefs.current.every(
        (container) => container !== null,
      );

      if (!allContainersReady) {
        console.warn('Object containers not ready yet');
        return null;
      }

      // Measure actual track height from content (text is relative, not absolute)
      const trackHeight =
        textContainer.scrollHeight || textContainer.offsetHeight;

      // Single ScrollTrigger at top top
      // Initial state:
      // - Track: top 0%, translateY(150vh)
      // - Row 1: top 110%
      // - Row 2: top 170%
      // When pinned, animate:
      // - Track: from translateY(150vh) to translateY(-100% + 50vh)
      // - Row 1: from top 110% to top 0%
      // - Row 2: from top 170% to top -20%
      const scrollTrigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => {
          return `+=${trackHeight + window.innerHeight + 10}px`;
        },
        pin: section,
        pinSpacing: true,
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const vhToPx = (vh: number) => (vh * window.innerHeight) / 100;
          const trackStartY = vhToPx(150);
          const trackEndY = -trackHeight + vhToPx(50);
          const trackCurrentY =
            trackStartY + (trackEndY - trackStartY) * progress;
          gsap.set(textTrack, { y: `${trackCurrentY}px` });

          // Animate line opacity based on viewport position
          if (lineElementsRef.current.length > 0) {
            const viewportHeight = window.innerHeight;
            const viewportCenter = viewportHeight * 0.5; // Center of viewport

            lineElementsRef.current.forEach((line) => {
              const lineRect = line.getBoundingClientRect();
              const lineCenter = lineRect.top + lineRect.height * 0.5;

              // Calculate distance from line center to viewport center
              const distanceFromCenter = Math.abs(lineCenter - viewportCenter);

              // Calculate opacity based on proximity to viewport center
              // Lines closer to center have higher opacity
              // When line is at viewport center, opacity = 1
              // When line is far from center, opacity approaches 0.3
              const maxDistance = viewportHeight * 0.6; // Distance at which opacity starts to fade
              const opacityProgress = Math.max(
                0,
                Math.min(1, 1 - distanceFromCenter / maxDistance),
              );

              // Interpolate opacity from 0.3 to 1
              const opacity = 0 + opacityProgress; // 0.3 to 1.0

              gsap.set(line, { opacity });
            });
          }

          // Animate object containers (Row 1 and Row 2) during pinned scroll
          // Objects reach end state after objectAnimationStartVh (row1: 70vh, row2: 110vh) of scroll
          // Then continue to move back 20% of their path
          const sectionHeight = section.offsetHeight;
          const row1StartTop = (sectionHeight * 110) / 100;
          const row1EndTop = 0;
          const row1PathLength = row1StartTop - row1EndTop;
          const row1BackTop = row1EndTop + (row1PathLength * 20) / 100;

          const row2StartTop = (sectionHeight * 170) / 100;
          const row2EndTop = (sectionHeight * -20) / 100;
          const row2PathLength = row2StartTop - row2EndTop;
          const row2BackTop = row2EndTop + (row2PathLength * 20) / 100;

          // Calculate pixels scrolled after pinning using progress
          const totalScrollDistance = Number(self.end) - Number(self.start);
          const pixelsScrolled = progress * totalScrollDistance;

          // Convert vh to pixels for row1 and row2
          const row1StartPixels = vhToPx(objectAnimationStartVh.row1 ?? 70);
          const row2StartPixels = vhToPx(objectAnimationStartVh.row2 ?? 110);

          let row1CurrentTop: number;
          let row2CurrentTop: number;

          // Row 1 animation
          if (pixelsScrolled <= row1StartPixels) {
            // Phase 1: Move forward to end state
            const forwardProgress = pixelsScrolled / row1StartPixels;
            row1CurrentTop =
              row1StartTop + (row1EndTop - row1StartTop) * forwardProgress;
          } else {
            // Phase 2: Move back 40% of path
            const remainingPixels = pixelsScrolled - row1StartPixels;
            const remainingScrollDistance =
              totalScrollDistance - row1StartPixels;
            const backProgress = Math.min(
              1,
              remainingPixels / remainingScrollDistance,
            );
            row1CurrentTop =
              row1EndTop + (row1BackTop - row1EndTop) * backProgress;
          }

          // Row 2 animation
          if (pixelsScrolled <= row2StartPixels) {
            // Phase 1: Move forward to end state
            const forwardProgress = pixelsScrolled / row2StartPixels;
            row2CurrentTop =
              row2StartTop + (row2EndTop - row2StartTop) * forwardProgress;
          } else {
            // Phase 2: Move back 40% of path
            const remainingPixels = pixelsScrolled - row2StartPixels;
            const remainingScrollDistance =
              totalScrollDistance - row2StartPixels;
            const backProgress = Math.min(
              1,
              remainingPixels / remainingScrollDistance,
            );
            row2CurrentTop =
              row2EndTop + (row2BackTop - row2EndTop) * backProgress;
          }

          // Update object containers with top positioning (in pixels, relative to section)
          // Row 1 objects (indices 0 and 1)
          // Object 0: add static offset down by 200% of its height
          if (objectContainerRefs.current[0]) {
            const container0Height =
              objectContainerRefs.current[0].offsetHeight;
            const offset0 = (container0Height * 100) / 100; // 100% of height (down)
            gsap.set(objectContainerRefs.current[0], {
              top: `${row1CurrentTop + offset0}px`,
              y: '0px',
            });
          }
          // Object 1: normal position
          if (objectContainerRefs.current[1]) {
            gsap.set(objectContainerRefs.current[1], {
              top: `${row1CurrentTop}px`,
              y: '0px',
            });
          }

          // Row 2 objects (indices 2 and 3)
          // Object 2: normal position
          if (objectContainerRefs.current[2]) {
            gsap.set(objectContainerRefs.current[2], {
              top: `${row2CurrentTop}px`,
              y: '0px',
            });
          }
          // Object 3: add static offset up by 150% of its height
          if (objectContainerRefs.current[3]) {
            const container3Height =
              objectContainerRefs.current[3].offsetHeight;
            const offset3 = (container3Height * -150) / 100; // -150% of height (up)
            gsap.set(objectContainerRefs.current[3], {
              top: `${row2CurrentTop + offset3}px`,
              y: '0px',
            });
          }

          // Rotation: rotate on x and y axis (faster rotation)
          const rotationSpeed = 3; // Multiplier for rotation speed
          const maxRotationX = Math.PI; // 90 degrees
          const maxRotationY = Math.PI; // 90 degrees
          const rotationX = maxRotationX * progress * rotationSpeed;
          const rotationY = maxRotationY * progress * rotationSpeed;

          // Update each 3D object rotation only
          objectRefs.current.forEach((objRef) => {
            if (objRef.current) {
              // Rotate
              objRef.current.rotation.x = -Math.PI / 2 + rotationX; // Add base rotation
              objRef.current.rotation.y = rotationY;
              objRef.current.rotation.z = 0;
            }
          });
        },
      });

      // Refresh ScrollTrigger to ensure it calculates positions correctly
      ScrollTrigger.refresh();

      return scrollTrigger;
    };

    // Setup scroll trigger after a short delay to ensure models are loaded
    let scrollTrigger: ScrollTrigger | null = null;

    // Function to try setting up scroll trigger
    const trySetupScrollTrigger = () => {
      scrollTrigger = setupScrollTrigger();
      // If containers weren't ready, try again after a short delay
      if (!scrollTrigger) {
        setTimeout(trySetupScrollTrigger, 100);
      } else {
        // Refresh after successful setup
        ScrollTrigger.refresh();
      }
    };

    const timeoutId = setTimeout(trySetupScrollTrigger, 500);

    return () => {
      clearTimeout(timeoutId);
      if (scrollTrigger) {
        scrollTrigger.kill();
      }
      // Cleanup SplitText instances
      splitInstancesRef.current.forEach((split) => split.revert());
      splitInstancesRef.current = [];
      lineElementsRef.current = [];
      textElementsRef.current = [];
      // Also cleanup any ScrollTriggers attached to this section
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === section) {
          st.kill();
        }
      });
    };
  }, [texts, objectAnimationStartVh]);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden border-t-[40px] border-red-700"
    >
      {/* 3D Objects Container - Outside text track, relative to section */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Container with same max-width as text track for alignment */}
        <div className="relative mx-auto h-full max-w-[344px] lg:max-w-[1000px]">
          {/* Top Row - Left and Right */}
          {/* Left object - top row */}
          <div
            ref={(el) => {
              objectContainerRefs.current[0] = el;
            }}
            className="absolute left-0 z-[15] h-[120px] w-[120px] lg:h-[250px] lg:w-[250px]"
          >
            <Canvas
              camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 1000 }}
              gl={{ antialias: true, alpha: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <pointLight position={[-5, -5, -5]} intensity={0.5} />
              <Model3D
                modelUrl={starModelUrl}
                position={[0, 0, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={0.15}
                onModelReady={(ref) => {
                  objectRefs.current[0] = ref;
                }}
              />
            </Canvas>
          </div>

          {/* Right object - top row (different Y translation) */}
          <div
            ref={(el) => {
              objectContainerRefs.current[1] = el;
            }}
            className="absolute right-0 z-[15] h-[120px] w-[120px] lg:h-[150px] lg:w-[150px]"
          >
            <Canvas
              camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 1000 }}
              gl={{ antialias: true, alpha: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <pointLight position={[-5, -5, -5]} intensity={0.5} />
              <Model3D
                modelUrl={starModelUrl}
                position={[0, -2, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={0.15}
                onModelReady={(ref) => {
                  objectRefs.current[1] = ref;
                }}
              />
            </Canvas>
          </div>

          {/* Bottom Row - Left and Right (30vh below top row) */}
          {/* Left object - bottom row - shifted left, deeper z-axis */}
          <div
            ref={(el) => {
              objectContainerRefs.current[2] = el;
            }}
            className="absolute -left-[20px] z-[5] h-[120px] w-[120px] lg:-left-[75px] lg:h-[500px] lg:w-[500px]"
          >
            <Canvas
              camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 1000 }}
              gl={{ antialias: true, alpha: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <pointLight position={[-5, -5, -5]} intensity={0.5} />
              <Model3D
                modelUrl={starModelUrl}
                position={[0, 0, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={0.15}
                onModelReady={(ref) => {
                  objectRefs.current[2] = ref;
                }}
              />
            </Canvas>
          </div>

          {/* Right object - bottom row - shifted right, deeper z-axis */}
          <div
            ref={(el) => {
              objectContainerRefs.current[3] = el;
            }}
            className="absolute -right-[20px] z-[5] h-[120px] w-[120px] lg:-right-[75px] lg:h-[150px] lg:w-[150px]"
          >
            <Canvas
              camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 1000 }}
              gl={{ antialias: true, alpha: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <pointLight position={[-5, -5, -5]} intensity={0.5} />
              <Model3D
                modelUrl={starModelUrl}
                position={[0, -2, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={0.15}
                onModelReady={(ref) => {
                  objectRefs.current[3] = ref;
                }}
              />
            </Canvas>
          </div>
        </div>
      </div>

      {/* Text Wrapper Track */}
      <div
        ref={textTrackRef}
        className="font-grid relative z-20 mx-auto max-w-[344px] will-change-transform lg:max-w-[1000px]"
      >
        <div ref={textContainerRef} className="relative z-20">
          {texts.map((text, index) => (
            <div
              key={index}
              data-text-index={index}
              className="mb-8 text-center text-3xl leading-tight font-bold whitespace-pre-line text-white lg:mb-16 lg:text-6xl lg:leading-tight"
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrollTrigger3DSection;
