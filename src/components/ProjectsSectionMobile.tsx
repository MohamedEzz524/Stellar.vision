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
  const cardsTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const textureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardsPlaneRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const drawCardsOnCanvasRef = useRef<((offset: number) => void) | null>(null);
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

  // Load images and create cards texture
  useEffect(() => {
    if (!projects || !projects.length) {
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
      const textureCanvas = document.createElement('canvas');
      const ctx = textureCanvas.getContext('2d');
      if (!ctx) return;

      [textureCanvas.width, textureCanvas.height] = [4096, 2048];
      textureCanvasRef.current = textureCanvas;

      const drawCardsOnCanvas = (offset = 0) => {
        ctx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
        const [cardWidth, cardHeight] = [
          textureCanvas.width / 3,
          textureCanvas.height / 2,
        ];
        const spacing = textureCanvas.width / 2.5;
        textures.forEach((img, i) => {
          if (img?.image && img.image instanceof HTMLImageElement) {
            try {
              ctx.drawImage(
                img.image,
                i * spacing +
                  (0.35 - offset) * textureCanvas.width * 5 -
                  cardWidth,
                (textureCanvas.height - cardHeight) / 2,
                cardWidth,
                cardHeight,
              );
            } catch (error) {
              console.error(`Error drawing image ${i}:`, error);
            }
          }
        });
      };

      const cardsTexture = new THREE.CanvasTexture(textureCanvas);
      Object.assign(cardsTexture, {
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        anisotropy:
          cardsRendererRef.current?.capabilities.getMaxAnisotropy() || 1,
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
      });
      cardsTextureRef.current = cardsTexture;

      if (cardsSceneRef.current) {
        const cardsPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(30, 15, 50, 1),
          new THREE.MeshBasicMaterial({
            map: cardsTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1,
            depthTest: false,
            depthWrite: false,
          }),
        );
        cardsSceneRef.current.add(cardsPlane);
        cardsPlaneRef.current = cardsPlane;

        const positions = cardsPlane.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          positions.setZ(i, Math.pow(positions.getX(i) / 15, 2) * 5);
        }
        positions.needsUpdate = true;
      }

      // Initial draw
      drawCardsOnCanvas(0);

      // Store draw function for ScrollTrigger
      drawCardsOnCanvasRef.current = drawCardsOnCanvas;
    });

    return () => {
      drawCardsOnCanvasRef.current = null;
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
      end: '+=700%',
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        if (drawGridRef.current) {
          drawGridRef.current(progress);
        }
        if (drawCardsOnCanvasRef.current && cardsTextureRef.current) {
          drawCardsOnCanvasRef.current(progress);
          cardsTextureRef.current.needsUpdate = true;
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
  }, []);

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
