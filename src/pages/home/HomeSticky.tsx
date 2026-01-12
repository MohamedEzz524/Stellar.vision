import { useMediaQuery } from 'react-responsive';
import cornerSvg from '../../assets/corner.svg';
import logoImg from '../../assets/images/logo.png';
import noiseImg from '../../assets/images/noise.webp';
import globalImage from '../../assets/images/global.webp';
import ScrollProgress from '../../components/ScrollProgress';
import Calendar from '../../components/Calendar';
import { autoRotateTexts } from '../../constants';

const HomeSticky = () => {
  // Responsive fade distance: 90px for xl screens (≥1280px), 70px for lg screens (≥1024px)
  const isXl = useMediaQuery({ minWidth: 1280 }); // Tailwind xl breakpoint
  const isLg = useMediaQuery({ minWidth: 1024 }); // Tailwind lg breakpoint
  const fadeDistance = isXl ? 90 : isLg ? 70 : 40; // 100 for xl, 70 for lg and 40 for below

  const borderWidth = isLg ? 30 : 5; // Width for left/right, height for top
  const borderSize = isLg ? 3 : 1; // Border thickness in pixels
  const bottomHeight = 80; // Larger height for bottom

  // Calculate positions: top/bottom start after left/right borders, left/right extend 1px into top/bottom (0.5px each side)
  const topLeft = borderWidth; // Start after left border
  const topRight = borderWidth; // End before right border
  const leftTop = borderWidth - 1.5; // Start 1.5px before top border ends (extends 0.5px into top)
  const leftBottom = bottomHeight - 1.5; // End 1.5px before bottom border starts (extends 0.5px into bottom)

  return (
    <section className="pointer-events-none fixed top-0 left-0 z-[9999] h-screen w-full">
      {/* Top border container - fills corner, inner div has border */}
      <div
        className="bg-bgPrimary absolute top-0 right-0 left-0"
        style={{ height: `${borderWidth}px` }}
      >
        <div
          className="absolute top-0 h-full"
          style={{
            left: `${topLeft}px`,
            right: `${topRight}px`,
            borderBottom: `${borderSize}px solid #fff`,
          }}
        />
      </div>
      {/* Right border container - fills corner, inner div has border */}
      <div
        className="bg-bgPrimary absolute top-0 right-0 bottom-0"
        style={{ width: `${borderWidth}px` }}
      >
        <div
          className="absolute right-0 w-full"
          style={{
            top: `${leftTop}px`,
            bottom: `${leftBottom}px`,
            borderLeft: `${borderSize}px solid #fff`,
          }}
        />
      </div>
      {/* Bottom border container - fills corner, inner div has border */}
      <div
        className="bg-bgPrimary absolute right-0 bottom-0 left-0 grid grid-cols-3 px-8 py-2.5"
        style={{ height: `${bottomHeight}px` }}
      >
        <div
          className="absolute bottom-0 h-full"
          style={{
            left: `${topLeft}px`,
            right: `${topRight - 1.5}px`,
            borderTop: `${borderSize}px solid #fff`,
          }}
        />

        {/* BOTTOM - LEFT SIDE CONTENT */}
        {isLg && (
          <div
            id="home-sticky-bottom-left"
            className="relative flex h-full items-center gap-4"
          >
            {/* GLOBAL IMAGE */}
            <div className="border-textPrimary relative w-14 overflow-hidden rounded-md border-3 p-1">
              <div className="flicker-animation relative h-full w-full">
                <img src={globalImage} alt="Global" className="block" />
                <div
                  className="noise-glitch-fast-animation absolute inset-0 z-0"
                  style={{
                    backgroundImage: `url(${noiseImg})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '100px 100px',
                  }}
                />
              </div>
            </div>

            {/* AUTO ROTATE TEXT */}
            <div className="border-textPrimary relative h-full w-[16vw] overflow-hidden rounded-md border-3">
              <div className="relative h-full w-full">
                <div
                  className="noise-glitch-slow-animation absolute inset-0 z-0"
                  style={{
                    backgroundImage: `url(${noiseImg})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '100px 100px',
                  }}
                />
                {/* AUTO ROTATE TEXT ANIMATION */}
                <div className="font-grid absolute inset-0 z-0 overflow-hidden text-4xl">
                  <div className="scroll-text-animation left-1/2 flex h-full flex-row items-center gap-[16vw]">
                    {autoRotateTexts.map((text: string, index: number) => (
                      <div
                        key={text.slice(0, 5) + index}
                        className="text-textPrimary whitespace-nowrap"
                      >
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM - CENTER CONTENT */}
        <div></div>

        {/* BOTTOM - RIGHT SIDE CONTENT */}
        {isLg && (
          <div id="home-sticky-bottom-right">
            <ScrollProgress totalLeaves={16} />
          </div>
        )}
      </div>
      {/* Left border container - fills corner, inner div has border */}
      <div
        className="bg-bgPrimary absolute top-0 bottom-0 left-0"
        style={{ width: `${borderWidth}px` }}
      >
        <div
          className="absolute left-0 w-full"
          style={{
            top: `${leftTop}px`,
            bottom: `${leftBottom}px`,
            borderRight: `${borderSize}px solid #fff`,
          }}
        />
      </div>
      {/* Noise background - fills space between borders with gradient fade to transparent center */}
      <div
        id="home-sticky-noise"
        className="noise-glitch-animation pointer-events-none absolute opacity-20"
        style={
          {
            left: `${topLeft}px`,
            right: `${topRight}px`,
            top: `${leftTop}px`,
            bottom: `${leftBottom}px`,
            backgroundImage: `url(${noiseImg})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
            '--fade-px': `${fadeDistance}px`,
            maskImage: `
            linear-gradient(to bottom, 
              rgba(255, 255, 255, 1) 0, 
              rgba(255, 255, 255, 0.5) calc(var(--fade-px) * 0.7), 
              rgba(255, 255, 255, 0) calc(var(--fade-px) * 1.125), 
              transparent calc(var(--fade-px) * 1.25), 
              transparent calc(100% - var(--fade-px) * 1.25), 
              rgba(255, 255, 255, 0) calc(100% - var(--fade-px) * 1.125), 
              rgba(255, 255, 255, 0.5) calc(100% - var(--fade-px) * 0.7), 
              rgba(255, 255, 255, 1) 100%
            ),
            linear-gradient(to right, 
              rgba(255, 255, 255, 1) 0, 
              rgba(255, 255, 255, 0.5) calc(var(--fade-px) * 0.7), 
              rgba(255, 255, 255, 0) calc(var(--fade-px) * 1.125), 
              transparent calc(var(--fade-px) * 1.25), 
              transparent calc(100% - var(--fade-px) * 1.25), 
              rgba(255, 255, 255, 0) calc(100% - var(--fade-px) * 1.125), 
              rgba(255, 255, 255, 0.5) calc(100% - var(--fade-px) * 0.7), 
              rgba(255, 255, 255, 1) 100%
            )
          `,
            WebkitMaskImage: `
            linear-gradient(to bottom, 
              rgba(255, 255, 255, 0.1) 0, 
              rgba(255, 255, 255, 0.5) calc(var(--fade-px) * 0.5), 
              rgba(255, 255, 255, 0) calc(var(--fade-px) * 1.125), 
              transparent calc(var(--fade-px) * 1.25), 
              transparent calc(100% - var(--fade-px) * 1.25), 
              rgba(255, 255, 255, 0) calc(100% - var(--fade-px) * 1.125), 
              rgba(255, 255, 255, 0.5) calc(100% - var(--fade-px) * 0.5), 
              rgba(255, 255, 255, 1) 100%
            ),
            linear-gradient(to right, 
              rgba(255, 255, 255, 1) 0, 
              rgba(255, 255, 255, 0.5) calc(var(--fade-px) * 0.5), 
              rgba(255, 255, 255, 0) calc(var(--fade-px) * 1.125), 
              transparent calc(var(--fade-px) * 1.25), 
              transparent calc(100% - var(--fade-px) * 1.25), 
              rgba(255, 255, 255, 0) calc(100% - var(--fade-px) * 1.125), 
              rgba(255, 255, 255, 0.5) calc(100% - var(--fade-px) * 0.5), 
              rgba(255, 255, 255, 1) 100%
            )
          `,
            maskComposite: 'add',
            WebkitMaskComposite: 'add',
          } as React.CSSProperties
        }
      />
      {/* Corner SVGs at each intersection where borders connect - positioned more inside */}
      {/* Top-left corner - faces outward from top-left */}
      <img
        src={cornerSvg}
        alt=""
        className="corner-svg absolute max-lg:z-10"
        style={{
          left: `${isLg ? topLeft - borderWidth / 20 : topLeft - borderWidth / 3}px`,
          top: `${isLg ? leftTop - borderWidth / 80 : leftTop - borderWidth + 67.5}px`,
          width: `${isLg ? borderWidth : borderWidth + 24}px`,
          height: `${isLg ? borderWidth : borderWidth + 24}px`,
          transform: 'rotate(180deg)',
        }}
      />
      {/* Top-right corner - faces outward from top-right */}
      <img
        src={cornerSvg}
        alt=""
        className="corner-svg absolute"
        style={{
          right: `${isLg ? topRight - borderWidth / 20 : topRight - borderWidth / 4}px`,
          top: `${leftTop - borderWidth / 80}px`,
          width: `${isLg ? borderWidth : borderWidth + 26}px`,
          height: `${isLg ? borderWidth : borderWidth + 26}px`,
          transform: 'rotate(-90deg)',
        }}
      />
      {/* Bottom-left corner - faces outward from bottom-left */}
      <img
        src={cornerSvg}
        alt=""
        className="corner-svg absolute"
        style={{
          left: `${isLg ? topLeft - borderWidth / 20 : topLeft - borderWidth / 3}px`,
          bottom: `${isLg ? leftBottom - borderWidth / 150 : leftBottom - borderWidth / 7 + 1}px`,
          width: `${isLg ? borderWidth : borderWidth + 26}px`,
          height: `${isLg ? borderWidth : borderWidth + 26}px`,
          transform: 'rotate(90deg)',
        }}
      />
      {/* Bottom-right corner - faces outward from bottom-right */}
      <img
        src={cornerSvg}
        alt=""
        className="corner-svg absolute"
        style={{
          right: `${isLg ? topRight - borderWidth / 20 : topRight - borderWidth / 4}px`,
          bottom: `${isLg ? leftBottom - borderWidth / 150 : leftBottom - borderWidth / 7 + 1}px`,
          width: `${isLg ? borderWidth : borderWidth + 26}px`,
          height: `${isLg ? borderWidth : borderWidth + 26}px`,
          transform: 'rotate(0deg)',
        }}
      />
      {/* Logo at top center */}
      <div
        className="bg-bgPrimary absolute left-0 z-3 flex w-38 translate-x-[4px] items-center justify-center border-1 border-white border-t-transparent max-lg:border-l-0 lg:left-1/2 lg:w-48 lg:-translate-x-1/2 lg:border-[3px]"
        style={{
          top: `${isLg ? borderWidth - borderSize - 1 : borderWidth - borderSize}px`,
        }}
      >
        <img
          id="home-sticky-logo"
          src={logoImg}
          alt="Logo"
          className="mt-1 mb-2 block h-full max-h-9/10 w-full max-w-8/10 object-contain lg:-mt-4 lg:max-w-34"
        />

        {/* Corner SVGs at all corners of logo container */}
        {/* Top-left corner */}
        <img
          src={cornerSvg}
          alt=""
          className="corner-svg absolute hidden lg:block"
          style={{
            left: `${-borderWidth + 1}px`,
            top: `${-borderWidth / 80}px`,
            width: `${borderWidth}px`,
            height: `${borderWidth}px`,
            transform: 'rotate(-90deg)',
          }}
        />

        {/* Top-right corner */}
        <img
          src={cornerSvg}
          alt=""
          className="corner-svg absolute"
          style={{
            right: `${-borderWidth + 1 + (isLg ? 0 : -26)}px`,
            top: `${-borderWidth / 80 + (isLg ? 0 : -1)}px`,
            width: `${isLg ? borderWidth : borderWidth + 26}px`,
            height: `${isLg ? borderWidth : borderWidth + 26}px`,
            transform: 'rotate(-180deg)',
          }}
        />

        {/* Bottom-left corner */}
        <img
          src={cornerSvg}
          alt=""
          className="corner-svg absolute hidden lg:block"
          style={{
            left: `${-borderWidth / 13}px`,
            bottom: `${-borderWidth / 20}px`,
            width: `${borderWidth}px`,
            height: `${borderWidth}px`,
            transform: 'rotate(90deg)',
          }}
        />

        {/* Bottom-right corner */}
        <img
          src={cornerSvg}
          alt=""
          className="corner-svg absolute -z-2"
          style={{
            right: `${-borderWidth / 20 + (isLg ? 0 : -1.1)}px`,
            bottom: `${-borderWidth / 13 + (isLg ? 0 : -0.8)}px`,
            width: `${borderWidth + (isLg ? 0 : 26)}px`,
            height: `${borderWidth + (isLg ? 0 : 26)}px`,
            transform: 'rotate(0deg)',
          }}
        />
      </div>
      <Calendar />
    </section>
  );
};

export default HomeSticky;
