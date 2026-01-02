import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Register SplitText plugin
gsap.registerPlugin(SplitText);

interface AnimatedTextRotationProps {
  texts: string[];
  className?: string;
  initialDelay?: number;
}

const AnimatedTextRotation = ({
  texts,
  className = '',
  initialDelay = 1000,
}: AnimatedTextRotationProps) => {
  const textContainerRef = useRef<HTMLDivElement>(null);
  const currentTextIndex = useRef(0);
  const animationTimeline = useRef<gsap.core.Timeline | null>(null);
  const splitInstancesRef = useRef<SplitText[]>([]);

  useEffect(() => {
    if (!textContainerRef.current) return;

    const container = textContainerRef.current;
    let currentElement: HTMLDivElement | null = null;
    let currentSplit: SplitText | null = null;
    let nextElement: HTMLDivElement | null = null;
    let nextSplit: SplitText | null = null;

    const createTextElement = (
      text: string,
      isNext: boolean = false,
    ): { element: HTMLDivElement; split: SplitText } => {
      const div = document.createElement('div');
      div.className = 'absolute inset-0 text-right text-nowrap';
      div.style.visibility = isNext ? 'hidden' : 'visible';
      div.setAttribute('aria-label', text);
      div.textContent = text;

      container.appendChild(div);

      // Use SplitText to split into chars
      const split = SplitText.create(div, {
        type: 'chars',
        charsClass: 'char',
      });

      splitInstancesRef.current.push(split);

      const letterElements = Array.from(split.chars) as HTMLElement[];

      letterElements.forEach((span) => {
        span.style.display = 'inline-block';

        if (isNext) {
          // New text: start at 90deg from top
          span.style.transformOrigin = 'top';
          gsap.set(span, { rotationX: 90 });
        } else {
          // Current text: start normal
          span.style.transformOrigin = 'bottom';
          gsap.set(span, { rotationX: 0 });
        }
      });

      return { element: div, split };
    };

    const animateTextRotation = () => {
      if (!container) return;

      // Clean up orphaned elements
      container.querySelectorAll('div').forEach((el) => {
        if (el !== currentElement && el !== nextElement) {
          el.remove();
        }
      });

      const currentText = texts[currentTextIndex.current];
      const nextTextIndex = (currentTextIndex.current + 1) % texts.length;
      const nextText = texts[nextTextIndex];

      // Create current and next text elements
      if (!currentElement) {
        const currentResult = createTextElement(currentText, false);
        currentElement = currentResult.element;
        currentSplit = currentResult.split;
      } else {
        // Reset current element's letters to starting state (visible, ready to animate out)
        // This is needed when currentElement was previously nextElement
        currentElement.style.visibility = 'visible';

        // Verify SplitText chars are still valid in DOM
        const hasValidChars =
          currentSplit?.chars &&
          currentSplit.chars.length > 0 &&
          Array.from(currentSplit.chars).some((char) =>
            currentElement?.contains(char),
          );

        if (!hasValidChars) {
          // SplitText structure lost, recreate element
          const elementText =
            currentElement.getAttribute('aria-label') || currentText;

          // Clean up old split
          if (currentSplit) {
            const index = splitInstancesRef.current.indexOf(currentSplit);
            if (index > -1) splitInstancesRef.current.splice(index, 1);
            try {
              currentSplit.revert();
            } catch {
              // Already reverted, ignore
            }
          }

          currentElement.remove();
          const currentResult = createTextElement(elementText, false);
          currentElement = currentResult.element;
          currentSplit = currentResult.split;
        } else if (currentSplit) {
          // Reset letters to visible starting state
          const resetLetters = Array.from(currentSplit.chars) as HTMLElement[];
          resetLetters.forEach((span) => {
            span.style.display = 'inline-block';
            span.style.transformOrigin = 'bottom';
            gsap.killTweensOf(span);
            gsap.set(span, { rotationX: 0 });
          });
        }
      }
      const nextResult = createTextElement(nextText, true);
      nextElement = nextResult.element;
      nextSplit = nextResult.split;
      nextElement.style.visibility = 'visible';

      // Get letter elements directly from SplitText instances
      const currentLetters = Array.from(currentSplit!.chars) as HTMLElement[];
      const nextLetters = Array.from(nextSplit!.chars) as HTMLElement[];

      // Safety check: ensure we have valid letters
      if (currentLetters.length === 0 || nextLetters.length === 0) {
        console.warn('AnimatedTextRotation: No letters found to animate');
        return;
      }

      const staggerDelay = 0.1;
      const animationDuration = 0.6;

      // Calculate safe start time to avoid overlap between animations
      const letterCountDiff = currentLetters.length - nextLetters.length;
      const minSafeStartTime = Math.max(0, letterCountDiff * staggerDelay);
      const safeStartTime = minSafeStartTime + animationDuration;
      const tl = gsap.timeline({
        onComplete: () => {
          // Clean up old current element (keep next element for reuse)
          if (
            currentElement &&
            currentSplit &&
            currentElement !== nextElement
          ) {
            const index = splitInstancesRef.current.indexOf(currentSplit);
            if (index > -1) splitInstancesRef.current.splice(index, 1);
            currentSplit.revert();
            currentElement.remove();
          }

          // Move next to current for next cycle
          currentElement = nextElement;
          currentSplit = nextSplit;
          nextElement = null;
          nextSplit = null;
          currentTextIndex.current = nextTextIndex;

          setTimeout(() => animateTextRotation(), 500);
        },
      });

      // Animate current text out: rotate from bottom origin, 90deg, staggered
      tl.to(
        currentLetters,
        {
          rotationX: 90,
          transformOrigin: 'bottom',
          duration: animationDuration,
          stagger: staggerDelay,
          ease: 'power2.in',
        },
        0,
      );

      tl.to(
        nextLetters,
        {
          rotationX: 0,
          transformOrigin: 'top',
          duration: animationDuration,
          stagger: staggerDelay,
          ease: 'power2.out',
        },
        safeStartTime,
      );

      animationTimeline.current = tl;
    };

    // Initial setup: create first text
    const initialResult = createTextElement(texts[0], false);
    currentElement = initialResult.element;
    currentSplit = initialResult.split;

    // Start animation after a short delay
    const timeoutId = setTimeout(() => {
      animateTextRotation();
    }, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      if (animationTimeline.current) {
        animationTimeline.current.kill();
      }
      // Clean up SplitText instances
      splitInstancesRef.current.forEach((split) => split.revert());
      splitInstancesRef.current = [];

      // Clean up DOM elements
      container?.querySelectorAll('div').forEach((el) => el.remove());
    };
  }, [texts, initialDelay]);

  return (
    <div
      ref={textContainerRef}
      className={className}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    ></div>
  );
};

export default AnimatedTextRotation;
