import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { TestimonialVideos } from '../constants';
import './TestimonialsSection.css';
import { useMediaQuery } from 'react-responsive';
import arrowRightIcon from '../assets/arrow-right.svg';

const TestimonialsSection = () => {
  const isLg = useMediaQuery({ minWidth: 1024 }); // Desktop breakpoint
  const sliderRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  // Start at middle card (for 5 slides, index 3)
  const [currentIndex, setCurrentIndex] = useState(
    Math.ceil(TestimonialVideos.length / 2),
  );
  const isAnimatingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const currentIndexRef = useRef(Math.ceil(TestimonialVideos.length / 2));
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculate card width and gap based on viewport width
  const getCardDimensions = useCallback(() => {
    const gap = !isLg ? 1.5 * 16 : 3 * 16; // Convert rem to px (1rem = 16px)

    // Card width is fixed at 55vw (55% of window width)
    const cardWidth = (window.innerWidth * 55) / 100;

    return { cardWidth, gap };
  }, [isLg]);

  // Calculate card height based on aspect ratio
  // Desktop: 1.7 aspect ratio (width/height = 1.7, so width > height)
  // Mobile: 2/3 aspect ratio (width/height = 2/3, so height > width)
  // On mobile, active card has slightly taller aspect ratio (10% taller)
  const getCardHeight = useCallback(
    (cardWidth: number, isActive: boolean = false) => {
      // Get base aspect ratio for mobile/desktop (width/height)
      const baseAspectRatio = isLg ? 1.7 : 2 / 3;
      // On mobile, active card is 10% taller (smaller aspect ratio means taller)
      const aspectRatio =
        !isLg && isActive ? baseAspectRatio / 1.1 : baseAspectRatio;
      // height = width / aspectRatio
      return cardWidth / aspectRatio;
    },
    [isLg],
  );

  // Calculate slider position to center a specific card index
  const getSliderPositionForCard = useCallback(
    (cardIndex: number) => {
      const { cardWidth, gap } = getCardDimensions();
      const viewportWidth = window.innerWidth;
      const centerX = viewportWidth / 2 - cardWidth / 2;
      const offset = cardWidth + gap;
      const totalCardsWidth =
        TestimonialVideos.length * cardWidth +
        (TestimonialVideos.length - 1) * gap;
      const containerOffset = (viewportWidth - totalCardsWidth) / 2;
      return centerX - containerOffset - cardIndex * offset;
    },
    [getCardDimensions],
  );

  // Initialize slider position and update card dimensions
  useEffect(() => {
    if (!sliderRef.current) return;

    const updateSlider = () => {
      const { cardWidth, gap } = getCardDimensions();

      // Update card dimensions and gaps first
      cardRefs.current.forEach((card, index) => {
        if (card) {
          const isActive = index === currentIndex;
          const cardHeightForThisCard = getCardHeight(cardWidth, isActive);
          card.style.width = `${cardWidth}px`;
          card.style.height = `${cardHeightForThisCard}px`;
          card.style.marginRight =
            index < TestimonialVideos.length - 1 ? `${gap}px` : '0';
        }
      });

      // Initialize slider position to center the middle card
      if (sliderRef.current && !isInitializedRef.current) {
        requestAnimationFrame(() => {
          if (sliderRef.current) {
            const middleIndex = Math.ceil(TestimonialVideos.length / 2);
            const startPosition = getSliderPositionForCard(middleIndex);
            gsap.set(sliderRef.current, {
              x: startPosition,
            });
            isInitializedRef.current = true;
            setCurrentIndex(middleIndex);
            currentIndexRef.current = middleIndex;
          }
        });
      }
    };

    updateSlider();
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [
    getSliderPositionForCard,
    getCardDimensions,
    getCardHeight,
    currentIndex,
    isLg,
  ]);

  // Update ref when currentIndex changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Handle navigation
  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (isAnimatingRef.current || !sliderRef.current) return;

      isAnimatingRef.current = true;

      // Calculate new index using ref to get latest value
      const currentIdx = currentIndexRef.current;
      const newIndex =
        direction === 'next'
          ? (currentIdx + 1) % TestimonialVideos.length
          : (currentIdx - 1 + TestimonialVideos.length) %
            TestimonialVideos.length;

      // Calculate target position
      const targetPosition = getSliderPositionForCard(newIndex);

      gsap.to(sliderRef.current, {
        x: targetPosition,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          isAnimatingRef.current = false;
          setCurrentIndex(newIndex);
        },
      });
    },
    [getSliderPositionForCard],
  );

  // Set up Intersection Observer to pause videos when out of view
  useEffect(() => {
    if (!videoRefs.current.length) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const videoIndex = videoRefs.current.indexOf(video);

          // If video is out of view (less than 50% visible), pause it
          if (entry.intersectionRatio < 0.5) {
            video.pause();
          } else if (videoIndex === currentIndex) {
            // If video is in view and is the active card, play it
            video.play().catch(() => {
              // Ignore play errors (e.g., autoplay restrictions)
            });
          }
        });
      },
      {
        threshold: [0, 0.5, 1], // Trigger at 0%, 50%, and 100% visibility
        rootMargin: '0px',
      },
    );

    // Observe all videos
    videoRefs.current.forEach((video) => {
      if (video) {
        observerRef.current?.observe(video);
      }
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentIndex]);

  // Play active video when currentIndex changes (if it's in view)
  useEffect(() => {
    const activeVideo = videoRefs.current[currentIndex];
    if (activeVideo) {
      // Check if video is in viewport before playing
      const rect = activeVideo.getBoundingClientRect();
      const isInView =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      if (isInView) {
        activeVideo.play().catch(() => {
          // Ignore play errors
        });
      }
    }
  }, [currentIndex]);

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-slider-wrapper">
          <div ref={sliderRef} className="testimonials-slider">
            {TestimonialVideos.map((testimonial, index) => {
              return (
                <div
                  key={`${testimonial.id}-${index}`}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  className="testimonial-card"
                >
                  <div className="testimonial-video-wrapper">
                    <video
                      ref={(el) => {
                        videoRefs.current[index] = el;
                      }}
                      className="testimonial-video"
                      src={testimonial.video}
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Click overlay for navigation */}
          <div className="testimonials-navigation-overlay">
            <div
              className="testimonials-nav-area testimonials-nav-left"
              onClick={() => navigate('prev')}
              aria-label="Previous testimonial"
            >
              <img
                src={arrowRightIcon}
                alt="Previous"
                className="testimonials-nav-arrow testimonials-nav-arrow-left relative -left-15"
              />
            </div>
            <div
              className="testimonials-nav-area testimonials-nav-right"
              onClick={() => navigate('next')}
              aria-label="Next testimonial"
            >
              <img
                src={arrowRightIcon}
                alt="Next"
                className="testimonials-nav-arrow testimonials-nav-arrow-right relative -right-15"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
