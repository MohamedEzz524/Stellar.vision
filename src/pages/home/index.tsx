import ProjectsSection from '../../components/ProjectsSection';
import ScrollTrigger3DSection from '../../components/ScrollTrigger3DSection';
import Particle3DSection from '../../components/Particle3DSection';
import { ExampleProjects } from '../../constants';
import HomeHeader from './HomeHeader';
import HeroSection from './HeroSection';
import HomeSticky from './HomeSticky';

const Home = () => {
  return (
    <div className="relative">
      <HomeSticky />
      <HeroSection />
      <Particle3DSection />
      <HomeHeader />
      <ProjectsSection projects={ExampleProjects} sectionId="works" />
      <ScrollTrigger3DSection
        texts={[
          'First multiline text that will scroll through First multiline text that will scroll through',
          'First multiline text that will scroll through First multiline text that will scroll through',
          'Second multiline text that will scroll through Second multiline text that will scroll through',
          'Third multiline text that will scroll through Third multiline text that will scroll through',
          'Fourth multiline text that will scroll through Fourth multiline text that will scroll through',
          'Fifth multiline text that will scroll through Fifth multiline text that will scroll through',
          'Sixth multiline text that will scroll through Sixth multiline text that will scroll through',
          'Seventh multiline text that will scroll through Seventh multiline text that will scroll through',
          'Eighth multiline text that will scroll through Eighth multiline text that will scroll through',
          'Ninth multiline text that will scroll through Ninth multiline text that will scroll through',
          'Tenth multiline text that will scroll through Tenth multiline text that will scroll through',
        ]}
        objectAnimationStartVh={{
          row1: 50,
          row2: 120,
        }}
      />
      <div className="h-screen bg-blue-950"></div>
    </div>
  );
};

export default Home;
