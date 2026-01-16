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
  // Add a ref to track if user has interacted
  const userInteractedRef = useRef(false);
  // Add a ref to track intersection observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Add a ref to track if component is mounted
  const isMountedRef = useRef(false);

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

  // Play active video - Simplified version
  const playActiveVideo = useCallback(
    (index: number) => {
      const video = videoRefs.current[index];
      if (!video) return;

      // If video is already playing, no need to do anything
      if (!video.paused) return;

      // Set mute based on device and user interaction
      if (!isLg && !userInteractedRef.current) {
        video.muted = true; // Start muted on mobile for autoplay
      }

      // Check if video is loaded and ready
      if (videoLoadedRef.current[index] && video.readyState >= 2) {
        const playPromise = video.play();

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn(`Video ${index} play failed:`, error);

            // If unmuted play fails on mobile, try muted
            if (error.name === 'NotAllowedError' && !video.muted) {
              video.muted = true;
              video.play().catch(() => {});
            }
          });
        }
      }
    },
    [isLg],
  );

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

      // If this is the current video and component is in view, play it
      if (index === currentIndexRef.current && isMountedRef.current) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          playActiveVideo(index);
        }, 100);
      }
    },
    [playActiveVideo],
  );

  // Animation for switching videos
  const animateVideoTransition = useCallback(
    (direction: 'next' | 'prev', newIndex: number) => {
      if (isAnimating || !videoWrapperRef.current) return;

      // Mark user interaction
      userInteractedRef.current = true;

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

          // Set unmuted since user has interacted
          if (nextVideo) {
            nextVideo.muted = false;
          }

          // Play new video
          playActiveVideo(newIndex);
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
    isMountedRef.current = true;
    loadVideoIfNeeded(0);
    currentIndexRef.current = 0;

    // Add click handler to mark user interaction
    const handleUserInteraction = () => {
      userInteractedRef.current = true;

      // Try to play current video unmuted
      const currentVideo = videoRefs.current[currentIndexRef.current];
      if (currentVideo) {
        currentVideo.muted = false;
        if (currentVideo.paused) {
          currentVideo.play().catch(() => {});
        }
      }
    };

    const section = document.querySelector('.testimonials-section');
    if (section) {
      section.addEventListener('click', handleUserInteraction);
      section.addEventListener('touchstart', handleUserInteraction, {
        passive: true,
      });
    }

    // Initial play attempt after a short delay
    const initialPlayTimer = setTimeout(() => {
      if (isMountedRef.current && videoRefs.current[0]) {
        playActiveVideo(0);
      }
    }, 500);

    return () => {
      isMountedRef.current = false;
      if (section) {
        section.removeEventListener('click', handleUserInteraction);
        section.removeEventListener('touchstart', handleUserInteraction);
      }
      clearTimeout(initialPlayTimer);
    };
  }, [loadVideoIfNeeded, playActiveVideo]);

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

  // Improved intersection observer with better mobile support
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isMountedRef.current) {
        // When page becomes visible again, try to play current video
        const activeVideo = videoRefs.current[currentIndexRef.current];
        if (activeVideo && activeVideo.paused) {
          setTimeout(() => {
            playActiveVideo(currentIndexRef.current);
          }, 300);
        }
      }
    };

    // Create intersection observer with mobile-friendly settings
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Component is in view - play video
            const activeIndex = currentIndexRef.current;
            const activeVideo = videoRefs.current[activeIndex];

            if (activeVideo && activeVideo.paused) {
              // Add a small delay for mobile
              setTimeout(
                () => {
                  if (isMountedRef.current && activeVideo.paused) {
                    playActiveVideo(activeIndex);
                  }
                },
                isLg ? 0 : 200,
              ); // Longer delay on mobile
            }
          } else {
            // Component is out of view - pause video
            const activeVideo = videoRefs.current[currentIndexRef.current];
            if (activeVideo && !activeVideo.paused) {
              activeVideo.pause();
            }
          }
        });
      },
      {
        threshold: 0.3, // Lower threshold for better mobile detection
        rootMargin: '100px 0px 100px 0px', // Larger margin on mobile
      },
    );

    // Observe the video wrapper
    if (videoWrapperRef.current) {
      observerRef.current.observe(videoWrapperRef.current);
    }

    // Add visibility change listener for mobile
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLg, playActiveVideo]);

  // Add a periodic check for mobile to ensure video plays
  useEffect(() => {
    if (isLg) return; // Only for mobile

    const checkInterval = setInterval(() => {
      if (isMountedRef.current) {
        const activeVideo = videoRefs.current[currentIndexRef.current];
        const wrapper = videoWrapperRef.current;

        // Simple manual intersection check
        if (wrapper && activeVideo && activeVideo.paused) {
          const rect = wrapper.getBoundingClientRect();
          const isInView =
            rect.top < window.innerHeight * 0.8 &&
            rect.bottom > window.innerHeight * 0.2;

          if (isInView) {
            playActiveVideo(currentIndexRef.current);
          }
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(checkInterval);
  }, [isLg, playActiveVideo]);

  // Navigation buttons
  const navigationButtons = useMemo(
    () => (
      <div className="testimonials-navigation-overlay">
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
    [navigate],
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
