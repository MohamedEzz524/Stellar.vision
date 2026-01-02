import ProjectsSection from '../../components/ProjectsSection';
import { ExampleProjects } from '../../constants';
import HomeHeader from './HomeHeader';
import HeroSection from './HeroSection';
import HomeSticky from './HomeSticky';

const Home = () => {
  return (
    <div className="relative">
      <HomeSticky />
      <HeroSection />
      <HomeHeader />
      <ProjectsSection projects={ExampleProjects} sectionId="works" />
    </div>
  );
};

export default Home;
