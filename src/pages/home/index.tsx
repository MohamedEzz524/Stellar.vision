import ProjectsSection from '../../components/ProjectsSection';
import ScrollTrigger3DSection from '../../components/ScrollTrigger3DSection';
// import Particle3DSection from '../../components/Particle3DSection';
import { ExampleProjects, text3D } from '../../constants';
import HomeHeader from './HomeHeader';
import HeroSection from './HeroSection';
import HomeSticky from './HomeSticky';

const Home = () => {
  return (
    <div className="relative">
      <HomeSticky />
      <HeroSection />
      {/* <Particle3DSection /> */}
      <HomeHeader />
      <ProjectsSection projects={ExampleProjects} sectionId="works" />
      <ScrollTrigger3DSection
        texts={text3D}
        objectAnimationStartVh={{
          row1: 50,
          row2: 120,
        }}
      />
    </div>
  );
};

export default Home;
