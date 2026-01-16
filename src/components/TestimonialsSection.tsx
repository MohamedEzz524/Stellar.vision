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
  // Add a ref to track manual play attempts
  const manualPlayAttemptedRef = useRef(false);
  // Add a ref to track if component is in viewport
  const isInViewRef = useRef(false);

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
        playPromise
          .then(() => {
            console.log(`Video ${index} playing successfully`);
            return true;
          })
          .catch((error) => {
            console.warn(`Video ${index} autoplay failed:`, error);
            // Try again with user gesture if on mobile
            if (!isLg && !manualPlayAttemptedRef.current) {
              // Store for manual playback attempt
              manualPlayAttemptedRef.current = true;
            }
            return false;
          });
      }
    }
    return false;
  }, [isLg]);

  // Manual play attempt (triggered by user interaction)
  const attemptManualPlay = useCallback(() => {
    if (manualPlayAttemptedRef.current) {
      const activeVideo = videoRefs.current[currentIndexRef.current];
      if (activeVideo && activeVideo.paused) {
        activeVideo.play().catch(() => {});
        manualPlayAttemptedRef.current = false;
      }
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

          // Play new video
          playActiveVideo(newIndex, true);
          pauseOtherVideos(newIndex);

          // Reset clipping
          gsap.set(currentVideo, { clipPath: 'inset(0% 0% 0% 0%)' });

          setIsAnimating(false);
          
          // Reset manual play attempt flag since user interacted
          manualPlayAttemptedRef.current = false;
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
      
      // Attempt manual play in case autoplay was blocked
      attemptManualPlay();

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
    [isAnimating, animateVideoTransition, attemptManualPlay],
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

  // Intersection observer to pause video when out of view - Fixed version
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
        rootMargin: '50px' // Add some margin to trigger earlier
      },
    );

    if (videoWrapperRef.current) {
      observer.observe(videoWrapperRef.current);
    }

    return () => observer.disconnect();
  }, [playActiveVideo]);

  // Add a click handler to the entire section for manual play
  useEffect(() => {
    const handleSectionClick = () => {
      if (manualPlayAttemptedRef.current && isInViewRef.current) {
        attemptManualPlay();
      }
    };

    const section = document.querySelector('.testimonials-section');
    if (section) {
      section.addEventListener('click', handleSectionClick);
    }

    return () => {
      if (section) {
        section.removeEventListener('click', handleSectionClick);
      }
    };
  }, [attemptManualPlay]);

  // Navigation buttons - Modified to ensure user interaction
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
                    muted={!isLg} // Mute on mobile to help autoplay
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