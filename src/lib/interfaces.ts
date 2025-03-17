export interface IUser {
    id: string;
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
}

export interface IAboutMe {
    id: string;
    type: string;
    list: string[];
    person: string;
}

export interface ICertificate {
    id: string;
    person: string;
    name: string;
    duration: string;
    link: string;
    photo: string;
}

export interface IEducation {
    id: string;
    person: string;
    name: string;
    duration: string;
    course: string;
    branch: string;
    keyachivements: string;
}

export interface IExperience {
    id: string;
    person: string;
    type: string;
    location: string;
    duration: string;
    role: string;
    decription: string;
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
    skills: string[];
}

export interface ISkills {
    id: string;
    person: string;
    skilltype: string;
    skills: string[];
    description: string;
}

export type CheckResponse = {
    authenticated: boolean;
    redirectTo?: string;
    logout?: boolean;
    error?: Error;
  };