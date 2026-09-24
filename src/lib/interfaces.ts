export type ProfileType = "user" | "team" | "business"

export type PortfolioTemplate = "software" | "content_creator" | "marketer"

export interface IUser {
    id?: string;
    username: string;
    email: string;
    photo?: string;
    firstname: string;
    lastname: string;
    role: string;
    description?: string;
    gitlink?: string;
    likedlin?: string;
    resumelink?: string;
    phone: string;
    password: string;
    confirmpassword?: string;
    show?: boolean;
    type?: ProfileType;
    template?: PortfolioTemplate;
}

export type AboutHighlightIcon = "compass" | "rocket" | "users" | "sparkles";

export interface IAboutHighlight {
    id: string;
    title: string;
    description: string;
    icon: AboutHighlightIcon;
    show: boolean;
}

export interface IAboutMe {
    id: string;
    type: string;
    list: string[];
    person: string;
    show: boolean;
    highlights?: IAboutHighlight[];
}

export interface ICertificate {
    id: string;
    person: string;
    name: string;
    duration: string;
    link: string;
    photo: string;
    show: boolean;
}

export interface IEducation {
    id: string;
    person: string;
    name: string;
    duration: string;
    course: string;
    branch: string;
    keyachivements: string;
    show: boolean;
}

export interface IExperience {
    id: string;
    person: string;
    type: string;
    location: string;
    duration: string;
    role: string;
    decription: string;
    show: boolean;
}

export interface IProjects {
    id: string;
    person: string;
    name: string;
    description: string;
    duration: string;
    startDate: string;
    endDate: string;
    gitlink: string;
    weblink: string;
    weblinks?: { type: string; url: string }[];
    logo: string;
    photos: string[];
    skills: string[];
    show: boolean;
    projectType: string;
    sortOrder: number;
}

export interface ISkills {
    id: string;
    person: string;
    skilltype: string;
    skills: string[];
    description: string;
    show: boolean;
}

export type ContentPlatform = "youtube" | "instagram" | "tiktok" | "twitter" | "blog" | "podcast" | "newsletter" | "other"

export interface IContentChannel {
    id: string;
    person: string;
    platform: ContentPlatform | string;
    url: string;
    handle: string;
    subscriberCount: string;
    description: string;
    show: boolean;
}

export type ContentType = "video" | "article" | "photo" | "podcast" | "reel" | "short" | "other"

export interface IContentWork {
    id: string;
    person: string;
    title: string;
    type: ContentType | string;
    url: string;
    thumbnail: string;
    media: string[];
    description: string;
    date: string;
    views: string;
    show: boolean;
    sortOrder: number;
}

export interface ICollaboration {
    id: string;
    person: string;
    brand: string;
    description: string;
    url: string;
    date: string;
    logo: string;
    show: boolean;
}

export interface ICreatorTool {
    id: string;
    person: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    show: boolean;
}

export type TeamRole = "owner" | "member"

export type TeamSectionKey =
    | "skills"
    | "projects"
    | "experience"
    | "education"
    | "certificates"
    | "content_channels"
    | "content_works"
    | "collaborations"
    | "creator_tools"

export interface ITeam {
    id: string;
    owner_id: string;
    slug: string;
    name: string;
    tagline?: string | null;
    description?: string | null;
    logo?: string | null;
    show: boolean;
    created_at?: string;
    updated_at?: string;
    member_count?: number;
}

export interface ITeamMember {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    photo?: string | null;
    role: TeamRole;
    jobRole?: string | null;
    type?: ProfileType;
    show?: boolean;
    joinedAt?: string;
}

export interface ITeamInvite {
    id: string;
    teamId?: string;
    email?: string | null;
    expiresAt?: string;
    createdAt?: string;
    acceptedAt?: string | null;
    revoked?: boolean;
    valid?: boolean;
    team?: Pick<ITeam, "id" | "slug" | "name" | "logo">;
}

export interface ITeamInviteRecord {
    id: string;
    team_id: string;
    email: string | null;
    invited_by: string | null;
    expires_at: string;
    accepted_at: string | null;
    revoked: boolean;
    created_at: string;
}

export interface ITeamPortfolio {
    team: {
        id: string;
        slug: string;
        name: string;
        tagline?: string | null;
        description?: string | null;
        logo?: string | null;
        ownerId: string;
        createdAt?: string;
    };
    members: ITeamMember[];
    sections: Partial<Record<TeamSectionKey, unknown[]>>;
}

export type CheckResponse = {
    authenticated: boolean;
    redirectTo?: string;
    logout?: boolean;
    error?: Error;
    show: boolean;
  };