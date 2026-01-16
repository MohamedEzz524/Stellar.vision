import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const currentIndexRef = useRef(0);
  const isInViewRef = useRef(false);
  const hasMovedRef = useRef(false);
  const loadedCountRef = useRef(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [allVideosLoaded, setAllVideosLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  /* ----------------------------- Dimensions ----------------------------- */

  const getVideoWrapperDimensions = useCallback(() => {
    if (isLg) {
      return {
        width: Math.min(window.innerWidth * 0.23, 400),
        aspectRatio: 2 / 3.3,
      };
    }
    return {
      width: window.innerWidth * 0.9,
      aspectRatio: 2 / 2.5,
    };
  }, [isLg]);

  useEffect(() => {
    const update = () => {
      if (!videoWrapperRef.current) return;
      const { width, aspectRatio } = getVideoWrapperDimensions();
      videoWrapperRef.current.style.width = `${width}px`;
      videoWrapperRef.current.style.height = `${width / aspectRatio}px`;
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [getVideoWrapperDimensions]);

  /* ----------------------------- Initial Play ----------------------------- */

  const handleInitialPlay = useCallback(() => {
    if (hasUserStarted) return;

    setHasUserStarted(true);
    isInViewRef.current = true;

    const video = videoRefs.current[0];
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [hasUserStarted]);

  useEffect(() => {
    if (!allVideosLoaded || hasUserStarted) return;
    handleInitialPlay();
  }, [allVideosLoaded, hasUserStarted, handleInitialPlay]);

  /* ----------------------------- Unmute ----------------------------- */

  const handleUnmute = useCallback(() => {
    setIsMuted(false);
    const video = videoRefs.current[currentIndexRef.current];
    if (video) video.muted = false;
  }, []);

  /* ----------------------------- Navigation ----------------------------- */

  const animateTransition = useCallback(
    (direction: 'next' | 'prev', newIndex: number) => {
      if (isAnimating) return;

      const currentVideo = videoRefs.current[currentIndexRef.current];
      const nextVideo = videoRefs.current[newIndex];
      if (!currentVideo || !nextVideo) return;

      setIsAnimating(true);
      hasMovedRef.current = true;

      currentVideo.style.zIndex = '2';
      nextVideo.style.zIndex = '3';

      const fromTop = direction === 'next';

      gsap.set(nextVideo, {
        clipPath: hasMovedRef.current
          ? fromTop
            ? 'inset(0% 0% 100% 0%)'
            : 'inset(100% 0% 0% 0%)'
          : 'inset(0% 0% 0% 0%)',
      });

      const tl = gsap.timeline({
        onComplete: () => {
          currentVideo.pause();

          currentIndexRef.current = newIndex;
          setCurrentIndex(newIndex);

          nextVideo.muted = isMuted;
          nextVideo.play().catch(() => {});

          currentVideo.style.zIndex = '1';
          nextVideo.style.zIndex = '2';

          gsap.set(currentVideo, { clipPath: 'inset(0% 0% 0% 0%)' });
          gsap.set(nextVideo, { clipPath: 'inset(0% 0% 0% 0%)' });

          setIsAnimating(false);
        },
      });

      if (hasMovedRef.current) {
        tl.to(currentVideo, {
          clipPath: fromTop ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
          duration: 0.5,
          ease: 'power2.inOut',
        });

        tl.to(
          nextVideo,
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.5,
            ease: 'power2.inOut',
          },
          '-=0.5',
        );
      }
    },
    [isAnimating, isMuted],
  );

  const navigate = useCallback(
    (dir: 'next' | 'prev') => {
      if (!hasUserStarted) return;

      const idx = currentIndexRef.current;
      const newIndex =
        dir === 'next'
          ? (idx + 1) % TestimonialVideos.length
          : (idx - 1 + TestimonialVideos.length) % TestimonialVideos.length;

      animateTransition(dir, newIndex);
    },
    [animateTransition, hasUserStarted],
  );

  /* ----------------------------- Observer ----------------------------- */

  useEffect(() => {
    if (!hasUserStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;

        const video = videoRefs.current[currentIndexRef.current];
        if (!video) return;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );

    if (videoWrapperRef.current) observer.observe(videoWrapperRef.current);
    return () => observer.disconnect();
  }, [hasUserStarted]);

  /* ----------------------------- Navigation UI ----------------------------- */

  const navigationButtons = useMemo(
    () =>
      hasUserStarted && (
        <div className="testimonials-navigation-overlay">
          <div
            className="testimonials-nav-area testimonials-nav-left"
            onClick={() => navigate('prev')}
          >
            <img
              src={arrowRightIcon}
              className="testimonials-nav-arrow testimonials-nav-arrow-left"
              alt="left"
            />
          </div>
          <div
            className="testimonials-nav-area testimonials-nav-right"
            onClick={() => navigate('next')}
          >
            <img
              src={arrowRightIcon}
              className="testimonials-nav-arrow testimonials-nav-arrow-right"
              alt="right"
            />
          </div>
        </div>
      ),
    [navigate, hasUserStarted],
  );

  /* ----------------------------- Render ----------------------------- */

  return (
    <section className="testimonials-section">
      <div className="testimonials-container container">
        <div className="testimonials-projector-wrapper">
          {hasUserStarted && isMuted && (
            <button
              onClick={handleUnmute}
              className="absolute top-4 right-1/2 z-100 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
            >
              🔊
            </button>
          )}
          <img
            src={projectorImage}
            alt="pic"
            className="testimonials-projector-img testimonials-projector-left"
          />

          <div className="testimonials-video-container">
            <div
              ref={videoWrapperRef}
              className="testimonials-video-wrapper relative"
            >
              {TestimonialVideos.map((item, index) => (
                <video
                  key={item.id}
                  ref={(el) => {
                    videoRefs.current[index] = el;
                    return;
                  }}
                  className="testimonial-video"
                  src={item.video}
                  loop
                  playsInline
                  preload="auto"
                  muted={isMuted || index !== currentIndex}
                  onLoadedData={() => {
                    loadedCountRef.current += 1;
                    if (loadedCountRef.current === TestimonialVideos.length) {
                      setAllVideosLoaded(true);
                    }
                  }}
                  style={{
                    zIndex: index === currentIndex ? 2 : 1,
                    opacity: hasUserStarted ? 1 : 0,
                  }}
                />
              ))}
            </div>
          </div>

          <img
            src={projectorImage}
            className="testimonials-projector-img testimonials-projector-right"
            alt="pic"
          />
        </div>

        {navigationButtons}
      </div>
    </section>
  );
};

export default TestimonialsSection;
