import AnimatedTextRotation from '../../components/AnimatedTextRotation';
import AnimatedText from '../../components/AnimatedText';
import { texts } from '../../constants';

const HomeHeader = () => {
  return (
    <div className="home-header bg-bgPrimary border-border overflow-hidden border-t py-8">
      <div className="container">
        <div className="text-textPrimary border-border flex items-center justify-between border-b pb-8">
          {/* Left */}
          <div className="text-lg">
            <AnimatedText
              type="slide"
              className="block max-w-96"
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
              <p className="text-2xl">WE DO</p>
              <AnimatedText
                type="flip"
                className="text-textPrimary/60 text-9xl leading-24 font-semibold tracking-tight"
                stagger={0.08}
                duration={0.7}
              >
                IMMERSIVE
              </AnimatedText>
            </div>
            {/* Animated text */}
            <AnimatedTextRotation
              texts={texts}
              className="text-textPrimary relative h-32 w-full text-9xl font-semibold tracking-tight uppercase"
              initialDelay={1000}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHeader;
