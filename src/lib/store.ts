import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IAboutMe, ICertificate, ICollaboration, IContentChannel, IContentWork, ICreatorTool, IEducation, IExperience, IProjects, ISkills, IUser } from "./interfaces";
import { TAboutMe, TCertificate, TCollaborations, TContentChannels, TContentWorks, TCreatorTools, TEducation, TExperience, TProjects, TSkills, TUser } from "./setvalues";

export type StoreState = {
    user: IUser;
    about: IAboutMe;
    certificate: ICertificate[];
    education: IEducation[];
    experience: IExperience[];
    skills: ISkills[];
    projects: IProjects[];
    contentChannels: IContentChannel[];
    contentWorks: IContentWork[];
    collaborations: ICollaboration[];
    creatorTools: ICreatorTool[];
    addUser: (user: IUser) => void;
    setUser: (user: IUser) => void;
    addAbout: (about: IAboutMe) => void;
    setAbout: (about: IAboutMe) => void;
    addCertificate: (certificate: ICertificate) => void;
    setCertificate: (certificate: ICertificate[]) => void;
    addEducation: (education: IEducation) => void;
    setEducation: (education: IEducation[]) => void;
    addExperience: (experience: IExperience) => void;
    setExperience: (experience: IExperience[]) => void;
    addSkills: (skills: ISkills) => void;
    setSkills: (skills: ISkills[]) => void;
    addProject: (project: IProjects) => void;
    setProjects: (projects: IProjects[]) => void;
    setContentChannels: (channels: IContentChannel[]) => void;
    setContentWorks: (works: IContentWork[]) => void;
    setCollaborations: (collabs: ICollaboration[]) => void;
    setCreatorTools: (tools: ICreatorTool[]) => void;
    removeUser: () => void;
    resetPortfolio: () => void;
};

export const useStore = create(
    persist<StoreState>(
        (set) => ({
            user: TUser,
            about: TAboutMe,
            certificate: TCertificate,
            education: TEducation,
            experience: TExperience,
            skills: TSkills,
            projects: TProjects,
            contentChannels: TContentChannels,
            contentWorks: TContentWorks,
            collaborations: TCollaborations,
            creatorTools: TCreatorTools,
            addUser: (user: IUser) => set({ user }),
            setUser: (user: IUser) => set({ user }),
            removeUser: () => set({ user: TUser }),
            addAbout: (about: IAboutMe) => set({ about }),
            setAbout: (about: IAboutMe) => set({ about }),
            addCertificate: (certificate: ICertificate) => set((prev) => ({ ...prev, certificate: [...prev.certificate, certificate] })),
            setCertificate: (certificate: ICertificate[]) => set({ certificate }),
            addEducation: (education: IEducation) => set((prev) => ({ ...prev, education: [...prev.education, education] })),
            setEducation: (education: IEducation[]) => set({ education }),
            addExperience: (experience: IExperience) => set((prev) => ({ ...prev, experience: [...prev.experience, experience] })),
            setExperience: (experience: IExperience[]) => set({ experience }),
            addSkills: (skills: ISkills) => set((prev) => ({ ...prev, skills: [...prev.skills, skills] })),
            setSkills: (skills: ISkills[]) => set({ skills }),
            addProject: (project: IProjects) => set((prev) => ({ ...prev, projects: [...prev.projects, project] })),
            setProjects: (projects: IProjects[]) => set({ projects }),
            setContentChannels: (contentChannels: IContentChannel[]) => set({ contentChannels }),
            setContentWorks: (contentWorks: IContentWork[]) => set({ contentWorks }),
            setCollaborations: (collaborations: ICollaboration[]) => set({ collaborations }),
            setCreatorTools: (creatorTools: ICreatorTool[]) => set({ creatorTools }),
            resetPortfolio: () =>
                set({
                    about: TAboutMe,
                    certificate: TCertificate,
                    education: TEducation,
                    experience: TExperience,
                    skills: TSkills,
                    projects: TProjects,
                    contentChannels: TContentChannels,
                    contentWorks: TContentWorks,
                    collaborations: TCollaborations,
                    creatorTools: TCreatorTools,
                }),
        }),
        {
            name: "my-portfolio",
        }
    )
);