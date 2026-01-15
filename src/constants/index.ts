export const texts = [
  'brand identity',
  'Motion',
  'Websites',
  'Products',
  'UI/UX design',
];
export const autoRotateTexts = [
  'ONLY 2 SPOTS AVAILABLE THIS MONTH',
  'STAND OUT IN YOUR MARKET',
];
export const text3D = [
  'Marketing before design Strategy before visuals Conversion before aesthetics Results before opinions',
  'We study your audience We map user behavior We define clear actions We remove friction',
  'Every section has a goal Every headline has a purpose Every click leads somewhere Nothing is random ',
  'Third multiline text that will scroll through Third multiline text that will scroll through',
  'Fast loading websites Clean scalable code SEO-ready structure Built to grow',
  'Designed for campaigns Optimized for ads Ready for funnels Made to convert',
  'Launch is not the end We test and refine We optimize performance We improve conversions',
  'If results matter If growth is the goal If performance comes first Stellar Vision is the choice',
];

export const homeHeaderParagraphs = {
  first:
    'We’re marketers first — designers second.',
  second:
    'Our websites don’t just impress. They perform. We focus on behavior, psychology, funnels, and conversion paths — then we design around them.',
};

export const heroSectionParagraph = 'We design and build high-performance websites for brands that want more leads, more sales, and real growth. Marketing comes first. Design follows strategy. Results are the goal.';
export interface Project {
  id: string;
  title: string;
  year: string;
  tags: string;
  image: string;
  imageAlt: string;
  href: string;
  video?: string;
}

// Import project images
import cozyFragrancesImg from '../assets/projects/Cozy Fragrances.webp';
import crownImg from '../assets/projects/Crown.webp';
import flexieveImg from '../assets/projects/Flexieve.webp';
import fo7osatImg from '../assets/projects/Fo7osat.webp';
import furnitureImg from '../assets/projects/Furniture.webp';
import gogaToysImg from '../assets/projects/Goga Toys.webp';
import laundorImg from '../assets/projects/Laundor.webp';
import mahlaImg from '../assets/projects/Mahla.webp';
import maroofImg from '../assets/projects/Maroof.webp';
import nafasImg from '../assets/projects/Nafas.webp';
import performanceImg from '../assets/projects/Performance.webp';
import smileImg from '../assets/projects/Smile.webp';
import steelixeImg from '../assets/projects/Steelixe.webp';
import twoImg from '../assets/projects/Two.webp';
import ultramanImg from '../assets/projects/Ultraman.webp';

export const Projects: Project[] = [
  {
    id: '1',
    title: 'Cozy Fragrances',
    year: '2023',
    tags: 'UI/UX, WOW Website, Motion Design, Visual Brand Identity',
    image: cozyFragrancesImg,
    imageAlt: 'Cozy Fragrances',
    href: 'https://www.facebook.com',
  },
  {
    id: '2',
    title: 'Crown',
    year: '2023',
    tags: 'Visual Brand Identity',
    image: crownImg,
    imageAlt: 'Crown',
    href: 'https://www.instagram.com',
  },
  {
    id: '3',
    title: 'Flexieve',
    year: '2021',
    tags: 'UI/UX, WOW Website, Motion Design',
    image: flexieveImg,
    imageAlt: 'Flexieve',
    href: 'https://twitter.com',
  },
  {
    id: '4',
    title: 'Fo7osat',
    year: '2023',
    tags: 'UI/UX, WOW Website, Visual Brand Identity',
    image: fo7osatImg,
    imageAlt: 'Fo7osat',
    href: 'https://www.facebook.com',
  },
  {
    id: '5',
    title: 'Furniture',
    year: '2022',
    tags: 'UI/UX, Product Design',
    image: furnitureImg,
    imageAlt: 'Furniture',
    href: 'https://www.instagram.com',
  },
  {
    id: '6',
    title: 'Goga Toys',
    year: '2022',
    tags: 'UI/UX, WOW Website, Visual Brand Identity',
    image: gogaToysImg,
    imageAlt: 'Goga Toys',
    href: 'https://twitter.com',
  },
  {
    id: '7',
    title: 'Laundor',
    year: '2020',
    tags: 'UI/UX, Product Design',
    image: laundorImg,
    imageAlt: 'Laundor',
    href: 'https://www.facebook.com',
  },
  {
    id: '8',
    title: 'Mahla',
    year: '2022',
    tags: 'UI/UX, WOW Website, Visual Brand Identity',
    image: mahlaImg,
    imageAlt: 'Mahla',
    href: 'https://www.instagram.com',
  },
  {
    id: '9',
    title: 'Maroof',
    year: '2021',
    tags: 'UI/UX, WOW Website, Visual Brand Identity',
    image: maroofImg,
    imageAlt: 'Maroof',
    href: 'https://twitter.com',
  },
  {
    id: '10',
    title: 'Nafas',
    year: '2022',
    tags: 'UI/UX, WOW Website, Motion Design',
    image: nafasImg,
    imageAlt: 'Nafas',
    href: 'https://www.facebook.com',
  },
  {
    id: '11',
    title: 'Performance',
    year: '2022',
    tags: 'UI/UX, WOW Website, Motion Design',
    image: performanceImg,
    imageAlt: 'Performance',
    href: 'https://www.instagram.com',
  },
  {
    id: '12',
    title: 'Smile',
    year: '2022',
    tags: 'UI/UX, WOW Website, Motion Design',
    image: smileImg,
    imageAlt: 'Smile',
    href: 'https://twitter.com',
  },
  {
    id: '13',
    title: 'Steelixe',
    year: '2022',
    tags: 'UI/UX, WOW Website, Motion Design',
    image: steelixeImg,
    imageAlt: 'Steelixe',
    href: 'https://www.facebook.com',
  },
  {
    id: '14',
    title: 'Two',
    year: '2022',
    tags: 'UI/UX, WOW Website, Motion Design',
    image: twoImg,
    imageAlt: 'Two',
    href: 'https://www.instagram.com',
  },
  {
    id: '15',
    title: 'Ultraman',
    year: '2022',
    tags: 'UI/UX, WOW Website, Motion Design',
    image: ultramanImg,
    imageAlt: 'Ultraman',
    href: 'https://twitter.com',
  },
];

export interface TestimonialVideo {
  id: string;
  video: string;
}

export const TestimonialVideos: TestimonialVideo[] = [
  {
    id: 'testimonial-2',
    video:
      'https://res.cloudinary.com/deqfby6bi/video/upload/v1768481760/asVideo_2026-01-14_at_10.30.55_AM_h79785.mp4',
  },
  {
    id: 'testimonial-1',
    video:
      'https://res.cloudinary.com/deqfby6bi/video/upload/v1768481762/WhatsApp_Video_2026-01-14_at_10.30as.55_AM_cfwwdu.mp4',
  },
  {
    id: 'testimonial-3',
    video:
      'https://res.cloudinary.com/deqfby6bi/video/upload/v1768481743/WhatsApp_Video_2026-01-14sdf_at_10.30.55_AM_cgz5ra.mp4',
  },
  {
    id: 'testimonial-4',
    video:
      'https://res.cloudinary.com/deqfby6bi/video/upload/v1768481776/WhatsApp_Video_2026-01-14_at_10.30.55_AM_1_x6rccs.mp4',
  },
];
