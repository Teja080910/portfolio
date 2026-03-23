import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IAboutMe, ICertificate, IEducation, IExperience, IProjects, ISkills, IUser } from "./interfaces";
import { TAboutMe, TCertificate, TEducation, TExperience, TProjects, TSkills, TUser } from "./setvalues";

export type StoreState = {
    user: IUser;
    about: IAboutMe;
    certificate: ICertificate[];
    education: IEducation[];
    experience: IExperience[];
    skills: ISkills[];
    projects: IProjects[];
    addUser: (user: IUser) => void;
    addAbout: (about: IAboutMe) => void;
    addCertificate: (certificate: ICertificate) => void;
    addEducation: (education: IEducation) => void;
    addExperience: (experience: IExperience) => void;
    addSkills: (skills: ISkills) => void;
    addProject: (project: IProjects) => void;
    removeUser: () => void;
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
            addUser: (user: IUser) => set({ user }),
            removeUser: () => set({ user: TUser }),
            addAbout: (about: IAboutMe) => set({ about }),
            addCertificate: (certificate: ICertificate) => set((prev) => ({ ...prev, certificate: [...prev.certificate, certificate] })),
            addEducation: (education: IEducation) => set((prev) => ({ ...prev, education: [...prev.education, education] })),
            addExperience: (experience: IExperience) => set((prev) => ({ ...prev, experience: [...prev.experience, experience] })),
            addSkills: (skills: ISkills) => set((prev) => ({ ...prev, skills: [...prev.skills, skills] })),
            addProject: (project: IProjects) => set((prev) => ({ ...prev, projects: [...prev.projects, project] })),
        }),
        {
            name: "my-portfolio",
        }
    )
);