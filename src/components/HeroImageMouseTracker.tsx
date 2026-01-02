import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/**
 * Component that tracks mouse movement over hero section
 * and rotates the hero image to "look at" the cursor
 */
const HeroImageMouseTracker = () => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  // Listen for reveal animation completion
  useEffect(() => {
    const handleAnimationComplete = () => {
      setIsAnimationComplete(true);
    };

    window.addEventListener('revealAnimationComplete', handleAnimationComplete);

    return () => {
      window.removeEventListener(
        'revealAnimationComplete',
        handleAnimationComplete,
      );
    };
  }, []);

  useEffect(() => {
    if (!isAnimationComplete) return;

    // Get hero image element
    heroImageRef.current = document.getElementById(
      'hero-image',
    ) as HTMLDivElement;
    if (!heroImageRef.current || !overlayRef.current) return;

    const overlay = overlayRef.current;
    const heroImage = heroImageRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!heroImage) return;

        // Get hero image position and dimensions
        const rect = heroImage.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate mouse position relative to hero image center
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate rotation angles (limit to reasonable range, e.g., ±30 degrees)
        const maxRotation = 30;
        const rotationX = (mouseY / (rect.height / 2)) * maxRotation;
        const rotationY = (mouseX / (rect.width / 2)) * -maxRotation;

        // Smooth the rotation using lerp
        rotationRef.current.x += (rotationX - rotationRef.current.x) * 0.1;
        rotationRef.current.y += (rotationY - rotationRef.current.y) * 0.1;

        // Apply rotation using GSAP for smooth animation with 3D transforms
        gsap.to(heroImage, {
          rotationX: rotationRef.current.x,
          rotationY: rotationRef.current.y,
          duration: 0.3,
          ease: 'power1.out',
          force3D: true,
        });
      });
    };

    const handleMouseLeave = () => {
      if (!heroImage) return;

      // Reset rotation when mouse leaves
      rotationRef.current.x = 0;
      rotationRef.current.y = 0;

      gsap.to(heroImage, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: 'power2.out',
        force3D: true,
      });
    };

    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      overlay.removeEventListener('mousemove', handleMouseMove);
      overlay.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isAnimationComplete]);

  if (!isAnimationComplete) return null;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-auto absolute inset-0 z-10"
      aria-hidden="true"
    />
  );
};

export default HeroImageMouseTracker;
