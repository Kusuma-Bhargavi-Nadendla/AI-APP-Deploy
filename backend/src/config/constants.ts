import { QUIZ_QUESTIONS_COUNT } from "../types"
import jwt, { SignOptions } from 'jsonwebtoken';
export const JWT_CONFIG :SignOptions = {
  expiresIn: "7d",
};

export const QUIZ_CONFIG = {
  defaultQuestionsCount: QUIZ_QUESTIONS_COUNT.THREE,
  minDifficulty: 1,
  maxDifficulty: 5,
  timeLimitEnabled:false,
  timeLimitPerQuestionEnabled: false,
};
export const STATIC_CATEGORIES = [
  { id: 'cat_001', name: 'Artificial Intelligence', description: 'Latest breakthroughs in AI, machine learning, and automation.', trending: true },
  { id: 'cat_002', name: 'Personal Finance', description: 'Budgeting, investing, and financial independence strategies.', trending: false },
  { id: 'cat_003', name: 'Mental Wellness', description: 'Mindfulness, therapy, and emotional resilience techniques.', trending: false },
  { id: 'cat_004', name: 'Sustainable Living', description: 'Eco-friendly habits, zero-waste tips, and green tech.', trending: false },
  { id: 'cat_005', name: 'Remote Work', description: 'Tools, productivity hacks, and work-life balance for digital nomads.', trending: false },
  { id: 'cat_006', name: 'Fitness & Nutrition', description: 'Workout plans, diet guides, and holistic health approaches.', trending: false},
  { id: 'cat_007', name: 'Cryptocurrency', description: 'Bitcoin, Ethereum, DeFi, and blockchain innovations.', trending:false },
  { id: 'cat_008', name: 'Digital Marketing', description: 'SEO, social media, and growth hacking for businesses.', trending:false },
  { id: 'cat_009', name: 'Parenting', description: 'Child development, education, and family wellness.', trending:false },
  { id: 'cat_010', name: 'Travel Hacks', description: 'Budget travel, hidden gems, and sustainable tourism.', trending: false},
  { id: 'cat_011', name: 'Web Development', description: 'Frontend, backend, and full-stack coding tutorials.', trending: true },
  { id: 'cat_012', name: 'Climate Tech', description: 'Renewable energy, carbon capture, and green startups.', trending: false},
  { id: 'cat_013', name: 'Entrepreneurship', description: 'Startup advice, funding, and scaling strategies.', trending: true },
  { id: 'cat_014', name: 'Photography', description: 'Camera gear, editing tips, and visual storytelling.', trending: true },
  { id: 'cat_015', name: 'Language Learning', description: 'Apps, immersion techniques, and fluency tips.', trending: false},
  { id: 'cat_016', name: 'Home Automation', description: 'Smart homes, IoT devices, and DIY tech setups.', trending: true },
  { id: 'cat_017', name: 'Minimalism', description: 'Decluttering, intentional living, and simple lifestyles.', trending: true },
  { id: 'cat_018', name: 'Gaming', description: 'Esports, indie games, and gaming hardware reviews.', trending: true },
  { id: 'cat_019', name: 'Data Science', description: 'Analytics, visualization, and big data tools.', trending: true },
  { id: 'cat_020', name: 'Vegan Recipes', description: 'Plant-based meals, nutrition, and cooking hacks.', trending: false },
  { id: 'cat_021', name: 'Cybersecurity', description: 'Privacy tools, threat prevention, and ethical hacking.', trending: true },
  { id: 'cat_022', name: 'Freelancing', description: 'Platforms, contracts, and income diversification.', trending: true },
  { id: 'cat_023', name: 'Urban Gardening', description: 'Balcony farms, hydroponics, and city green spaces.', trending: false},
  { id: 'cat_024', name: 'Podcasting', description: 'Equipment, editing, and audience growth strategies.', trending: false},
  { id: 'cat_025', name: 'Electric Vehicles', description: 'EV reviews, charging networks, and future mobility.', trending: false},
  { id: 'cat_026', name: 'Yoga & Meditation', description: 'Guided practices, breathing techniques, and mindfulness.', trending: false},
  { id: 'cat_027', name: '3D Printing', description: 'Design, prototyping, and maker community projects.', trending: false},
  { id: 'cat_028', name: 'Stock Market', description: 'Trading strategies, analysis, and portfolio management.', trending: false },
  { id: 'cat_029', name: 'DIY Home Repair', description: 'Plumbing, electrical, and renovation tutorials.', trending: false},
  { id: 'cat_030', name: 'Space Exploration', description: 'NASA, SpaceX, and the future of interplanetary travel.', trending: false},
];