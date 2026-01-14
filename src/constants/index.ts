export const texts = [
  'brand identity',
  'Motion',
  'Websites',
  'Products',
  'UI/UX design',
];
export const autoRotateTexts = [
  'AUTO ROTATE TEXT',
  'SECOND TEXT',
  'THIRD TEXT',
];
export const text3D = [
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
];

export const homeHeaderParagraphs = {
  first:
    'We specialize in creating emotional, animated interfaces and wow websites that',
  second:
    'make complex SaaS products more human and appealing to use while ensuring great UX.',
};

export const heroSectionParagraph =
  'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris. Maecenas vitae mattis tellus..';
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

export const ExampleProjects: Project[] = [
  {
    id: '1',
    title: 'OCTY',
    year: '2023',
    tags: 'UI/UX, WOW Website, Motion Design, Visual Brand Identity',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66f2853311ed945e147c0089_Frame%201510%20(1)_11zon.webp',
    imageAlt: 'OCTY',
    href: 'https://www.facebook.com',
  },
  {
    id: '2',
    title: 'JobCannon',
    year: '2023',
    tags: 'Visual Brand Identity',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66ead266ebdc28cf66f30340_Jobcannon%20cover%20(1).webp',
    imageAlt: 'JobCannon',
    href: 'https://www.instagram.com',
  },
  {
    id: '3',
    title: 'Simply Contact',
    year: '2021',
    tags: 'UI/UX, WOW Website, Motion Design',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66f284e1475d07e10dc89bb8_Frame%201509%20(1)_11zon.webp',
    imageAlt: 'Simply Contact',
    href: 'https://twitter.com',
  },
  {
    id: '4',
    title: 'Procamp',
    year: '2023',
    tags: 'UI/UX, WOW Website, Visual Brand Identity',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66f2856f9671a128c8378666_Frame%201511%20(1)_11zon.webp',
    imageAlt: 'Procamp',
    href: 'https://www.facebook.com',
  },
  {
    id: '5',
    title: 'EdWay',
    year: '2022',
    tags: 'UI/UX, Product Design',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66c2fb9e3f6522e6210e7a3a_cover-_2_.webp',
    imageAlt: 'EdWay',
    href: 'https://www.instagram.com',
  },
  {
    id: '6',
    title: 'Skylight',
    year: '2022',
    tags: 'UI/UX, WOW Website, Visual Brand Identity',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66f286365bc1c2becf13c36e_Frame%201517%20(1)_11zon.webp',
    imageAlt: 'Skylight',
    href: 'https://twitter.com',
  },
  {
    id: '7',
    title: 'Umami View',
    year: '2020',
    tags: 'UI/UX, Product Design',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66c8316006aecd15eecf26ea_Umami%20View_Cover_11zon.webp',
    imageAlt: 'Umami View',
    href: 'https://www.facebook.com',
  },
  {
    id: '8',
    title: 'Sirius',
    year: '2022',
    tags: 'UI/UX, WOW Website, Visual Brand Identity',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66f285a933ecbaddd339f8d7_Frame%201513%20(1)_11zon.webp',
    imageAlt: 'Sirius',
    href: 'https://www.instagram.com',
  },
  {
    id: '9',
    title: '#30ua',
    year: '2021',
    tags: 'UI/UX, WOW Website, Visual Brand Identity',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66d011782515a06c63c254f0_SOTD%20(1)_11zon.webp',
    imageAlt: '#30ua',
    href: 'https://twitter.com',
  },
  {
    id: '10',
    title: 'Crocs Club',
    year: '2022',
    tags: 'UI/UX, WOW Website, Motion Design',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66f284a75d1667682e1d417a_Frame%201388%20(1)_11zon.webp',
    imageAlt: 'Crocs Club',
    href: 'https://www.facebook.com',
  },
  {
    id: '11',
    title: 'Crocs Club',
    year: '2022',
    tags: 'UI/UX, WOW Website, Motion Design',
    image:
      'https://cdn.prod.website-files.com/64354a08ff4dd191e639373a/66f284a75d1667682e1d417a_Frame%201388%20(1)_11zon.webp',
    imageAlt: 'Crocs Club',
    href: 'https://www.instagram.com',
  },
];

export interface TestimonialVideo {
  id: string;
  video: string;
  thumbnail?: string;
}

export const TestimonialVideos: TestimonialVideo[] = [
  {
    id: 'testimonial-1',
    video:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
  },
  {
    id: 'testimonial-2',
    video:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
  },
  {
    id: 'testimonial-3',
    video:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
  },
  {
    id: 'testimonial-4',
    video:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
  },
  {
    id: 'testimonial-5',
    video:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
  },
  {
    id: 'testimonial-6',
    video:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
  },
  {
    id: 'testimonial-7',
    video:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
  },
  {
    id: 'testimonial-8',
    video:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
  },
];
