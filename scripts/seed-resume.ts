import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually to avoid needing dotenv dependency
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx scripts/seed-resume.ts <email> <password>");
  process.exit(1);
}

const generateId = () => crypto.randomUUID();

// Parsed resume data
const data = {
  about: {
    id: generateId(),
    type: "Full Stack Developer",
    list: [
      "Full Stack Developer with expertise in MERN & MEAN stack, proficient in both frontend and backend development.",
      "Skilled in building scalable web applications, optimizing performance, and leading projects to enhance user experience."
    ],
    person: "", // Will be set after login
    show: true,
  },
  skills: [
    { id: generateId(), person: "", skilltype: "Frontend", skills: ["React.js", "AngularJS", "Next.js", "React Native", "HTML5", "CSS3", "JavaScript", "Bootstrap", "Tailwind CSS", "Refine"], description: "Frontend Development", show: true },
    { id: generateId(), person: "", skilltype: "Backend", skills: ["Node.js", "Express.js", "NestJS", "Flask", "PHP", "overnightJs"], description: "Backend Development", show: true },
    { id: generateId(), person: "", skilltype: "Auth", skills: ["Keycloak", "Supabase"], description: "Authentication & Authorization", show: true },
    { id: generateId(), person: "", skilltype: "Databases", skills: ["MongoDB", "MySQL", "PostgreSQL (PGSQL)"], description: "Databases", show: true },
    { id: generateId(), person: "", skilltype: "Languages", skills: ["C", "Python", "Java", "C++", "JavaScript", "PHP", "OOPS"], description: "Programming Languages", show: true },
    { id: generateId(), person: "", skilltype: "Others", skills: ["RESTful APIs", "Responsive Web Design", "Team Leadership", "Agile", "MERN Stack", "MEAN Stack"], description: "Other Skills", show: true },
  ],
  experience: [
    { id: generateId(), person: "", type: "Full-Time", location: "Bengaluru, Karnataka", duration: "June 2025 - Present", role: "Full-Stack Developer", decription: "Built and deployed Kaalgyani astrology platform using Next.js, shadcn UI, and MySQL. Improved backend performance by 40%. Led full-stack development of Pathfinder platform for Art of Living.", show: true },
    { id: generateId(), person: "", type: "Internship", location: "Hyderabad", duration: "October 2024 - May 2025", role: "Full-Stack Developer Intern", decription: "Built real-time gamified wellness platform using MEAN stack. Developed leaderboard system. Improved system performance by optimizing backend APIs and Angular rendering.", show: true },
    { id: generateId(), person: "", type: "Internship", location: "Bengaluru, Karnataka", duration: "June 2023 - September 2023", role: "Full Stack Developer Internship", decription: "Developed land purchase platform using MERN stack. Engineered platform with React.js, Node.js, Express.js, MongoDB enhancing performance by 20%.", show: true },
    { id: generateId(), person: "", type: "Internship", location: "Bhimavaram", duration: "August 2024 - August 2024", role: "Trainee", decription: "Conducted 15-day MERN stack bootcamp at SRKR Engineering College. Delivered hands-on lessons on React.js, Node.js, Express.js, MongoDB.", show: true }
  ],
  education: [
    { id: generateId(), person: "", name: "Sagi Rama Krishnam Raju Engineering College", duration: "2021 - 2025", course: "Bachelor of Technology", branch: "Minor in Computer Science Engineering", keyachivements: "8.8 CGPA", show: true },
    { id: generateId(), person: "", name: "Narayana Junior College", duration: "2018 - 2020", course: "Board of Intermediate Education", branch: "Minor in Maths, Physics & Chemistry", keyachivements: "96.4%", show: true }
  ],
  projects: [
    { id: generateId(), person: "", name: "AST Admin", description: "Developed a web application to manage attendance, bootcamps, and hackathons, streamlining student and college processes.", duration: "2024", gitlink: "", weblink: "ast-admin.in", logo: "", photos: [], skills: ["Web App", "Attendance Tracking", "Real-time Chat", "Project Management"], show: true }
  ],
  certificates: [
    { id: generateId(), person: "", name: "VEDIC VISION - 2K24 HACKATHON", duration: "2024", link: "", photo: "", show: true }
  ]
};

async function main() {
  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData?.user) {
    console.error("Login failed:", authError?.message || "Unknown error");
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log("Logged in successfully. User ID:", userId);

  // Update 'person' field with user ID
  data.about.person = userId;
  data.skills.forEach(s => s.person = userId);
  data.experience.forEach(e => e.person = userId);
  data.education.forEach(e => e.person = userId);
  data.projects.forEach(p => p.person = userId);
  data.certificates.forEach(c => c.person = userId);

  console.log("Upserting portfolio_contents...");
  
  // The upsert handles inserting if it doesn't exist, updating if it does
  // The table requires user_id. Ensure we only update this user's record.
  const { error: upsertError } = await supabase.from('portfolio_contents').upsert({
    user_id: userId,
    about: data.about,
    skills: data.skills,
    experience: data.experience,
    education: data.education,
    projects: data.projects,
    certificates: data.certificates,
    updated_at: new Date().toISOString()
  });

  if (upsertError) {
    console.error("Failed to upsert data:", upsertError.message);
    process.exit(1);
  }

  console.log("Data successfully inserted/updated!");
}

main().catch(err => {
  console.error("An unexpected error occurred:", err);
  process.exit(1);
});
