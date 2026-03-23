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
            resetPortfolio: () =>
                set({
                    about: TAboutMe,
                    certificate: TCertificate,
                    education: TEducation,
                    experience: TExperience,
                    skills: TSkills,
                    projects: TProjects,
                }),
        }),
        {
            name: "my-portfolio",
        }
    )
);