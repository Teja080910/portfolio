# folio — Teams Implementation Plan

> Status: **In progress** — schema, workspaces, invitations, content sharing, and public team pages.

## 1. Model

- Every user keeps their own profile (`/u/username`, `/b/slug`).
- A **team** is a separate entity (`/t/slug`) owned by one user with any number of members.
- A user can belong to many teams in addition to their personal portfolio.
- Team pages show: team identity + member cards (linking to member portfolios) + only the content items members explicitly shared to that team, with attribution.
- Members pick which of their own items (projects, skills, …) are shared to a team from the team workspace.

## 2. Data model

| Table | Purpose |
| --- | --- |
| `folio_teams` | Team identity: owner, unique slug, name, tagline, description, logo, visibility |
| `folio_team_members` | Membership: `(team_id, user_id)` PK, role `owner` \| `member` |
| `folio_team_invites` | Email/link invites: hashed token, optional email, expiry, accepted/revoked |
| `folio_team_content_shares` | `(team_id, user_id, section, item_id)` — per-item grants for team pages |

> Tables and RPCs are prefixed with `folio_` because the local Supabase instance is
> shared with other projects (e.g. `drawer`) that already own generic `teams` /
> `team_members` tables. RPCs: `folio_get_team_portfolio`, `folio_get_team_members`,
> `folio_get_public_teams`, `folio_get_team_invite`, `folio_accept_team_invite`,
> `folio_get_my_pending_invites`.

### RLS helpers

`is_team_member(team_id, user_id)` and `is_team_owner(team_id, user_id)` are `security definer` helpers to avoid recursive RLS subqueries.

### Public reads

Team page data is fetched through `get_team_portfolio(slug)` (`security definer`) so private members' shared items work and unshared items never leak — the RPC returns only shared, visible items.

## 3. Key decisions

- Teams live in their own table (not `profiles`) so one user can own a personal profile **and** multiple teams.
- Sharing is a join table (not `teamIds` inside JSONB) so RLS can enforce it and the API-token system can manage it later.
- Private members still appear as limited cards (name, avatar, role) on the team page; their member card only links to their personal portfolio when that portfolio is public.
- Team pages use a generic aggregated layout (no template) and have no contact form in v1.
- Owner + Member roles only for now; owner transfer is future work.
- Legacy `profiles.type = 'team'` rows are migrated: a `teams` row is created (slug = username, owner = profile), all existing items are auto-shared, and the profile becomes a personal `user` profile so nothing is lost.

## 4. Phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Migrations (`teams`, `team_members`, `team_invites`, `team_content_shares`), RLS, RPCs, legacy migration, TS interfaces, service layer | done |
| 2 | `/teams` hub (create team, memberships, pending invites) + `/t/[slug]/workspace` (members, invites, settings, leave) | done |
| 3 | Per-item share toggles in workspace + invite email API (Resend) | done |
| 4 | Public team page (`get_team_portfolio`), member links, attribution, explore Teams tab | done |
| 5 | Onboarding/nav updates, docs, API-token team support | partial |

## 5. Routes

| Route | Description |
| --- | --- |
| `/teams` | Hub: my teams, create team, pending invites |
| `/t/[slug]` | Public team portfolio |
| `/t/[slug]/workspace` | Member/owner workspace (settings, members, invites, shared content) |
| `/invite/[token]` | Accept invitation |
| `/api/team-invite` | Sends invite email (session-authenticated, owner-verified) |

## 6. Follow-ups

- API token support for team operations (`/api/portfolio` team scoping).
- Owner transfer / multiple admins.
- Team page template/customization, contact section.
- Rate limiting on invite email and team creation.
