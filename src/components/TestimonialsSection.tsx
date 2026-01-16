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
  // Add a ref to track if observer has triggered at least once
  const observerTriggeredRef = useRef(false);
  // Add a ref to track if auto-swipe has been performed
  const autoSwipePerformedRef = useRef(false);
  // Add a ref to track if component is in viewport
  const isInViewRef = useRef(false);
  // Add a ref to track unmuted state
  const isUnmutedRef = useRef(false);

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

  // Play active video - Enhanced version with unmuted support
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

  // Unmute all videos (call this after user interaction)
  const unmuteAllVideos = useCallback(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = false;
      }
    });
    isUnmutedRef.current = true;
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
    (direction: 'next' | 'prev', newIndex: number, isAutoSwipe = false) => {
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

          // Unmute all videos if this is an auto-swipe
          if (isAutoSwipe) {
            unmuteAllVideos();
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
    [
      isAnimating,
      loadVideoIfNeeded,
      playActiveVideo,
      pauseOtherVideos,
      unmuteAllVideos,
    ],
  );

  // Perform an automatic swipe to trigger user interaction
  const performAutoSwipe = useCallback(() => {
    if (autoSwipePerformedRef.current || isAnimating) return;

    console.log('Performing auto-swipe to enable unmuted playback');
    autoSwipePerformedRef.current = true;

    // Trigger a small swipe animation that doesn't change the current video
    // We'll animate to the same index but with the animation
    if (!videoWrapperRef.current) return;

    setIsAnimating(true);

    // Create a temporary fake animation that simulates a swipe
    // This will be enough to count as user interaction
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.width = '1px';
    tempDiv.style.height = '1px';
    tempDiv.style.opacity = '0';
    videoWrapperRef.current.appendChild(tempDiv);

    // Animate the temp div (this counts as user interaction for browsers)
    gsap.to(tempDiv, {
      x: 1,
      duration: 0.1,
      onComplete: () => {
        // Now unmute all videos
        unmuteAllVideos();

        // Try to play the current video unmuted
        const currentIdx = currentIndexRef.current;
        const currentVideo = videoRefs.current[currentIdx];

        if (currentVideo && currentVideo.paused) {
          currentVideo
            .play()
            .then(() => {
              console.log('Video playing unmuted after auto-swipe');
            })
            .catch((err) => {
              console.warn('Failed to play unmuted after auto-swipe:', err);
            });
        }

        // Clean up
        if (
          videoWrapperRef.current &&
          videoWrapperRef.current.contains(tempDiv)
        ) {
          videoWrapperRef.current.removeChild(tempDiv);
        }

        setIsAnimating(false);

        // Now perform an actual swipe to next video (optional)
        // This gives visual feedback that something happened
        setTimeout(() => {
          const newIndex = (currentIdx + 1) % TestimonialVideos.length;
          animateVideoTransition('next', newIndex, true);
        }, 300);
      },
    });
  }, [isAnimating, animateVideoTransition, unmuteAllVideos]);

  // Navigation handler
  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (isAnimating) return;

      // Ensure videos are unmuted on first navigation
      if (!isUnmutedRef.current) {
        unmuteAllVideos();
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

      animateVideoTransition(direction, newIndex, false);
    },
    [isAnimating, animateVideoTransition, unmuteAllVideos],
  );

  // Initialize and load first video
  useEffect(() => {
    loadVideoIfNeeded(0);
    currentIndexRef.current = 0;

    return () => {
      // Clean up videos
      videoRefs.current.forEach((video) => {
        if (video) {
          video.pause();
        }
      });
    };
  }, [loadVideoIfNeeded]);

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

  // Intersection observer to handle auto-swipe when in view
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
            // When coming into view, perform auto-swipe on mobile to enable unmuted playback
            if (!isLg && !autoSwipePerformedRef.current) {
              // Small delay to ensure everything is loaded
              setTimeout(() => {
                performAutoSwipe();
              }, 500);
            } else {
              // Just try to play the current video
              const activeIndex = currentIndexRef.current;
              setTimeout(() => {
                if (isInViewRef.current) {
                  playActiveVideo(activeIndex, true);
                }
              }, 200);
            }
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '100px', // Larger margin to trigger earlier
      },
    );

    if (videoWrapperRef.current) {
      observer.observe(videoWrapperRef.current);
    }

    return () => observer.disconnect();
  }, [isLg, performAutoSwipe, playActiveVideo]);

  // Add touch event listener for manual swipes
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
