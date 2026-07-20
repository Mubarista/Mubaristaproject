import type {
  Article,
  Book,
  Competition,
  Job,
  Legend,
  School,
  Testimonial,
  Tool,
} from "@/types";

export const platformStats = {
  liveCompetitions: 12,
  totalParticipants: 48500,
  countriesJoined: 127,
  totalWinners: 3420,
};

export const competitions: Competition[] = [
  {
    id: "1",
    title: "Global Latte Art Championship 2026",
    slug: "global-latte-art-2026",
    banner: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&q=80",
    difficulty: "Professional",
    prizePool: 50000,
    countriesAllowed: ["All Countries"],
    registrationDeadline: "2026-08-15",
    eventTimeline: [
      { date: "Aug 15, 2026", event: "Registration Closes" },
      { date: "Aug 20, 2026", event: "Submissions Open" },
      { date: "Sep 10, 2026", event: "Judging Period" },
      { date: "Sep 20, 2026", event: "Winners Announced" },
    ],
    requiredSkills: ["Free Pour", "Etching", "Multi-Layer"],
    entryFee: 75,
    availableSlots: 142,
    totalSlots: 200,
    status: "open",
    organizer: "MUBARISTA International",
    rules: [
      "Submit one video (max 3 minutes) showcasing your best latte art",
      "Video must be recorded in a single take without editing",
      "Use whole milk or oat milk only",
      "Include your MUBARISTA participant ID in the video",
    ],
    judgingCriteria: [
      "Creativity & Originality",
      "Symmetry & Balance",
      "Precision & Definition",
      "Milk Texture Quality",
      "Technique & Control",
      "Overall Presentation",
    ],
    description:
      "The world's premier online latte art competition bringing together elite baristas from every continent.",
  },
  {
    id: "2",
    title: "Rising Stars Latte Art Cup",
    slug: "rising-stars-2026",
    banner: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
    difficulty: "Intermediate",
    prizePool: 15000,
    countriesAllowed: ["All Countries"],
    registrationDeadline: "2026-07-30",
    eventTimeline: [
      { date: "Jul 30, 2026", event: "Registration Closes" },
      { date: "Aug 5, 2026", event: "Submissions Open" },
      { date: "Aug 25, 2026", event: "Results" },
    ],
    requiredSkills: ["Free Pour", "Basic Etching"],
    entryFee: 35,
    availableSlots: 89,
    totalSlots: 150,
    status: "open",
    organizer: "MUBARISTA Academy",
    rules: [
      "Open to baristas with 1-3 years experience",
      "Submit 2 photos and 1 video",
      "Original work only",
    ],
    judgingCriteria: ["Symmetry", "Technique", "Creativity", "Milk Texture"],
    description:
      "Designed for emerging talent ready to make their mark on the global stage.",
  },
  {
    id: "3",
    title: "Master Barista Invitational",
    slug: "master-invitational-2026",
    banner: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80",
    difficulty: "Master",
    prizePool: 100000,
    countriesAllowed: ["Invitation Only"],
    registrationDeadline: "2026-09-01",
    eventTimeline: [
      { date: "Sep 1, 2026", event: "Invitations Sent" },
      { date: "Sep 15, 2026", event: "Competition Begins" },
      { date: "Oct 1, 2026", event: "Grand Finale" },
    ],
    requiredSkills: ["Advanced Free Pour", "3D Latte Art", "Competition Experience"],
    entryFee: 150,
    availableSlots: 8,
    totalSlots: 24,
    status: "upcoming",
    organizer: "MUBARISTA Elite",
    rules: ["By invitation only", "Previous competition winners preferred"],
    judgingCriteria: ["All categories weighted equally"],
    description:
      "An exclusive invitational for the world's most celebrated latte artists.",
  },
];

export const winners = [
  {
    id: "1",
    name: "Yuki Tanaka",
    country: "Japan",
    competition: "Global Latte Art 2025",
    prize: "$25,000",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    artImage: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&q=80",
  },
  {
    id: "2",
    name: "Maria Santos",
    country: "Brazil",
    competition: "Rising Stars 2025",
    prize: "$8,000",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    artImage: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
  },
  {
    id: "3",
    name: "James O'Brien",
    country: "Ireland",
    competition: "Master Invitational 2025",
    prize: "$50,000",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    artImage: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
  },
];

export const featuredLatteArt = [
  {
    id: "1",
    title: "Swan Symphony",
    artist: "Chen Wei",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
    likes: 12400,
  },
  {
    id: "2",
    title: "Rosetta Cascade",
    artist: "Amara Okonkwo",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    likes: 9800,
  },
  {
    id: "3",
    title: "Phoenix Rising",
    artist: "Luca Rossi",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80",
    likes: 15200,
  },
  {
    id: "4",
    title: "Geometric Harmony",
    artist: "Sofia Andersson",
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80",
    likes: 8700,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "David Kim",
    role: "Head Barista, Seoul",
    country: "South Korea",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    quote:
      "MUBARISTA transformed my career. Competing globally from my café opened doors I never imagined.",
    rating: 5,
  },
  {
    id: "2",
    name: "Elena Rodriguez",
    role: "Coffee Consultant",
    country: "Spain",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    quote:
      "The premium courses and certification program gave me credibility that clients trust instantly.",
    rating: 5,
  },
  {
    id: "3",
    name: "Kwame Asante",
    role: "Competition Winner 2025",
    country: "Ghana",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    quote:
      "From local barista to international champion — MUBARISTA made it possible.",
    rating: 5,
  },
];

export const sponsors = [
  { name: "La Marzocco", logo: "LM" },
  { name: "Mahlkönig", logo: "MK" },
  { name: "Oatly", logo: "OT" },
  { name: "Baratza", logo: "BZ" },
  { name: "Hario", logo: "HR" },
  { name: "Acaia", logo: "AC" },
];

export const coffeeFacts = [
  {
    id: "1",
    fact: "Latte art originated in Italy in the 1980s when baristas began pouring steamed milk into espresso.",
    icon: "☕",
  },
  {
    id: "2",
    fact: "The world record for most latte art pours in one hour is 420, set in Melbourne, 2019.",
    icon: "🏆",
  },
  {
    id: "3",
    fact: "Ethiopia is considered the birthplace of coffee, discovered over 1,000 years ago.",
    icon: "🌍",
  },
  {
    id: "4",
    fact: "Perfect microfoam requires milk heated to 55-65°C with minimal large bubbles.",
    icon: "🥛",
  },
];

export const articles: Article[] = [
  {
    id: "1",
    title: "Mastering the Rosetta: A Complete Guide",
    excerpt: "Learn the fundamentals of the most iconic latte art pattern.",
    category: "Latte Art",
    date: "Jun 25, 2026",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
    author: "MUBARISTA Editorial",
  },
  {
    id: "2",
    title: "2026 Competition Season Preview",
    excerpt: "Everything you need to know about upcoming global competitions.",
    category: "Competitions",
    date: "Jun 20, 2026",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
    author: "Competition Team",
  },
  {
    id: "3",
    title: "The Science of Milk Steaming",
    excerpt: "Understanding protein denaturation for perfect microfoam every time.",
    category: "Technique",
    date: "Jun 15, 2026",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
    author: "Dr. Coffee Science",
  },
];

export const faqs = [
  {
    question: "How do I join a competition?",
    answer:
      "Browse our competitions page, select an event, read the terms, create an account, complete your profile, and submit your application. Once approved, complete payment within 3 days to secure your spot.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept MomoPay (Rwanda), VPay, DusuPay, Visa, Mastercard, and major credit cards.",
  },
  {
    question: "Is there free content available?",
    answer:
      "Yes! Our Learning Center, Coffee History, Legend Baristas, and Schools sections are completely free for all visitors.",
  },
  {
    question: "How does the premium membership work?",
    answer:
      "Premium membership unlocks professional courses, books marketplace, tools marketplace, job listings, and advanced tutorials. Register and upgrade from your dashboard.",
  },
  {
    question: "Can I participate from any country?",
    answer:
      "Most competitions are open worldwide. Check each competition's 'Countries Allowed' section for specific restrictions.",
  },
];

export const learnCategories = [
  {
    id: "latte-art",
    title: "Latte Art Tips",
    description: "Master pours, etching, and advanced patterns",
    icon: "🎨",
    free: true,
  },
  {
    id: "brewing",
    title: "Coffee Brewing",
    description: "Pour-over, French press, AeroPress & more",
    icon: "☕",
    free: true,
  },
  {
    id: "steaming",
    title: "Milk Steaming",
    description: "Perfect microfoam techniques",
    icon: "🥛",
    free: true,
  },
  {
    id: "espresso",
    title: "Espresso Extraction",
    description: "Dial-in, grind, and pressure profiling",
    icon: "⚡",
    free: true,
  },
  {
    id: "recipes",
    title: "Coffee Recipes",
    description: "Signature drinks and seasonal specials",
    icon: "📖",
    free: true,
  },
  {
    id: "daily-tips",
    title: "Daily Tips",
    description: "Quick daily barista wisdom",
    icon: "💡",
    free: true,
  },
  {
    id: "videos",
    title: "Video Tutorials",
    description: "Step-by-step visual guides",
    icon: "🎬",
    free: true,
  },
  {
    id: "beginner",
    title: "Beginner Guides",
    description: "Start your barista journey",
    icon: "🌱",
    free: true,
  },
  {
    id: "professional",
    title: "Professional Guides",
    description: "Advanced competition techniques",
    icon: "🏅",
    free: false,
  },
  {
    id: "premium-books",
    title: "Premium Barista Books",
    description: "Curated professional library",
    icon: "📚",
    free: false,
  },
  {
    id: "certifications",
    title: "Certifications",
    description: "Earn recognized credentials",
    icon: "🎓",
    free: false,
  },
  {
    id: "advanced-art",
    title: "Advanced Latte Art",
    description: "3D art, multi-layer, competition prep",
    icon: "✨",
    free: false,
  },
];

export const books: Book[] = [
  {
    id: "1",
    title: "The Professional Barista's Handbook",
    author: "Scott Rao",
    category: "Technique",
    price: 45,
    rating: 4.9,
    reviews: 234,
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
    description: "The definitive guide to espresso extraction and milk science.",
    isPremium: true,
    currency: "RWF",
    active: true,
    order: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    title: "Latte Art: From Heart to Masterpiece",
    author: "Dhan Tamang",
    category: "Latte Art",
    price: 38,
    rating: 4.8,
    reviews: 189,
    cover: "https://images.unsplash.com/photo-1512820790801-4153cc8f5d35?w=400&q=80",
    description: "World champion techniques for competition-level latte art.",
    isPremium: true,
    currency: "RWF",
    active: true,
    order: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "3",
    title: "Coffee Atlas",
    author: "James Hoffmann",
    category: "Origin",
    price: 55,
    rating: 4.9,
    reviews: 412,
    cover: "https://images.unsplash.com/photo-1497633768975-a10d3a057069?w=400&q=80",
    description: "A comprehensive journey through the world's coffee regions.",
    isPremium: true,
    currency: "RWF",
    active: true,
    order: 3,
    createdAt: "",
    updatedAt: "",
  },
];

export const tools: Tool[] = [
  {
    id: "1",
    name: "La Marzocco Linea Mini",
    category: "Espresso Machines",
    price: 5900,
    rating: 4.9,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
    description: "Professional-grade home espresso machine.",
    brand: "La Marzocco",
    currency: "RWF",
    active: true,
    order: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    name: "Acaia Pearl Scale",
    category: "Coffee Scales",
    price: 185,
    rating: 4.8,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
    description: "Precision scale with Bluetooth connectivity.",
    brand: "Acaia",
    currency: "RWF",
    active: true,
    order: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "3",
    name: "Hario V60 Ceramic Dripper",
    category: "Accessories",
    price: 28,
    rating: 4.7,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=80",
    description: "Iconic pour-over dripper for clean, bright cups.",
    brand: "Hario",
    currency: "RWF",
    active: true,
    order: 3,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "4",
    name: "Baratza Encore ESP",
    category: "Grinder",
    price: 299,
    rating: 4.6,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80",
    description: "Entry-level espresso grinder with 40 settings.",
    brand: "Baratza",
    currency: "RWF",
    active: true,
    order: 4,
    createdAt: "",
    updatedAt: "",
  },
];

export const jobs: Job[] = [
  {
    id: "1",
    title: "Head Barista",
    company: "Blue Bottle Coffee",
    country: "USA",
    location: "San Francisco, USA",
    salary: "$55,000 - $70,000",
    experience: "3+ years",
    type: "Full-time",
    category: "Barista",
    description: "Lead a team of baristas at our flagship San Francisco location.",
    active: true,
    price: 0,
    status: "available",
    order: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    title: "Competition Barista",
    company: "Origin Coffee Roasters",
    country: "Australia",
    location: "Melbourne, Australia",
    salary: "AUD 65,000 - 80,000",
    experience: "5+ years",
    type: "Full-time",
    category: "Barista",
    description: "Represent the brand at national and international competitions.",
    active: true,
    price: 0,
    status: "available",
    order: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "3",
    title: "Café Manager & Lead Barista",
    company: "Kigali Coffee House",
    country: "Rwanda",
    location: "Kigali, Rwanda",
    salary: "RWF 3,500,000/year",
    experience: "2+ years",
    type: "Full-time",
    category: "Management",
    description: "Manage operations and train staff at a premium Kigali café.",
    active: true,
    price: 0,
    status: "available",
    order: 3,
    createdAt: "",
    updatedAt: "",
  },
];

export const schools: School[] = [
  {
    id: "1",
    name: "Specialty Coffee Association",
    location: "Global — Multiple Campuses",
    certifications: "Barista Skills, Brewing, Roasting, Green Coffee",
    programs: "Foundation, Intermediate, Professional",
    rating: 4.9,
    reviews: 890,
    contact: "education@sca.coffee",
    website: "sca.coffee",
    active: true,
    order: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    name: "London School of Coffee",
    location: "London, UK",
    certifications: "SCA Certified, City & Guilds",
    programs: "Barista Fundamentals, Latte Art Masterclass, Competition Prep",
    rating: 4.8,
    reviews: 456,
    contact: "info@lscoffee.co.uk",
    website: "lscoffee.co.uk",
    active: true,
    order: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "3",
    name: "Question Coffee Academy",
    location: "Kigali, Rwanda",
    certifications: "SCA, Women in Coffee",
    programs: "Barista Training, Quality Control, Farm to Cup",
    rating: 4.9,
    reviews: 234,
    contact: "academy@questioncoffee.com",
    website: "questioncoffee.com",
    active: true,
    order: 3,
    createdAt: "",
    updatedAt: "",
  },
];

export const timelineEvents = [
  {
    year: "850 AD",
    title: "Origin of Coffee",
    description:
      "Legend says a goat herder named Kaldi discovered coffee in Ethiopia when his goats became energetic after eating coffee cherries.",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80",
  },
  {
    year: "15th Century",
    title: "Ethiopia & Yemen",
    description:
      "Coffee cultivation and trade began in the Arabian Peninsula, with Yemen becoming the first major coffee exporter.",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  },
  {
    year: "17th Century",
    title: "Coffee Expansion",
    description:
      "Coffee houses spread across Europe, becoming centers of social and intellectual exchange.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
  },
  {
    year: "1901",
    title: "Espresso History",
    description:
      "Luigi Bezzera patented the first espresso machine, revolutionizing coffee preparation.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
  },
  {
    year: "1980s",
    title: "Latte Art Evolution",
    description:
      "Italian and American baristas pioneered milk pouring techniques, creating the latte art we know today.",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
  },
  {
    year: "Today",
    title: "Modern Coffee Industry",
    description:
      "A $100B+ global industry with specialty coffee, third-wave culture, and online competitions like MUBARISTA.",
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=80",
  },
];

export const legends: Legend[] = [
  {
    id: "1",
    name: "Dhan Tamang",
    country: "Nepal / UK",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    biography:
      "Multiple-time UK Latte Art Champion and world-renowned latte artist who revolutionized free pour techniques.",
    achievements: [
      "5x UK Latte Art Champion",
      "World Latte Art Champion 2013",
      "Author of 3 bestselling barista books",
    ],
    awards: ["World Latte Art Championship Gold", "UK Barista Championship"],
    legacy:
      "Pioneered advanced multi-layer techniques that define modern competition latte art.",
  },
  {
    id: "2",
    name: "Katsu Tanaka",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80",
    biography:
      "Japanese latte art pioneer who brought precision and artistry to the global stage.",
    achievements: [
      "World Latte Art Champion",
      "Japan Barista Championship 4x winner",
      "Latte art instructor to 10,000+ students",
    ],
    awards: ["WBC Latte Art Gold", "Japan Coffee Excellence Award"],
    legacy:
      "Known for impossible symmetry and the iconic 'Tanaka Pour' technique.",
  },
  {
    id: "3",
    name: "Emma Chapman",
    country: "Australia",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    biography:
      "Trailblazing Australian barista who championed women in coffee competitions worldwide.",
    achievements: [
      "World Barista Championship Finalist",
      "Founded Women in Coffee Alliance",
      "Mentored 50+ competition winners",
    ],
    awards: ["Australian Barista Champion", "Global Coffee Impact Award"],
    legacy:
      "Transformed the competitive landscape by advocating for diversity and mentorship.",
  },
];

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/learn", label: "Learn" },
  { href: "/jobs", label: "Barista Jobs" },
  { href: "/books", label: "Books" },
  { href: "/tools", label: "Tools" },
  { href: "/schools", label: "Schools" },
  { href: "/coffee-history", label: "Coffee History" },
  { href: "/legends", label: "Legends" },
  { href: "/tips", label: "Tips & Skills" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
