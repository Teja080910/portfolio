export type ProfileType = "user" | "team" | "business"

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
    gitlink: string;
    weblink: string;
    logo: string;
    photos: string[];
    skills: string[];
    show: boolean;
    projectType: string;
}

export interface ISkills {
    id: string;
    person: string;
    skilltype: string;
    skills: string[];
    description: string;
    show: boolean;
}

export type CheckResponse = {
    authenticated: boolean;
    redirectTo?: string;
    logout?: boolean;
    error?: Error;
    show: boolean;
  };