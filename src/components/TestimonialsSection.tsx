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
  // Track if user has interacted (swiped or clicked)
  const hasUserInteractedRef = useRef(false);
  // Track if first video has been handled
  const firstVideoHandledRef = useRef(false);

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

  // Play active video with special handling for first video on mobile
  const playActiveVideo = useCallback(
    (index: number) => {
      const video = videoRefs.current[index];
      if (!video) return false;

      // If video is already playing, no need to do anything
      if (!video.paused) return true;

      // On mobile: if it's the first video and user hasn't interacted yet
      if (
        !isLg &&
        index === 0 &&
        !hasUserInteractedRef.current &&
        !firstVideoHandledRef.current
      ) {
        // Start muted for autoplay
        video.muted = true;
        firstVideoHandledRef.current = true;

        // Try to play muted first
        if (videoLoadedRef.current[index] && video.readyState >= 2) {
          video
            .play()
            .then(() => {
              console.log('First video playing muted');
              // After a short delay, try to unmute
              setTimeout(() => {
                video.muted = false;
                // Some browsers need play() again after unmuting
                if (video.paused) {
                  video.play().catch(() => {});
                }
              }, 500);
            })
            .catch(() => {
              // If muted play fails too, just wait for user interaction
              console.log('First video autoplay blocked');
            });
        }
        return false;
      }

      // For all other cases (desktop or after user interaction)
      if (!isLg && !hasUserInteractedRef.current) {
        video.muted = true; // Start muted on mobile
      } else {
        video.muted = false; // Desktop or after interaction
      }

      // Play the video
      if (videoLoadedRef.current[index] && video.readyState >= 2) {
        return video
          .play()
          .then(() => true)
          .catch(() => false);
      }

      return false;
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
  const handleVideoLoaded = useCallback((index: number) => {
    videoLoadedRef.current[index] = true;
    videoLoadingRef.current[index] = false;
    setVideoLoadingStates((prev) => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });

    // Don't auto-play first video on mobile in loaded handler
    // Let the intersection observer handle it
  }, []);

  // Animation for switching videos
  const animateVideoTransition = useCallback(
    (direction: 'next' | 'prev', newIndex: number) => {
      if (isAnimating || !videoWrapperRef.current) return;

      // Mark user interaction - this unlocks unmuted playback!
      hasUserInteractedRef.current = true;

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
        ? 'inset(0% 0% 100% 0%)'
        : 'inset(100% 0% 0% 0%)';
      const endClipPath = 'inset(0% 0% 0% 0%)';

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
      );
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
    loadVideoIfNeeded(0);
    currentIndexRef.current = 0;

    // Also add click handler to mark user interaction
    const handleUserInteraction = () => {
      hasUserInteractedRef.current = true;
      // Try to play current video unmuted
      const currentVideo = videoRefs.current[currentIndexRef.current];
      if (currentVideo && currentVideo.paused) {
        currentVideo.muted = false;
        currentVideo.play().catch(() => {});
      }
    };

    const section = document.querySelector('.testimonials-section');
    if (section) {
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

  // Intersection observer - with special handling for first video
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Component is in view
            const activeIndex = currentIndexRef.current;
            const activeVideo = videoRefs.current[activeIndex];

            if (activeVideo && activeVideo.paused) {
              // Special delay for mobile
              setTimeout(
                () => {
                  if (activeVideo.paused) {
                    playActiveVideo(activeIndex);
                  }
                },
                isLg ? 100 : 300,
              );
            }
          } else {
            // Component is out of view
            const activeVideo = videoRefs.current[currentIndexRef.current];
            if (activeVideo && !activeVideo.paused) {
              activeVideo.pause();
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '100px 0px',
      },
    );

    if (videoWrapperRef.current) {
      observer.observe(videoWrapperRef.current);
    }

    return () => observer.disconnect();
  }, [isLg, playActiveVideo]);

  // Special fix for first video on mobile
  useEffect(() => {
    if (isLg) return; // Desktop doesn't need this fix

    // Try a more aggressive approach for first video
    const tryFirstVideoPlay = () => {
      if (videoRefs.current[0] && videoRefs.current[0].paused) {
        console.log('Trying first video play...');

        // First, try muted
        videoRefs.current[0].muted = true;
        videoRefs.current[0]
          .play()
          .then(() => {
            console.log('First video playing muted');
            // Try to unmute after 1 second
            setTimeout(() => {
              videoRefs.current[0].muted = false;
              if (videoRefs.current[0].paused) {
                videoRefs.current[0].play().catch(() => {});
              }
            }, 1000);
          })
          .catch(() => {
            // If that fails, try one more time after 2 seconds
            setTimeout(() => {
              if (videoRefs.current[0] && videoRefs.current[0].paused) {
                videoRefs.current[0].play().catch(() => {});
              }
            }, 2000);
          });
      }
    };

    // Try after initial load
    const initialTimer = setTimeout(tryFirstVideoPlay, 1000);

    // Also try when component comes into view (fallback for observer issues)
    const scrollHandler = () => {
      if (videoWrapperRef.current) {
        const rect = videoWrapperRef.current.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInView && videoRefs.current[0]?.paused) {
          tryFirstVideoPlay();
        }
      }
    };

    window.addEventListener('scroll', scrollHandler);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('scroll', scrollHandler);
    };
  }, [isLg]);

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
                    // Don't use muted attribute here - we'll control it programmatically
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
