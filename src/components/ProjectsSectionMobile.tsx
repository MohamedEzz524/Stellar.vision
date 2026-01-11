import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Project } from './ProjectsSection';
import './ProjectsSectionMobile.css';

gsap.registerPlugin(ScrollTrigger);

interface ProjectsSectionMobileProps {
  projects: Project[];
  sectionId?: string;
}

// Extended Line type with custom properties for animation paths
interface PathLine extends THREE.Line {
  curve?: THREE.CatmullRomCurve3;
  letterElements?: HTMLElement[];
}

// Constants for particle system
const PARTICLES_GRID_SIZE = 40; // 40x40 = 1600 particles per card
const MAX_SCATTER_DISTANCE = 10;

const ProjectsSectionMobile = ({
  projects,
  sectionId = 'works-mobile',
}: ProjectsSectionMobileProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const lettersRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cardsRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lettersSceneRef = useRef<THREE.Scene | null>(null);
  const cardsSceneRef = useRef<THREE.Scene | null>(null);
  const lettersCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cardsCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pathsRef = useRef<PathLine[]>([]);
  const letterPositionsRef = useRef<
    Map<
      HTMLElement,
      { current: { x: number; y: number }; target: { x: number; y: number } }
    >
  >(new Map());
  const cardsMeshesRef = useRef<THREE.Mesh[]>([]);
  const cardsParticlesRef = useRef<THREE.Points[]>([]);
  const cardTexturesRef = useRef<THREE.Texture[]>([]);
  const cardParticlePositionsRef = useRef<
    Array<{
      positions: THREE.BufferAttribute;
      originalPositions: Float32Array;
      scatterDirections: Float32Array;
      opacity: number;
    }>
  >([]);
  const animationFrameRef = useRef<number | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const updateCardsAnimationRef = useRef<((progress: number) => void) | null>(
    null,
  );
  const drawGridRef = useRef<((progress: number) => void) | null>(null);

  const lerp = (start: number, end: number, t: number) =>
    start + (end - start) * t;

  // Initialize Three.js scenes
  useEffect(() => {
    if (!sectionRef.current) return;

    const lettersScene = new THREE.Scene();
    const cardsScene = new THREE.Scene();
    lettersSceneRef.current = lettersScene;
    cardsSceneRef.current = cardsScene;

    const createCamera = () =>
      new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
      );

    const lettersCamera = createCamera();
    const cardsCamera = createCamera();
    lettersCameraRef.current = lettersCamera;
    cardsCameraRef.current = cardsCamera;

    const lettersRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    lettersRenderer.setSize(window.innerWidth, window.innerHeight);
    lettersRenderer.setClearColor(0x000000, 0);
    lettersRenderer.setPixelRatio(window.devicePixelRatio);
    lettersRenderer.domElement.id = 'letters-canvas';
    lettersRendererRef.current = lettersRenderer;

    const cardsRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    cardsRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cardsRenderer.setSize(window.innerWidth, window.innerHeight);
    cardsRenderer.setClearColor(0x000000, 0);
    cardsRenderer.domElement.id = 'cards-canvas';
    cardsRendererRef.current = cardsRenderer;

    sectionRef.current.appendChild(lettersRenderer.domElement);
    sectionRef.current.appendChild(cardsRenderer.domElement);

    [lettersCamera, cardsCamera].forEach((camera) => camera.position.setZ(20));

    // Create text animation paths
    const createTextAnimationPath = (yPos: number, amplitude: number) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        points.push(
          new THREE.Vector3(
            -25 + 50 * t,
            yPos + Math.sin(t * Math.PI) * -amplitude,
            (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * -5,
          ),
        );
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
        new THREE.LineBasicMaterial({ color: 0x000, linewidth: 1 }),
      ) as PathLine;
      line.curve = curve;
      return line;
    };

    const paths = [
      createTextAnimationPath(10, 2),
      createTextAnimationPath(3.5, 1),
      createTextAnimationPath(-3.5, -1),
      createTextAnimationPath(-10, -2),
    ];
    paths.forEach((line) => lettersScene.add(line));
    pathsRef.current = paths;

    // Create letter elements
    if (textContainerRef.current) {
      const letterPositions = new Map<
        HTMLElement,
        { current: { x: number; y: number }; target: { x: number; y: number } }
      >();
      paths.forEach((line, i) => {
        line.letterElements = Array.from({ length: 15 }, () => {
          const el = document.createElement('div');
          el.className = 'letter';
          el.textContent = ['W', 'O', 'R', 'K'][i];
          textContainerRef.current?.appendChild(el);
          letterPositions.set(el, {
            current: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
          });
          return el;
        });
      });
      letterPositionsRef.current = letterPositions;
    }

    return () => {
      lettersRenderer.dispose();
      cardsRenderer.dispose();
      lettersScene.clear();
      cardsScene.clear();
    };
  }, []);

  // Load images and create individual card meshes
  useEffect(() => {
    if (!projects || !projects.length || !cardsSceneRef.current) {
      console.warn('ProjectsSectionMobile: No projects data provided');
      return;
    }

    const loadImage = (url: string): Promise<THREE.Texture> =>
      new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
          url,
          (loadedTexture) => {
            Object.assign(loadedTexture, {
              generateMipmaps: true,
              minFilter: THREE.LinearMipmapLinearFilter,
              magFilter: THREE.LinearFilter,
              anisotropy:
                cardsRendererRef.current?.capabilities.getMaxAnisotropy() || 1,
            });
            resolve(loadedTexture);
          },
          undefined,
          (error) => {
            console.error('Error loading image:', url, error);
            reject(error);
          },
        );
      });

    // Load all project images
    const imagePromises = projects
      .filter((p) => p && p.image)
      .map((p) => loadImage(p.image));

    Promise.all(imagePromises).then((textures) => {
      cardTexturesRef.current = textures;
      const meshes: THREE.Mesh[] = [];
      const particles: THREE.Points[] = [];
      const particleData: Array<{
        positions: THREE.BufferAttribute;
        originalPositions: Float32Array;
        scatterDirections: Float32Array;
        opacity: number;
      }> = [];

      // Shader for texture-based particles
      const particleVertexShader = `
        attribute float opacity;
        varying float vOpacity;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 3.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `;

      const particleFragmentShader = `
        uniform sampler2D uTexture;
        varying float vOpacity;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(uTexture, vUv);
          color.a *= vOpacity;
          if (color.a < 0.01) discard;
          gl_FragColor = color;
        }
      `;

      // Create particle system for each card
      textures.forEach((texture) => {
        const cardWidth = 12;
        const cardHeight = 16;
        const image = texture.image;
        if (!(image instanceof HTMLImageElement)) return;
        const aspectRatio = image.width / image.height;
        const adjustedWidth =
          aspectRatio > cardWidth / cardHeight
            ? cardWidth
            : cardHeight * aspectRatio;
        const adjustedHeight =
          aspectRatio > cardWidth / cardHeight
            ? cardWidth / aspectRatio
            : cardHeight;

        // Create normal mesh for high-quality display
        const meshGeometry = new THREE.PlaneGeometry(
          adjustedWidth,
          adjustedHeight,
        );
        const meshMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1,
          depthTest: true,
          depthWrite: true,
        });
        const cardMesh = new THREE.Mesh(meshGeometry, meshMaterial);
        cardMesh.position.set(0, -12, 0);
        cardMesh.scale.set(0.8, 0.8, 1);
        cardMesh.rotation.set(0, 0, 0);
        cardMesh.visible = true;
        cardsSceneRef.current?.add(cardMesh);
        meshes.push(cardMesh);

        // Create grid of particles
        const particleCount = PARTICLES_GRID_SIZE * PARTICLES_GRID_SIZE;
        const positions = new Float32Array(particleCount * 3);
        const uvs = new Float32Array(particleCount * 2);
        const opacities = new Float32Array(particleCount);
        const scatterDirections = new Float32Array(particleCount * 3);

        // Generate particle grid
        const gridStepX = adjustedWidth / PARTICLES_GRID_SIZE;
        const gridStepY = adjustedHeight / PARTICLES_GRID_SIZE;
        const startX = -adjustedWidth / 2;
        const startY = adjustedHeight / 2;

        for (let i = 0; i < PARTICLES_GRID_SIZE; i++) {
          for (let j = 0; j < PARTICLES_GRID_SIZE; j++) {
            const index = i * PARTICLES_GRID_SIZE + j;
            const x = startX + j * gridStepX + gridStepX / 2;
            const y = startY - i * gridStepY - gridStepY / 2;

            positions[index * 3] = x;
            positions[index * 3 + 1] = y;
            positions[index * 3 + 2] = 0;

            // UV coordinates (flip V to match PlaneGeometry orientation)
            uvs[index * 2] = (j + 0.5) / PARTICLES_GRID_SIZE;
            uvs[index * 2 + 1] = 1.0 - (i + 0.5) / PARTICLES_GRID_SIZE;

            opacities[index] = 0;

            // Random scatter direction (spherical coordinates)
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI * 2;
            scatterDirections[index * 3] = Math.cos(angle1) * Math.sin(angle2);
            scatterDirections[index * 3 + 1] =
              Math.sin(angle1) * Math.sin(angle2);
            scatterDirections[index * 3 + 2] = Math.cos(angle2);
          }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(positions, 3),
        );
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setAttribute(
          'opacity',
          new THREE.BufferAttribute(opacities, 1),
        );

        const material = new THREE.ShaderMaterial({
          vertexShader: particleVertexShader,
          fragmentShader: particleFragmentShader,
          uniforms: {
            uTexture: { value: texture },
          },
          transparent: true,
          depthTest: true,
          depthWrite: false,
        });

        const points = new THREE.Points(geometry, material);
        // Start position: bottom center (below view)
        points.position.set(0, -12, 0);
        points.scale.set(0.8, 0.8, 1);
        points.rotation.set(0, 0, 0);
        points.visible = false; // Hidden initially, only show during scatter phase
        cardsSceneRef.current?.add(points);
        particles.push(points);

        // Store particle data for animation
        particleData.push({
          positions: geometry.attributes.position as THREE.BufferAttribute,
          originalPositions: new Float32Array(positions),
          scatterDirections,
          opacity: 0,
        });
      });

      cardsMeshesRef.current = meshes;
      cardsParticlesRef.current = particles;
      cardParticlePositionsRef.current = particleData;

      // Function to update card animations based on scroll progress
      const updateCardsAnimation = (scrollProgress: number) => {
        const numCards = meshes.length;
        if (numCards === 0) return;

        // Each card has: move phase (50%) + fade phase (50%)
        // Cards animate sequentially - next card starts only when previous finishes
        // Total progress per card: 50% move + 50% fade = 100%
        const movePhaseRatio = 0.5; // 50% of card's timeline to reach center
        const fadePhaseRatio = 0.5; // 50% of card's timeline to fade out at center
        const cardPhaseRatio = movePhaseRatio + fadePhaseRatio; // Total per card = 1.0
        const totalProgressNeeded = numCards * cardPhaseRatio;

        // Normalize progress to account for all cards
        const normalizedProgress = Math.min(
          scrollProgress * totalProgressNeeded,
          totalProgressNeeded,
        );

        meshes.forEach((mesh, index) => {
          const points = particles[index];
          const particleData = cardParticlePositionsRef.current[index];
          if (!particleData || !points) return;

          // Cards animate sequentially - no overlap
          // Card 0 starts at 0, finishes at 1.0
          // Card 1 starts at 1.0, finishes at 2.0
          // Card 2 starts at 2.0, finishes at 3.0
          const cardStartTime = index * cardPhaseRatio;
          const cardEndTime = cardStartTime + cardPhaseRatio; // When card finishes

          let localProgress = 0;
          if (
            normalizedProgress >= cardStartTime &&
            normalizedProgress <= cardEndTime
          ) {
            // Card is animating
            localProgress =
              (normalizedProgress - cardStartTime) / cardPhaseRatio;
          } else if (normalizedProgress > cardEndTime) {
            // Card animation finished
            localProgress = 1;
          }

          const positions = particleData.positions.array as Float32Array;
          const originalPositions = particleData.originalPositions;
          const scatterDirections = particleData.scatterDirections;
          const opacityAttribute = (
            points.geometry.attributes.opacity as THREE.BufferAttribute
          ).array as Float32Array;
          const particleCount = originalPositions.length / 3;
          const meshMaterial = mesh.material as THREE.MeshBasicMaterial;

          if (localProgress === 0) {
            // Before animation starts: hidden at bottom
            mesh.position.y = -12;
            mesh.scale.set(0.8, 0.8, 1);
            mesh.rotation.set(0, 0, 0);
            mesh.visible = true;
            meshMaterial.opacity = 1;
            points.visible = false;
            points.position.y = -12;
            points.scale.set(0.8, 0.8, 1);
            points.rotation.set(0, 0, 0);
            // Reset particles to original positions
            for (let i = 0; i < particleCount; i++) {
              positions[i * 3] = originalPositions[i * 3];
              positions[i * 3 + 1] = originalPositions[i * 3 + 1];
              positions[i * 3 + 2] = originalPositions[i * 3 + 2];
              opacityAttribute[i] = 0;
            }
            particleData.positions.needsUpdate = true;
            points.geometry.attributes.opacity.needsUpdate = true;
          } else if (localProgress <= movePhaseRatio) {
            // Moving phase: bottom to center with full opacity (use mesh for high quality)
            const moveProgress = localProgress / movePhaseRatio;
            mesh.position.y = lerp(-12, 0, moveProgress);
            mesh.scale.set(0.8, 0.8, 1);
            mesh.rotation.set(0, 0, 0);
            mesh.visible = true;
            meshMaterial.opacity = 1;
            points.visible = false;
            // Keep particles in original positions for when we switch
            for (let i = 0; i < particleCount; i++) {
              positions[i * 3] = originalPositions[i * 3];
              positions[i * 3 + 1] = originalPositions[i * 3 + 1];
              positions[i * 3 + 2] = originalPositions[i * 3 + 2];
              opacityAttribute[i] = 1;
            }
            particleData.positions.needsUpdate = true;
            points.geometry.attributes.opacity.needsUpdate = true;
          } else {
            // Fade phase: stay at center, switch to particles and scatter
            const fadeProgress =
              (localProgress - movePhaseRatio) / fadePhaseRatio;
            mesh.position.y = 0;
            mesh.scale.set(0.8, 0.8, 1);
            mesh.rotation.set(0, 0, 0);
            // Hide mesh, show particles
            mesh.visible = false;
            points.visible = true;
            points.position.y = 0;
            const scale = lerp(0.8, 0.3, fadeProgress);
            points.scale.set(scale, scale, 1);
            points.rotation.set(0, 0, 0);
            // Scatter particles outward
            const scatterAmount = fadeProgress * fadeProgress * fadeProgress; // Cubic for acceleration
            for (let i = 0; i < particleCount; i++) {
              const origX = originalPositions[i * 3];
              const origY = originalPositions[i * 3 + 1];
              const origZ = originalPositions[i * 3 + 2];
              const dirX = scatterDirections[i * 3];
              const dirY = scatterDirections[i * 3 + 1];
              const dirZ = scatterDirections[i * 3 + 2];
              // Scatter outward from original position
              positions[i * 3] =
                origX + dirX * MAX_SCATTER_DISTANCE * scatterAmount;
              positions[i * 3 + 1] =
                origY + dirY * MAX_SCATTER_DISTANCE * scatterAmount;
              positions[i * 3 + 2] =
                origZ + dirZ * MAX_SCATTER_DISTANCE * scatterAmount;
              opacityAttribute[i] = lerp(1, 0, fadeProgress);
            }
            particleData.positions.needsUpdate = true;
            points.geometry.attributes.opacity.needsUpdate = true;
          }
        });
      };

      updateCardsAnimationRef.current = updateCardsAnimation;

      // Initial state
      updateCardsAnimation(0);
    });

    return () => {
      // Cleanup
      cardsMeshesRef.current.forEach((mesh) => {
        cardsSceneRef.current?.remove(mesh);
        mesh.geometry.dispose();
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.map?.dispose();
        material.dispose();
      });
      cardsParticlesRef.current.forEach((points) => {
        cardsSceneRef.current?.remove(points);
        points.geometry.dispose();
        (
          points.material as THREE.ShaderMaterial
        ).uniforms.uTexture.value?.dispose();
        (points.material as THREE.ShaderMaterial).dispose();
      });
      cardsMeshesRef.current = [];
      cardsParticlesRef.current = [];
      cardParticlePositionsRef.current = [];
      cardTexturesRef.current.forEach((texture) => texture.dispose());
      cardTexturesRef.current = [];
      updateCardsAnimationRef.current = null;
    };
  }, [projects]);

  // Grid canvas setup
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas) return;

    const gridCtx = gridCanvas.getContext('2d');
    if (!gridCtx) return;

    const resizeGridCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      [gridCanvas.width, gridCanvas.height] = [
        window.innerWidth * dpr,
        window.innerHeight * dpr,
      ];
      [gridCanvas.style.width, gridCanvas.style.height] = [
        `${window.innerWidth}px`,
        `${window.innerHeight}px`,
      ];
      gridCtx.scale(dpr, dpr);
    };
    resizeGridCanvas();

    const drawGrid = (scrollProgress = 0) => {
      gridCtx.fillStyle = 'black';
      gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
      gridCtx.fillStyle = '#f40c3f';
      const [dotSize, spacing] = [0.75, 20];
      const [rows, cols] = [
        Math.ceil(gridCanvas.height / spacing),
        Math.ceil(gridCanvas.width / spacing) + 15,
      ];
      const offset = (scrollProgress * spacing * 10) % spacing;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          gridCtx.beginPath();
          gridCtx.arc(
            x * spacing - offset,
            y * spacing,
            dotSize,
            0,
            Math.PI * 2,
          );
          gridCtx.fill();
        }
      }
    };

    drawGridRef.current = drawGrid;
    drawGrid(0);

    const handleResize = () => {
      resizeGridCanvas();
      drawGrid(ScrollTrigger.getAll()[0]?.progress || 0);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const updateTargetPositions = (scrollProgress = 0) => {
      const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9];
      pathsRef.current.forEach((line, lineIndex) => {
        const letterElements = line.letterElements || [];
        letterElements.forEach((element: HTMLElement, i: number) => {
          const curve = line.curve;
          if (!curve || !lettersCameraRef.current) return;

          const point = curve.getPoint(
            (i / 14 + scrollProgress * lineSpeedMultipliers[lineIndex]) % 1,
          );
          const vector = point.clone().project(lettersCameraRef.current);
          const positions = letterPositionsRef.current.get(element);
          if (positions) {
            positions.target = {
              x: (-vector.x * 0.5 + 0.5) * window.innerWidth,
              y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
            };
          }
        });
      });
    };

    const updateLetterPositions = () => {
      letterPositionsRef.current.forEach((positions, element) => {
        const distX = positions.target.x - positions.current.x;
        if (Math.abs(distX) > window.innerWidth * 0.7) {
          [positions.current.x, positions.current.y] = [
            positions.target.x,
            positions.target.y,
          ];
        } else {
          positions.current.x = lerp(
            positions.current.x,
            positions.target.x,
            0.07,
          );
          positions.current.y = lerp(
            positions.current.y,
            positions.target.y,
            0.07,
          );
        }
        element.style.transform = `translate(-50%, -50%) translate3d(${positions.current.x}px, ${positions.current.y}px, 0px)`;
      });
    };

    const animate = () => {
      updateLetterPositions();
      if (
        lettersRendererRef.current &&
        lettersSceneRef.current &&
        lettersCameraRef.current
      ) {
        lettersRendererRef.current.render(
          lettersSceneRef.current,
          lettersCameraRef.current,
        );
      }
      if (
        cardsRendererRef.current &&
        cardsSceneRef.current &&
        cardsCameraRef.current
      ) {
        cardsRendererRef.current.render(
          cardsSceneRef.current,
          cardsCameraRef.current,
        );
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    updateTargetPositions(0);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ScrollTrigger setup
  useEffect(() => {
    if (!sectionRef.current) return;

    const scrollTrigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: () => `+=${Math.max(projects.length * 50, 100)}%`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        if (drawGridRef.current) {
          drawGridRef.current(progress);
        }
        if (updateCardsAnimationRef.current) {
          updateCardsAnimationRef.current(progress);
        }
        // Update letter positions
        const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9];
        pathsRef.current.forEach((line, lineIndex) => {
          const letterElements = line.letterElements || [];
          letterElements.forEach((element: HTMLElement, i: number) => {
            const curve = line.curve;
            if (!curve || !lettersCameraRef.current) return;

            const point = curve.getPoint(
              (i / 14 + progress * lineSpeedMultipliers[lineIndex]) % 1,
            );
            const vector = point.clone().project(lettersCameraRef.current);
            const positions = letterPositionsRef.current.get(element);
            if (positions) {
              positions.target = {
                x: (-vector.x * 0.5 + 0.5) * window.innerWidth,
                y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
              };
            }
          });
        });
      },
    });

    scrollTriggerRef.current = scrollTrigger;

    return () => {
      scrollTrigger.kill();
    };
  }, [projects.length]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const progress = ScrollTrigger.getAll()[0]?.progress || 0;
      if (drawGridRef.current) {
        drawGridRef.current(progress);
      }

      [lettersCameraRef.current, cardsCameraRef.current].forEach((camera) => {
        if (camera) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
        }
      });

      [lettersRendererRef.current, cardsRendererRef.current].forEach(
        (renderer) => {
          if (renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
          }
        },
      );

      if (cardsRendererRef.current) {
        cardsRendererRef.current.setPixelRatio(
          Math.min(window.devicePixelRatio, 2),
        );
      }

      // Update letter positions
      const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9];
      pathsRef.current.forEach((line, lineIndex) => {
        const letterElements = line.letterElements || [];
        letterElements.forEach((element: HTMLElement, i: number) => {
          const curve = line.curve;
          if (!curve || !lettersCameraRef.current) return;

          const point = curve.getPoint(
            (i / 14 + progress * lineSpeedMultipliers[lineIndex]) % 1,
          );
          const vector = point.clone().project(lettersCameraRef.current);
          const positions = letterPositionsRef.current.get(element);
          if (positions) {
            positions.target = {
              x: (-vector.x * 0.5 + 0.5) * window.innerWidth,
              y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
            };
          }
        });
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section id={sectionId} ref={sectionRef} className="work-section-mobile">
      <canvas ref={gridCanvasRef} id="grid-canvas" />
      <div ref={textContainerRef} className="text-container" />
    </section>
  );
};

export default ProjectsSectionMobile;
