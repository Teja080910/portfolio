create table if not exists public.guide_content (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  show boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guide_content enable row level security;

create policy "Public can read guide content"
  on public.guide_content for select
  using (show = true);

create policy "Authenticated users can manage guide content"
  on public.guide_content for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create or replace function public.set_guide_content_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger guide_content_updated_at
  before update on public.guide_content
  for each row execute function public.set_guide_content_updated_at();

insert into public.guide_content (section, title, subtitle, content, sort_order) values
('intro', 'What is a Portfolio?', 'Your digital identity, all in one link.', '{"paragraphs":["A portfolio is your personal or professional showcase on the internet — a single link that tells the world who you are, what you have built, and how to reach you.","Think of it as your digital business card, resume, and project gallery combined into one beautiful page.","Whether you are a developer, content creator, or marketer, a portfolio helps you stand out and get discovered."],"cards":[{"title":"Who You Are","description":"Tell your story with an About section, profile photo, and links.","icon":"compass"},{"title":"What You Have Done","description":"Showcase your best work — projects, content, or campaigns.","icon":"rocket"},{"title":"How to Reach You","description":"Make it easy for people to connect via email, phone, or social links.","icon":"users"}]}', 1),

('benefits', 'What Can You Do With It?', 'More than just a website.', '{"paragraphs":["Your portfolio is not just a page — it is your online advantage."],"features":[{"title":"Showcase Your Work","description":"Present projects, content, skills, and experience in a polished layout.","icon":"sparkles"},{"title":"Get Discovered","description":"SEO-friendly profiles that show up when people search for your name or skills.","icon":"compass"},{"title":"Share Anywhere","description":"One link for your bio, resume, email signature, or business card.","icon":"rocket"},{"title":"Auto-Fill from Resume","description":"Upload your resume and let AI populate your portfolio instantly.","icon":"users"}]}', 2),

('template', 'Choose Your Template', 'Pick the template that fits your profession.', '{"templates":[{"id":"developer","name":"Developer","description":"For software engineers, web developers, and programmers. Showcase your projects with GitHub links, tech stacks, and live demos.","icon":"code","whoFor":["Full-stack developers","Frontend / Backend engineers","Mobile developers","Open source contributors"],"sections":["About","Skills","Projects (with GitHub & live demo links)","Experience","Education","Certificates"]},{"id":"content_creator","name":"Content Creator","description":"For YouTubers, bloggers, influencers, and podcasters. Display your content, channels, and brand collaborations.","icon":"video","whoFor":["YouTubers & streamers","Bloggers & writers","Social media influencers","Podcasters & newsletter creators"],"sections":["About","Content Channels (YouTube, Instagram, etc.)","Content Portfolio (videos, articles, reels)","Creator Tools (camera, software, gear)","Brand Collaborations"]},{"id":"marketer","name":"Marketer","description":"For marketing professionals, growth hackers, and SEO specialists. Highlight campaigns, skills, and brand partnerships.","icon":"trending-up","whoFor":["Digital marketers","SEO specialists","Content strategists","Growth hackers","Social media managers"],"sections":["About","Skills","Projects (campaigns & results)","Experience","Brand Collaborations"]}]}', 3),

('howto_developer', 'How to Build a Developer Portfolio', 'Step by step guide.', '{"steps":[{"number":1,"title":"Fill in Your About Section","description":"Add your role, a brief intro, and choose highlight packs that match your focus (Frontend, Backend, Freelancer, Student, Founder)."},{"number":2,"title":"Add Your Skills","description":"Group your skills by category — languages, frameworks, tools, databases. Use the autocomplete suggestions to speed things up."},{"number":3,"title":"Add Your Projects","description":"Show your best work. Add project name, description, photos (at least 3), GitHub link, and live demo link. The more detail, the better."},{"number":4,"title":"Add Experience & Education","description":"List your work history and educational background. Include company names, roles, dates, and key achievements."},{"number":5,"title":"Add Certificates","description":"Got certifications? Add them here with the issuing organization, date, and verification link."},{"number":6,"title":"Preview & Share","description":"Click your username to see your live portfolio. Copy the link and share it in your bio, resume, or email signature."}]}', 4),

('howto_creator', 'How to Build a Content Creator Portfolio', 'Step by step guide.', '{"steps":[{"number":1,"title":"Fill in Your About Section","description":"Introduce yourself — your niche, what you create, and what your audience can expect."},{"number":2,"title":"Add Your Content Channels","description":"Link your YouTube, Instagram, TikTok, blog, podcast, or newsletter. Include your handles and subscriber counts."},{"number":3,"title":"Build Your Content Portfolio","description":"Add your best content pieces — videos, articles, reels, podcasts. Include thumbnails, descriptions, view counts, and links."},{"number":4,"title":"Add Brand Collaborations","description":"Showcase brands you have worked with. Add brand names, descriptions, logos, and links to the collaborations."},{"number":5,"title":"Add Your Creator Tools","description":"List the tools you use — camera, microphone, editing software, lighting. Categorize them for easy browsing."},{"number":6,"title":"Preview & Share","description":"View your live portfolio and share the link everywhere — your social bios, media kits, and email signatures."}]}', 5),

('howto_marketer', 'How to Build a Marketing Portfolio', 'Step by step guide.', '{"steps":[{"number":1,"title":"Fill in Your About Section","description":"Describe your marketing focus — SEO, content, growth, social media, or paid ads."},{"number":2,"title":"Add Your Skills","description":"Highlight your core marketing skills: SEO, analytics, copywriting, email marketing, social media, PPC, etc."},{"number":3,"title":"Add Campaign Projects","description":"Showcase marketing campaigns you have run. Include results, metrics, strategies, and links where possible."},{"number":4,"title":"Add Experience","description":"List your marketing roles, agencies, or freelance work. Include company names, positions, and key achievements."},{"number":5,"title":"Add Brand Collaborations","description":"Highlight brands and companies you have partnered with on marketing initiatives."},{"number":6,"title":"Preview & Share","description":"Preview your portfolio and share the link on LinkedIn, in your resume, or in pitch emails to potential clients."}]}', 6);
