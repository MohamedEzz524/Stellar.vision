import AnimatedTextRotation from '../../components/AnimatedTextRotation';
import AnimatedText from '../../components/AnimatedText';
import { texts } from '../../constants';

const HomeHeader = () => {
  return (
    <div className="home-header bg-bgPrimary border-border overflow-hidden border-t py-8">
      <div className="container">
        <div className="text-textPrimary border-border lg:gap-4 gap-8 flex lg:flex-row flex-col lg:px-0 px-8 lg:items-center justify-between border-b pb-8">
          {/* Left */}
          <div className="text-sm md:text-base lg:text-lg">
            <AnimatedText
              type="slide"
              className="block w-sm max-w-full lg:max-w-96"
              stagger={0.3}
              duration={0.7}
            >
              We specialize in creating emotional, animated interfaces and wow
              websites that
            </AnimatedText>
            <AnimatedText
              type="slide"
              className="block max-w-100"
              stagger={0.3}
              duration={0.7}
            >
              make complex SaaS products more human and appealing to use while
              ensuring great UX.
            </AnimatedText>
          </div>
          {/* Right */}
          <div className="flex flex-1 flex-col items-end gap-4 text-right">
            <div className="flex items-start gap-8">
              <p className="md:text-lg text-base lg:text-xl 2xl:text-2xl">WE DO</p>
              <AnimatedText
                type="flip"
                className="text-textPrimary/60 md:text-7xl text-4xl lg:text-7xl 2xl:text-9xl lg:leading-24 font-semibold leading-none tracking-tight"
                stagger={0.08}
                duration={0.7}
              >
                IMMERSIVE
              </AnimatedText>
            </div>
            {/* Animated text */}
            <AnimatedTextRotation
              texts={texts}
              className="text-textPrimary relative md:h-20 h-12 lg:h-32 w-full  md:text-7xl text-4xl lg:text-7xl 2xl:text-9xl font-semibold tracking-tight uppercase"
              initialDelay={1000}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHeader;
