// Demo data for all collections - used when Firebase is not connected

export const demoHero = {
  platformStats: {
    id: "stats-1",
    liveCompetitions: 12,
    totalParticipants: 2580,
    countriesJoined: 45,
    totalWinners: 156,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  heroContent: {
    id: "hero-1",
    title: "Welcome to Mubarista",
    subtitle: "The Ultimate Coffee Competition Platform",
    badge: "Live Competitions Now",
    ctaPrimary: "Get Started",
    ctaSecondary: "View Competitions",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  heroBackground: {
    id: "bg-1",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1920&q=80",
    videoUrl: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const demoAbout = {
  title: "About Mubarista",
  description: "Mubarista is dedicated to celebrating the art of coffee through competitions, education, and community.",
  mission: "Our mission is to elevate coffee culture worldwide by providing a platform for baristas to showcase their skills and connect with industry leaders.",
  vision: "To become the global standard for coffee competitions and professional development.",
  values: [
    "Excellence in coffee craftsmanship",
    "Community and collaboration",
    "Innovation and creativity",
    "Sustainability and ethical practices"
  ]
};

export const demoJudges = [
  {
    id: "1",
    name: "James Hoffmann",
    title: "World Barista Champion 2007",
    country: "United Kingdom",
    image: "",
    bio: "Renowned coffee expert and author with over 15 years of experience in the specialty coffee industry."
  },
  {
    id: "2",
    name: "Sasa Sestic",
    title: "World Barista Champion 2015",
    country: "Australia",
    image: "",
    bio: "Founder of ONA Coffee and pioneer in coffee processing techniques."
  }
];

export const demoCompetitions = [
  {
    id: "1",
    title: "World Barista Championship 2026",
    slug: "world-barista-championship-2026",
    description: "The most prestigious barista competition in the world, bringing together champions from over 60 countries.",
    organizer: "Specialty Coffee Association",
    difficulty: "Master",
    status: "upcoming",
    prizePool: 50000,
    entryFee: 500,
    availableSlots: 60,
    totalSlots: 60,
    registrationDeadline: "2026-12-31",
    countriesAllowed: ["All Countries"],
    banner: "",
    rules: [
      "Must be a certified barista",
      "Competition equipment provided",
      "15-minute presentation",
      "Signature beverage required"
    ],
    judgingCriteria: [
      "Taste",
      "Technique",
      "Presentation",
      "Cleanliness",
      "Creativity"
    ],
    requiredSkills: ["Espresso", "Milk Texturing", "Latte Art", "Customer Service"],
    eventTimeline: [
      { date: "2026-03-01", event: "Registration Opens" },
      { date: "2026-06-01", event: "Regional Qualifiers" },
      { date: "2026-09-01", event: "World Championship" }
    ]
  },
  {
    id: "2",
    title: "Latte Art World Championship 2026",
    slug: "latte-art-world-championship-2026",
    description: "Showcase your artistic skills in the world's premier latte art competition.",
    organizer: "World Coffee Events",
    difficulty: "Professional",
    status: "open",
    prizePool: 15000,
    entryFee: 300,
    availableSlots: 40,
    totalSlots: 40,
    registrationDeadline: "2026-08-15",
    countriesAllowed: ["All Countries"],
    banner: "",
    rules: [
      "Free pour only",
      "No etching or tools allowed",
      "3 patterns required",
      "4-minute time limit"
    ],
    judgingCriteria: [
      "Contrast",
      "Symmetry",
      "Complexity",
      "Creativity",
      "Definition"
    ],
    requiredSkills: ["Milk Texturing", "Latte Art", "Free Pour"],
    eventTimeline: [
      { date: "2026-02-01", event: "Registration Opens" },
      { date: "2026-05-01", event: "National Finals" },
      { date: "2026-08-01", event: "World Championship" }
    ]
  }
];

export const demoWinners = [
  {
    id: "1",
    name: "Boram Um",
    competition: "World Barista Championship 2025",
    year: "2025",
    country: "South Korea",
    image: ""
  },
  {
    id: "2",
    name: "Anthony Douglas",
    competition: "World Barista Championship 2024",
    year: "2024",
    country: "Australia",
    image: ""
  }
];

export const demoSponsors = [
  {
    id: "1",
    name: "La Marzocco",
    logo: "",
    website: "https://lamarzocco.com",
    tier: "Platinum"
  },
  {
    id: "2",
    name: "Mahlkönig",
    logo: "",
    website: "https://maehlkoenig.com",
    tier: "Gold"
  }
];

export const demoBooks = [
  {
    id: "1",
    title: "The World Atlas of Coffee",
    author: "James Hoffmann",
    description: "A comprehensive guide to coffee from bean to cup.",
    coverImage: "",
    price: 35,
    isbn: "978-1784724290",
    publishedDate: "2024-01-01"
  },
  {
    id: "2",
    title: "Coffee Dictionary",
    author: "Maxwell Colonna-Dashwood",
    description: "An essential reference for coffee professionals and enthusiasts.",
    coverImage: "",
    price: 25,
    isbn: "978-1784720773",
    publishedDate: "2023-06-01"
  }
];

export const demoArticles = [
  {
    id: "1",
    title: "The Future of Coffee Competitions",
    excerpt: "Exploring how technology and sustainability are shaping the next generation of coffee competitions.",
    content: "Coffee competitions are evolving rapidly...",
    author: "Coffee Expert",
    publishedDate: "2026-01-15",
    coverImage: "",
    category: "Industry"
  },
  {
    id: "2",
    title: "Mastering Latte Art: A Beginner's Guide",
    excerpt: "Learn the fundamentals of creating stunning latte art patterns.",
    content: "Latte art is a skill that takes practice...",
    author: "Barista Pro",
    publishedDate: "2026-01-10",
    coverImage: "",
    category: "Tutorial"
  }
];

export const demoCoffeeFacts = [
  {
    id: "1",
    fact: "Coffee is the second most traded commodity in the world after oil.",
    category: "Industry"
  },
  {
    id: "2",
    fact: "A coffee tree can live for 100 years and produce up to 10 pounds of coffee cherries per year.",
    category: "Agriculture"
  },
  {
    id: "3",
    fact: "The world's most expensive coffee can cost up to $600 per pound.",
    category: "Trivia"
  }
];

export const demoFaqs = [
  {
    id: "1",
    question: "How do I register for a competition?",
    answer: "To register for a competition, navigate to the competitions page, select the competition you're interested in, and click the 'Register' button. You'll need to complete the registration form and pay the entry fee."
  },
  {
    id: "2",
    question: "What are the eligibility requirements?",
    answer: "Eligibility requirements vary by competition. Generally, you must be at least 18 years old, have professional barista experience, and meet any skill or certification requirements specified in the competition details."
  },
  {
    id: "3",
    question: "How are winners selected?",
    answer: "Winners are selected by a panel of expert judges based on predefined criteria such as taste, technique, presentation, and creativity. The judging process is transparent and follows international standards."
  }
];

export const demoContact = {
  email: "contact@mubarista.com",
  phone: "+1 (555) 123-4567",
  address: "123 Coffee Street, New York, NY 10001",
  socialMedia: {
    twitter: "https://twitter.com/mubarista",
    instagram: "https://instagram.com/mubarista",
    facebook: "https://facebook.com/mubarista",
    linkedin: "https://linkedin.com/company/mubarista"
  },
  businessHours: "Mon-Fri: 9AM-5PM"
};

export const demoCountries = [
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "DE", name: "Germany", flag: "🇩🇪" }
];

export const demoTestimonials = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Professional Barista",
    content: "Mubarista has transformed how I approach coffee competitions. The platform is intuitive and the community is incredibly supportive.",
    image: "",
    rating: 5
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Coffee Shop Owner",
    content: "Finding talented baristas through Mubarista has been game-changing for our business. The quality of competitors is outstanding.",
    image: "",
    rating: 5
  }
];

export const demoLatteArt = [
  {
    id: "1",
    title: "Rosetta Masterpiece",
    artist: "Emma Wilson",
    image: "",
    category: "Free Pour",
    difficulty: "Advanced",
    description: "A stunning rosetta pattern with perfect symmetry and definition."
  },
  {
    id: "2",
    title: "Heart Tulip",
    artist: "David Kim",
    image: "",
    category: "Free Pour",
    difficulty: "Intermediate",
    description: "A beautiful heart and tulip combination with excellent contrast."
  }
];
