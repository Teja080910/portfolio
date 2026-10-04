import { describe, expect, it } from "vitest"
import { buildTeamApiPayload, countSharedVisibleProjects, normalizeOrigin } from "./team-api"

describe("normalizeOrigin", () => {
  it("strips trailing slashes", () => {
    expect(normalizeOrigin("https://portfoli.store/")).toBe("https://portfoli.store")
    expect(normalizeOrigin("https://portfoli.store///")).toBe("https://portfoli.store")
  })
})

describe("countSharedVisibleProjects", () => {
  it("counts only shared projects that exist and are visible", () => {
    const shares = [
      { user_id: "a", item_id: "p1" },
      { user_id: "a", item_id: "p2" },
      { user_id: "b", item_id: "p3" },
      { user_id: "b", item_id: "p4" },
    ]
    const contents = [
      {
        user_id: "a",
        projects: [
          { id: "p1", show: true },
          { id: "p2", show: false },
        ],
      },
      { user_id: "b", projects: [{ id: "p3" }] },
    ]

    expect(countSharedVisibleProjects(shares, contents)).toBe(2)
  })

  it("ignores malformed project rows", () => {
    const shares = [{ user_id: "a", item_id: "p1" }]
    const contents = [{ user_id: "a", projects: [null, "nope", { show: true }, { id: "p1" }] }]

    expect(countSharedVisibleProjects(shares, contents)).toBe(1)
  })

  it("returns 0 when there are no shares", () => {
    expect(countSharedVisibleProjects([], [])).toBe(0)
  })
})

describe("buildTeamApiPayload", () => {
  const team = {
    id: "team-1",
    slug: "ast",
    name: "AST",
    tagline: "We build apps",
    description: "Arka Sodhara Tech",
    logo: "https://cdn.example.com/logo.png",
  }

  it("maps members, sorts owner first and builds public URLs", () => {
    const payload = buildTeamApiPayload({
      team,
      memberships: [
        { user_id: "member-1", role: "member" },
        { user_id: "owner-1", role: "owner" },
      ],
      profiles: [
        {
          id: "member-1",
          username: "sarah",
          firstname: "Sarah",
          lastname: "Creator",
          photo: "https://cdn.example.com/sarah.png",
          role: "Content Creator",
          type: "user",
          show: true,
        },
        {
          id: "owner-1",
          username: "teja",
          firstname: "Teja",
          lastname: "",
          photo: null,
          role: "Developer",
          type: "user",
          show: true,
        },
      ],
      shares: [
        { user_id: "owner-1", item_id: "p1" },
        { user_id: "member-1", item_id: "p2" },
      ],
      contents: [
        { user_id: "owner-1", projects: [{ id: "p1", show: true }] },
        { user_id: "member-1", projects: [{ id: "p2" }] },
      ],
      origin: "https://portfoli.store/",
    })

    expect(payload.portfolioUrl).toBe("https://portfoli.store/t/ast")
    expect(payload.memberCount).toBe(2)
    expect(payload.projectsCount).toBe(2)
    expect(payload.members.map((member) => member.role)).toEqual(["owner", "member"])
    expect(payload.members[0]).toMatchObject({
      username: "teja",
      name: "Teja",
      profileUrl: "https://portfoli.store/u/teja",
    })
    expect(payload.members[1]).toMatchObject({
      username: "sarah",
      name: "Sarah Creator",
      jobRole: "Content Creator",
      profileUrl: "https://portfoli.store/u/sarah",
    })
  })

  it("hides profile URLs for private profiles and falls back to username", () => {
    const payload = buildTeamApiPayload({
      team,
      memberships: [{ user_id: "private-1", role: "member" }],
      profiles: [
        {
          id: "private-1",
          username: "ghost",
          firstname: "",
          lastname: "",
          photo: null,
          role: null,
          type: "user",
          show: false,
        },
      ],
      shares: [],
      contents: [],
      origin: "https://portfoli.store",
    })

    expect(payload.members[0].name).toBe("ghost")
    expect(payload.members[0].profileUrl).toBeNull()
    expect(payload.members[0].jobRole).toBeNull()
    expect(payload.members[0].photo).toBeNull()
  })

  it("links business profiles under /b/", () => {
    const payload = buildTeamApiPayload({
      team,
      memberships: [{ user_id: "biz-1", role: "member" }],
      profiles: [
        {
          id: "biz-1",
          username: "acme",
          firstname: "Acme",
          lastname: "Inc",
          photo: null,
          role: "Agency",
          type: "business",
          show: true,
        },
      ],
      shares: [],
      contents: [],
      origin: "https://portfoli.store",
    })

    expect(payload.members[0].profileUrl).toBe("https://portfoli.store/b/acme")
  })

  it("skips memberships without a profile row", () => {
    const payload = buildTeamApiPayload({
      team,
      memberships: [
        { user_id: "missing", role: "member" },
        { user_id: "known", role: "owner" },
      ],
      profiles: [
        {
          id: "known",
          username: "known",
          firstname: "Known",
          lastname: "User",
          photo: null,
          role: "Dev",
          type: "user",
          show: true,
        },
      ],
      shares: [],
      contents: [],
      origin: "https://portfoli.store",
    })

    expect(payload.memberCount).toBe(1)
    expect(payload.members[0].username).toBe("known")
  })
})
