# folio — Portfolio Builder

A full-stack SaaS portfolio builder where users sign up, create customizable portfolio pages (About, Skills, Projects, Experience, Education, Certificates), and share them via unique URL slugs. Built with Next.js (Pages Router), Supabase, Tailwind CSS, and Framer Motion.

## Tech Stack

| Category       | Technology                                            |
| -------------- | ----------------------------------------------------- |
| Framework      | Next.js 15 (Pages Router)                             |
| Language       | TypeScript                                            |
| Styling        | Tailwind CSS + shadcn/ui                              |
| Animation      | Framer Motion                                         |
| State          | Zustand (persisted to localStorage)                   |
| Database/Auth  | Supabase (PostgreSQL + Auth)                          |
| Forms          | React Hook Form + Zod                                 |
| Meta-framework | Refine (auth provider, CRUD hooks)                    |
| Icons          | Lucide React                                          |
| Email          | Resend                                                |
| AI             | Google Generative AI (Gemini) — resume auto-fill      |
| Theme          | next-themes (light / dark / system)                   |

## Features

- **Authentication** — Email/password sign-up (with password strength meter) and OAuth via Google/GitHub
- **Profile types** — Individual, Team, or Business (routed to `/u/`, `/t/`, `/b/`)
- **Portfolio editor** — Manage About, Skills, Projects, Experience, Education, and Certificates sections
- **Resume auto-fill** — Upload a PDF resume; Gemini AI extracts structured data and populates your portfolio
- **Public gallery** — Browse, search, and filter all public portfolios
- **Contact form** — Visitors can send messages via each portfolio's contact section (powered by Resend)
- **Dark/light theme** — Toggle between light, dark, and system preferences
- **Image proxy** — Proxies Google/GitHub avatar images to same-origin to bypass browser tracking protection

## Getting Started

### Prerequisites

- Node.js >= 18
- A Supabase project (free tier works)
- A Resend API key (for contact form emails)
- (Optional) A Google Gemini API key (for resume auto-fill)

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=sender@example.com
GEMINI_API_KEY=your_gemini_api_key       # optional
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Database Setup

The `supabase/migrations/` directory contains all SQL migrations. Apply them with:

```bash
supabase db push
```

Or copy the migration files into your Supabase project's SQL editor and run them in order.

Key migrations:
- Creates `public.profiles` and `public.portfolio_contents` tables
- Sets up the `handle_new_user()` trigger that auto-creates a profile row when a new auth user signs up
- Configures RLS policies and the `profile-photos` storage bucket

## Project Structure

```
src/
├── app/
│   ├── components/       # Reusable page-level components (explore, portfolio, nav, etc.)
│   ├── forms/            # Sign-in, sign-up, profile editor, portfolio editor forms
│   ├── schemas/          # Zod validation schemas
│   └── services/         # Supabase query wrappers
├── components/ui/        # shadcn/ui primitives
├── lib/                  # Supabase client, Zustand store, TypeScript interfaces, utilities
├── pages/                # Next.js routes
│   ├── components/       # Portfolio section display components (about, skills, etc.)
│   └── api/              # API routes (send-email, parse-resume, image-proxy)
├── styles/               # Global CSS
└── utils/                # Auth provider, error handling, helpers
```

## Routes

| Route                   | Description                               |
| ----------------------- | ----------------------------------------- |
| `/`                     | Public gallery / explore page             |
| `/explore`              | Gallery page                              |
| `/sign-in`              | Sign-in page                              |
| `/sign-up`              | Sign-up page (2-step)                     |
| `/reset-password`       | Set new password                          |
| `/auth/callback`        | OAuth callback handler                    |
| `/user`                 | User workspace (profile + portfolio edit) |
| `/u/[username]`         | User portfolio page                       |
| `/t/[slug]`             | Team portfolio page                       |
| `/b/[slug]`             | Business portfolio page                   |
| `/api/send-email`       | Contact form email endpoint               |
| `/api/parse-resume`     | Resume auto-fill endpoint                 |
| `/api/image-proxy`      | Avatar image proxy                        |

## Scripts

```bash
npm run dev        # Start dev server (port 3001)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:migrate # Push Supabase migrations
npm run db:diff    # Show local DB diff
npm run db:new     # Create a new migration
npm run db:reset   # Reset local Supabase DB
```
