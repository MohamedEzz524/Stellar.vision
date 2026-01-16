import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { TestimonialVideos } from '../constants';
import './TestimonialsSection.css';
import { useMediaQuery } from 'react-responsive';
import arrowRightIcon from '../assets/arrow-right.svg';
import projectorImage from '../assets/images/projector.webp';

const TestimonialsSection = () => {
  const isLg = useMediaQuery({ minWidth: 1024 });
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(true);
  const currentIndexRef = useRef(0);
  const videoLoadedRef = useRef<boolean[]>(
    new Array(TestimonialVideos.length).fill(false),
  );
  const videoLoadingRef = useRef<boolean[]>(
    new Array(TestimonialVideos.length).fill(false),
  );
  const [videoLoadingStates, setVideoLoadingStates] = useState<boolean[]>(() =>
    new Array(TestimonialVideos.length).fill(false),
  );
  // Add a ref to track if observer has triggered at least once
  const observerTriggeredRef = useRef(false);
  // Add a ref to track if component is in viewport
  const isInViewRef = useRef(false);
  // Add a ref to track user interaction
  const userInteractedRef = useRef(false);

  // Video wrapper dimensions
  const getVideoWrapperDimensions = useCallback(() => {
    if (isLg) {
      return {
        width: Math.min(window.innerWidth * 0.23, 400), // 20% of viewport or max 800px
        aspectRatio: 2 / 3.3,
      };
    }
    return {
      width: window.innerWidth * 0.9, // 90% of viewport on mobile
      aspectRatio: 2 / 2.5,
    };
  }, [isLg]);

  // Load videos as needed
  const loadVideoIfNeeded = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (
      !video ||
      videoLoadedRef.current[index] ||
      videoLoadingRef.current[index]
    )
      return;

    videoLoadingRef.current[index] = true;
    setVideoLoadingStates((prev) => {
      const newStates = [...prev];
      newStates[index] = true;
      return newStates;
    });

    video.load();
  }, []);

  // Unmute all videos
  const unmuteAllVideos = useCallback(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = false;
      }
    });
    setShowUnmuteButton(false);
    userInteractedRef.current = true;
  }, []);

  // Play active video
  const playActiveVideo = useCallback((index: number, forcePlay = false) => {
    const video = videoRefs.current[index];
    if (!video) return false;

    // If video is already playing, no need to do anything
    if (!video.paused && !forcePlay) return true;

    // If video is loaded and ready
    if (
      videoLoadedRef.current[index] &&
      video.readyState >= 2 &&
      video.paused
    ) {
      const playPromise = video.play();

      if (playPromise !== undefined) {
        return playPromise
          .then(() => {
            console.log(`Video ${index} playing successfully`);
            return true;
          })
          .catch((error) => {
            console.warn(`Video ${index} autoplay failed:`, error);
            return false;
          });
      }
    }
    return false;
  }, []);

  // Pause all videos except current
  const pauseOtherVideos = useCallback((currentIndex: number) => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }, []);

  // Handle video loaded
  const handleVideoLoaded = useCallback(
    (index: number) => {
      videoLoadedRef.current[index] = true;
      videoLoadingRef.current[index] = false;
      setVideoLoadingStates((prev) => {
        const newStates = [...prev];
        newStates[index] = false;
        return newStates;
      });

      // If this is the current video and we're in view, try to play it
      if (index === currentIndexRef.current && isInViewRef.current) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          playActiveVideo(index, true);
        }, 100);
      }
    },
    [playActiveVideo],
  );

  // Animation for switching videos
  const animateVideoTransition = useCallback(
    (direction: 'next' | 'prev', newIndex: number) => {
      if (isAnimating || !videoWrapperRef.current) return;

      setIsAnimating(true);
      const currentVideo = videoRefs.current[currentIndexRef.current];
      const nextVideo = videoRefs.current[newIndex];

      if (!currentVideo || !nextVideo) return;

      // Initial z-index setup
      currentVideo.style.zIndex = '2';
      nextVideo.style.zIndex = '3';

      // Determine animation direction
      const fromTop = direction === 'next';
      const startClipPath = fromTop
        ? 'inset(0% 0% 100% 0%)' // Fully clipped from top
        : 'inset(100% 0% 0% 0%)'; // Fully clipped from bottom
      const endClipPath = 'inset(0% 0% 0% 0%)'; // Fully visible

      // Set initial state for next video
      gsap.set(nextVideo, {
        clipPath: startClipPath,
      });

      // Load next video if needed
      if (!videoLoadedRef.current[newIndex]) {
        loadVideoIfNeeded(newIndex);
      }

      // Animate transition
      const tl = gsap.timeline({
        onComplete: () => {
          // Update state
          currentIndexRef.current = newIndex;
          setCurrentIndex(newIndex);

          // Update z-indices
          currentVideo.style.zIndex = '1';
          nextVideo.style.zIndex = '2';

          // Hide unmute button if user has interacted
          if (!userInteractedRef.current) {
            userInteractedRef.current = true;
            setShowUnmuteButton(false);
          }

          // Play new video
          playActiveVideo(newIndex, true);
          pauseOtherVideos(newIndex);

          // Reset clipping
          gsap.set(currentVideo, { clipPath: 'inset(0% 0% 0% 0%)' });

          setIsAnimating(false);
        },
      });

      // Animate current video out and next video in
      tl.to(currentVideo, {
        clipPath: fromTop ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
        duration: 0.5,
        ease: 'power2.inOut',
      }).to(
        nextVideo,
        {
          clipPath: endClipPath,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        '-=0.5',
      ); // Overlap animations
    },
    [isAnimating, loadVideoIfNeeded, playActiveVideo, pauseOtherVideos],
  );

  // Navigation handler
  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (isAnimating) return;

      // Mark user interaction and hide unmute button
      if (!userInteractedRef.current) {
        userInteractedRef.current = true;
        setShowUnmuteButton(false);
      }

      const currentIdx = currentIndexRef.current;
      let newIndex: number;

      if (direction === 'next') {
        newIndex = (currentIdx + 1) % TestimonialVideos.length;
      } else {
        newIndex =
          (currentIdx - 1 + TestimonialVideos.length) %
          TestimonialVideos.length;
      }

      animateVideoTransition(direction, newIndex);
    },
    [isAnimating, animateVideoTransition],
  );

  // Initialize and load first video
  useEffect(() => {
    loadVideoIfNeeded(0);
    currentIndexRef.current = 0;

    // On mobile, show unmute button by default
    if (!isLg) {
      setShowUnmuteButton(true);
    }

    return () => {
      // Clean up videos
      videoRefs.current.forEach((video) => {
        if (video) {
          video.pause();
        }
      });
    };
  }, [loadVideoIfNeeded, isLg]);

  // Handle video wrapper resize
  useEffect(() => {
    const updateVideoWrapper = () => {
      if (!videoWrapperRef.current) return;

      const { width, aspectRatio } = getVideoWrapperDimensions();
      const height = width / aspectRatio;

      videoWrapperRef.current.style.width = `${width}px`;
      videoWrapperRef.current.style.height = `${height}px`;
    };

    updateVideoWrapper();
    window.addEventListener('resize', updateVideoWrapper);
    return () => window.removeEventListener('resize', updateVideoWrapper);
  }, [getVideoWrapperDimensions]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInViewRef.current = entry.isIntersecting;
          observerTriggeredRef.current = true;

          if (!entry.isIntersecting) {
            // Pause when out of view
            const activeVideo = videoRefs.current[currentIndexRef.current];
            if (activeVideo && !activeVideo.paused) {
              activeVideo.pause();
            }
          } else {
            // Play when in view
            const activeIndex = currentIndexRef.current;
            setTimeout(() => {
              if (isInViewRef.current) {
                playActiveVideo(activeIndex, true);
              }
            }, 200);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '50px',
      },
    );

    if (videoWrapperRef.current) {
      observer.observe(videoWrapperRef.current);
    }

    return () => observer.disconnect();
  }, [playActiveVideo]);

  // Add touch event listener for swipes
  useEffect(() => {
    if (!videoWrapperRef.current) return;

    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        // Hide unmute button on swipe
        if (!userInteractedRef.current) {
          userInteractedRef.current = true;
          setShowUnmuteButton(false);
        }

        if (swipeDistance > 0) {
          navigate('prev');
        } else {
          navigate('next');
        }
      }
    };

    const element = videoWrapperRef.current;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate]);

  // Unmute button component
  const unmuteButton = useMemo(
    () => (
      <div
        className="testimonials-unmute-button"
        onClick={unmuteAllVideos}
        title="Tap to unmute videos"
      >
        <svg
          className="testimonials-unmute-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>

        <span className="testimonials-unmute-text">Tap to unmute</span>
      </div>
    ),
    [unmuteAllVideos],
  );

  // Navigation buttons
  const navigationButtons = useMemo(
    () => (
      <div className="testimonials-navigation-overlay">
        {!isLg && showUnmuteButton && unmuteButton}
        <div
          className="testimonials-nav-area testimonials-nav-left"
          onClick={(e) => {
            e.stopPropagation();
            navigate('prev');
          }}
          aria-label="Previous testimonial"
        >
          <img
            src={arrowRightIcon}
            alt="Previous"
            className="testimonials-nav-arrow testimonials-nav-arrow-left"
          />
        </div>
        <div
          className="testimonials-nav-area testimonials-nav-right"
          onClick={(e) => {
            e.stopPropagation();
            navigate('next');
          }}
          aria-label="Next testimonial"
        >
          <img
            src={arrowRightIcon}
            alt="Next"
            className="testimonials-nav-arrow testimonials-nav-arrow-right"
          />
        </div>
      </div>
    ),
    [navigate, isLg, showUnmuteButton, unmuteButton],
  );

  return (
    <section className="testimonials-section">
      <div className="testimonials-container container">
        <div className="testimonials-projector-wrapper">
          {/* Left projector image */}
          <div className="testimonials-projector-side">
            <img
              src={projectorImage}
              alt="Projector"
              className="testimonials-projector-img testimonials-projector-left"
            />
          </div>

          {/* Center video wrapper */}
          <div className="testimonials-video-container">
            <div ref={videoWrapperRef} className="testimonials-video-wrapper">
              {TestimonialVideos.map((testimonial, index) => (
                <div key={testimonial.id} className="testimonial-video-item">
                  {videoLoadingStates[index] && (
                    <div className="testimonial-video-preloader">
                      <div className="testimonial-preloader-spinner"></div>
                    </div>
                  )}
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    className="testimonial-video"
                    src={testimonial.video}
                    loop
                    playsInline
                    preload="none"
                    muted={!isLg} // Initially muted on mobile
                    onLoadedData={() => handleVideoLoaded(index)}
                    onCanPlay={() => handleVideoLoaded(index)}
                    onError={() => {
                      videoLoadedRef.current[index] = true;
                      videoLoadingRef.current[index] = false;
                      setVideoLoadingStates((prev) => {
                        const newStates = [...prev];
                        newStates[index] = false;
                        return newStates;
                      });
                    }}
                    style={{
                      zIndex: index === currentIndex ? 2 : 1,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right projector image */}
          <div className="testimonials-projector-side">
            <img
              src={projectorImage}
              alt="Projector"
              className="testimonials-projector-img testimonials-projector-right"
            />
          </div>
        </div>

        {navigationButtons}
      </div>
    </section>
  );
};

export default TestimonialsSection;
