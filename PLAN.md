# folio — Build Plan

> Current status: **Active development** — core features complete, polish and enhancements ongoing.

---

## 1. Overview

folio is a full-stack portfolio-as-a-service platform. Users register, select a profile type (individual / team / business), and build a rich portfolio page through a guided editor. Public visitors browse, search, and contact portfolio owners. The app uses Supabase for auth and data, Refine for the meta-framework layer, and Tailwind + Framer Motion for UI.

---

## 2. Architecture

```
Client (Next.js Pages Router)
  │
  ├── Refine AuthProvider ──► Supabase Auth (email/password, Google, GitHub)
  ├── Zustand Store ──► localStorage (persisted user state)
  ├── React Hook Form + Zod ──► Client-side validation
  ├── Supabase JS Client ──► PostgreSQL (profiles, portfolio_contents)
  ├── Resend ──► Contact form emails
  └── Google Gemini AI ──► Resume parsing
```

### Data Flow

1. Auth events → Supabase Auth → DB trigger creates `profiles` row
2. OAuth callback → `/auth/callback` → hydrates Zustand store → redirect to portfolio
3. Editor forms → upsert `portfolio_contents` JSONB → re-render portfolio display
4. Public visit → SSR fetch `profiles` + `portfolio_contents` → render sections

---

## 3. Done

- [x] Supabase project setup with all migrations (profiles table, portfolio_contents table, auth trigger, RLS policies, storage bucket)
- [x] Email/password sign-up (2-step form with profile type selection, validation, password strength meter)
- [x] OAuth sign-in/up via Google and GitHub
- [x] Sign-in page (email/password + forgot password flow)
- [x] Password reset flow
- [x] Auth callback handling (profile lookup, sessionStorage type restore, redirect to portfolio)
- [x] Auth provider (Refine `authProvider`) with login, logout, register, check, getIdentity
- [x] Zustand store with localStorage persist
- [x] Portfolio page rendering (Hero, About, Skills, Projects, Experience, Education, Certificates, Contact)
- [x] Floating navigation sidebar
- [x] Profile type routing (`/u/`, `/t/`, `/b/`)
- [x] Route type validation (prevent cross-type access)
- [x] Portfolio content editor (all sections)
- [x] Profile editor (photo upload to Supabase Storage, personal info)
- [x] Deep-link editing (`/u/[username]/edit-*`)
- [x] Resume auto-fill (PDF upload → Gemini AI → structured JSON → Supabase upsert)
- [x] Explore/gallery page (search, filter by type, pagination)
- [x] Contact form with Resend email
- [x] Dark/light/system theme toggle
- [x] Image proxy for avatar URLs (bypass Firefox ETP)
- [x] Supabase keep-alive GitHub Action
- [x] Cursor trail effect
- [x] Toast notifications and popup modals
- [x] 404 page

---

## 4. In Progress / Next

- [ ] OAuth-only account creation (no email/password sign-up)
- [ ] Email verification enforcement
- [ ] Username availability check (async validation on sign-up)
- [ ] Portfolio page mobile responsiveness polish
- [ ] SEO metadata (per-portfolio open graph tags)
- [ ] Analytics integration
- [ ] Portfolio theme/color customization
- [ ] Image gallery lightbox improvements
- [ ] Rate limiting on contact form and resume upload
- [ ] Unit tests (Vitest) and E2E tests (Playwright)

---

## 5. Technical Decisions

| Decision               | Rationale                                                     |
| ---------------------- | ------------------------------------------------------------- |
| Pages Router           | Already in use; simpler SSR for portfolio pages               |
| Supabase Auth          | Drop-in OAuth + email auth, DB triggers for profile creation  |
| JSONB columns          | Flexible schema for portfolio sections without separate tables|
| DB trigger for profiles| Atomic profile creation on auth user insert — no race cond.   |
| Zustand + localStorage | Lightweight state; persists user across page navigations      |
| Refine                 | Provides auth provider interface, CRUD hooks, admin UI        |
| shadcn/ui              | Unstyled primitives that compose with Tailwind                |
| Gemini AI              | Free tier, good at extracting structured data from resumes    |
| Resend                 | Simple transactional email API with good deliverability       |

---

## 6. Future Considerations

- Multi-user team portfolios (shared editing)
- Custom domain support
- Portfolio analytics dashboard
- Template/themes marketplace
- Drag-and-drop section reordering
- Import from LinkedIn
- PWA / offline support
