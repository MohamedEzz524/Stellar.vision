import Home from './home';
import type { RouteObject } from 'react-router-dom';

type ExtendedRoute = RouteObject & {
  title: string;
};

const routes: ExtendedRoute[] = [
  {
    path: '/',
    title: 'Home',
    element: <Home />,
  },
];

export default routes;
