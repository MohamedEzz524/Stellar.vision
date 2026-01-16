import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { TestimonialVideos } from '../constants';
import './TestimonialsSection.css';
import { useMediaQuery } from 'react-responsive';
import arrowRightIcon from '../assets/arrow-right.svg';
import projectorImage from '../assets/images/projector.webp';
import unmuteIcon from '../assets/volume-up.svg'; // Add a volume icon

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
  // Add a ref to track if user has interacted
  const userInteractedRef = useRef(false);
  // Add a ref to track if component is in viewport
  const isInViewRef = useRef(false);
  // Add state for muted status
  const [isMuted, setIsMuted] = useState(true);
  // Add state for showing unmute button
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);

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

  // Play active video - Enhanced version
  const playActiveVideo = useCallback(
    (index: number, forcePlay = false) => {
      const video = videoRefs.current[index];
      if (!video) return false;

      // If video is already playing, no need to do anything
      if (!video.paused && !forcePlay) return true;

      // Set muted state based on user interaction
      video.muted = isMuted && !userInteractedRef.current && !isLg;

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

              // If video is muted and we're on mobile, show unmute button
              if (video.muted && !isLg && !userInteractedRef.current) {
                setShowUnmuteButton(true);
              }

              return true;
            })
            .catch((error) => {
              console.warn(`Video ${index} autoplay failed:`, error);

              // If autoplay fails due to sound policy, try muted
              if (error.name === 'NotAllowedError' && !isLg) {
                console.log('Trying muted autoplay...');
                video.muted = true;
                return video
                  .play()
                  .then(() => {
                    setShowUnmuteButton(true);
                    return true;
                  })
                  .catch(() => false);
              }
              return false;
            });
        }
      }
      return false;
    },
    [isMuted, isLg],
  );

  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;

      // Update current video
      const currentVideo = videoRefs.current[currentIndexRef.current];
      if (currentVideo) {
        currentVideo.muted = newMuted;
      }

      // Mark user interaction
      userInteractedRef.current = true;
      setShowUnmuteButton(false);

      return newMuted;
    });
  }, []);

  // Manual play attempt (triggered by user interaction)
  const attemptManualPlay = useCallback(() => {
    userInteractedRef.current = true;
    setShowUnmuteButton(false);

    const activeVideo = videoRefs.current[currentIndexRef.current];
    if (activeVideo && activeVideo.paused) {
      // Try unmuted play on user interaction
      activeVideo.muted = false;
      activeVideo.play().catch((error) => {
        console.warn('Manual play failed:', error);
        // Fallback to muted
        activeVideo.muted = true;
        activeVideo.play().catch(() => {});
      });
    }
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

      // Set initial mute state
      const video = videoRefs.current[index];
      if (video) {
        video.muted = isMuted && !userInteractedRef.current && !isLg;
      }

      // If this is the current video and we're in view, try to play it
      if (index === currentIndexRef.current && isInViewRef.current) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          playActiveVideo(index, true);
        }, 100);
      }
    },
    [playActiveVideo, isMuted, isLg],
  );

  // Animation for switching videos
  const animateVideoTransition = useCallback(
    (direction: 'next' | 'prev', newIndex: number) => {
      if (isAnimating || !videoWrapperRef.current) return;

      setIsAnimating(true);
      const currentVideo = videoRefs.current[currentIndexRef.current];
      const nextVideo = videoRefs.current[newIndex];

      if (!currentVideo || !nextVideo) return;

      // Mark user interaction
      userInteractedRef.current = true;
      setShowUnmuteButton(false);

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

          // Set mute state for new video
          if (nextVideo) {
            // If user has interacted, use their preference, otherwise default
            nextVideo.muted = userInteractedRef.current
              ? isMuted
              : isMuted && !isLg;
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
      isMuted,
      isLg,
    ],
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
    loadVideoIfNeeded(0);
    currentIndexRef.current = 0;

    // Add a fallback to play the first video after a short delay
    const fallbackTimer = setTimeout(() => {
      if (isInViewRef.current && videoRefs.current[0]?.paused) {
        console.log('Fallback: attempting to play first video');
        playActiveVideo(0, true);
      }
    }, 1000);

    return () => clearTimeout(fallbackTimer);
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

  // Intersection observer to pause video when out of view
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
            // Play when in view - with better timing
            const activeIndex = currentIndexRef.current;
            const activeVideo = videoRefs.current[activeIndex];

            if (activeVideo && activeVideo.paused) {
              // Small delay to ensure video is ready
              setTimeout(() => {
                // Double-check we're still in view
                if (isInViewRef.current && activeVideo.paused) {
                  playActiveVideo(activeIndex, true);
                }
              }, 200);
            }
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

  // Add click handlers for user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      userInteractedRef.current = true;
      setShowUnmuteButton(false);

      // Try to play current video unmuted
      const currentVideo = videoRefs.current[currentIndexRef.current];
      if (currentVideo && currentVideo.paused) {
        currentVideo.muted = false;
        currentVideo.play().catch((error) => {
          // If unmuted play fails, try muted
          if (error.name === 'NotAllowedError') {
            currentVideo.muted = true;
            currentVideo.play().catch(() => {});
          }
        });
      }
    };

    const section = document.querySelector('.testimonials-section');
    if (section) {
      // Add multiple event types for better coverage
      section.addEventListener('click', handleUserInteraction);
      section.addEventListener('touchstart', handleUserInteraction, {
        passive: true,
      });
    }

    return () => {
      if (section) {
        section.removeEventListener('click', handleUserInteraction);
        section.removeEventListener('touchstart', handleUserInteraction);
      }
    };
  }, []);

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

  // Unmute button for mobile
  const unmuteButton = useMemo(() => {
    if (!showUnmuteButton || isLg) return null;

    return (
      <button
        className="testimonials-unmute-button"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        <img src={unmuteIcon} alt="Unmute" />
        <span>Tap to unmute</span>
      </button>
    );
  }, [showUnmuteButton, isMuted, isLg, toggleMute]);

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
              {unmuteButton}
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
