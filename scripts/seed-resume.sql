DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Look up the UUID for the provided email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'tejasimma36@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User tejasimma36@gmail.com not found in auth.users!';
  END IF;

  -- Upsert the portfolio_contents using the dynamically fetched UUID
  INSERT INTO public.portfolio_contents (
    user_id, 
    about, 
    skills, 
    experience, 
    education, 
    projects, 
    certificates, 
    updated_at
  ) VALUES (
    v_user_id,
    
    -- ABOUT
    jsonb_build_object(
      'id', gen_random_uuid(),
      'type', 'Full Stack Developer',
      'list', jsonb_build_array(
        'Full Stack Developer with expertise in MERN & MEAN stack, proficient in both frontend and backend development.',
        'Skilled in building scalable web applications, optimizing performance, and leading projects to enhance user experience.'
      ),
      'person', v_user_id,
      'show', true
    ),
    
    -- SKILLS
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'skilltype', 'Frontend', 'skills', jsonb_build_array('React.js', 'AngularJS', 'Next.js', 'React Native', 'HTML5', 'CSS3', 'JavaScript', 'Bootstrap', 'Tailwind CSS', 'Refine'), 'description', 'Frontend Development', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'skilltype', 'Backend', 'skills', jsonb_build_array('Node.js', 'Express.js', 'NestJS', 'Flask', 'PHP', 'overnightJs'), 'description', 'Backend Development', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'skilltype', 'Auth', 'skills', jsonb_build_array('Keycloak', 'Supabase'), 'description', 'Authentication & Authorization', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'skilltype', 'Databases', 'skills', jsonb_build_array('MongoDB', 'MySQL', 'PostgreSQL (PGSQL)'), 'description', 'Databases', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'skilltype', 'Languages', 'skills', jsonb_build_array('C', 'Python', 'Java', 'C++', 'JavaScript', 'PHP', 'OOPS'), 'description', 'Programming Languages', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'skilltype', 'Others', 'skills', jsonb_build_array('RESTful APIs', 'Responsive Web Design', 'Team Leadership', 'Agile', 'MERN Stack', 'MEAN Stack'), 'description', 'Other Skills', 'show', true)
    ),
    
    -- EXPERIENCE
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'type', 'Full-Time', 'location', 'Bengaluru, Karnataka', 'duration', 'June 2025 - Present', 'role', 'Full-Stack Developer', 'decription', 'Built and deployed Kaalgyani astrology platform using Next.js, shadcn UI, and MySQL. Improved backend performance by 40%. Led full-stack development of Pathfinder platform for Art of Living.', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'type', 'Internship', 'location', 'Hyderabad', 'duration', 'October 2024 - May 2025', 'role', 'Full-Stack Developer Intern', 'decription', 'Built real-time gamified wellness platform using MEAN stack. Developed leaderboard system. Improved system performance by optimizing backend APIs and Angular rendering.', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'type', 'Internship', 'location', 'Bengaluru, Karnataka', 'duration', 'June 2023 - September 2023', 'role', 'Full Stack Developer Internship', 'decription', 'Developed land purchase platform using MERN stack. Engineered platform with React.js, Node.js, Express.js, MongoDB enhancing performance by 20%.', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'type', 'Internship', 'location', 'Bhimavaram', 'duration', 'August 2024 - August 2024', 'role', 'Trainee', 'decription', 'Conducted 15-day MERN stack bootcamp at SRKR Engineering College. Delivered hands-on lessons on React.js, Node.js, Express.js, MongoDB.', 'show', true)
    ),
    
    -- EDUCATION
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'name', 'Sagi Rama Krishnam Raju Engineering College', 'duration', '2021 - 2025', 'course', 'Bachelor of Technology', 'branch', 'Minor in Computer Science Engineering', 'keyachivements', '8.8 CGPA', 'show', true),
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'name', 'Narayana Junior College', 'duration', '2018 - 2020', 'course', 'Board of Intermediate Education', 'branch', 'Minor in Maths, Physics & Chemistry', 'keyachivements', '96.4%', 'show', true)
    ),
    
    -- PROJECTS
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'name', 'AST Admin', 'description', 'Developed a web application to manage attendance, bootcamps, and hackathons, streamlining student and college processes.', 'duration', '2024', 'gitlink', '', 'weblink', 'ast-admin.in', 'logo', '', 'photos', jsonb_build_array(), 'skills', jsonb_build_array('Web App', 'Attendance Tracking', 'Real-time Chat', 'Project Management'), 'show', true)
    ),
    
    -- CERTIFICATES
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'person', v_user_id, 'name', 'VEDIC VISION - 2K24 HACKATHON', 'duration', '2024', 'link', '', 'photo', '', 'show', true)
    ),
    
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    about = EXCLUDED.about,
    skills = EXCLUDED.skills,
    experience = EXCLUDED.experience,
    education = EXCLUDED.education,
    projects = EXCLUDED.projects,
    certificates = EXCLUDED.certificates,
    updated_at = now();

END $$;
