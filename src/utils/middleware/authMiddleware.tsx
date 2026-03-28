// utility/authProvider.ts

import { supabase } from "@/lib/db";
import { IUser } from "@/lib/interfaces";
import { useStore } from "@/lib/store";
import { AuthProvider } from "@refinedev/core";
import { User } from "@supabase/supabase-js";

const mapProfileToUser = (profile: Partial<IUser>): IUser => ({
    id: profile.id,
    username: profile.username ?? "",
    email: profile.email ?? "",
    photo: profile.photo,
    firstname: profile.firstname ?? "",
    lastname: profile.lastname ?? "",
    role: profile.role ?? "",
    description: profile.description,
    gitlink: profile.gitlink,
    likedlin: profile.likedlin,
    resumelink: profile.resumelink,
    phone: profile.phone ?? "",
    password: profile.password ?? "",
    confirmpassword: "",
    show: profile.show ?? true,
});

const buildGeneratedUsername = (input?: string | null, fallbackEmail?: string | null) => {
    const baseValue = (input?.trim() || fallbackEmail?.split("@")[0] || "user")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase()
        .slice(0, 18);

    return baseValue || "user";
};

const buildProfileFromAuthUser = (user: User) => {
    const metadata = user.user_metadata ?? {};

    return {
        id: user.id,
        email: user.email ?? "",
        username: buildGeneratedUsername(metadata.username, user.email),
        firstname: (metadata.firstname as string | undefined)?.trim() || "New",
        lastname: (metadata.lastname as string | undefined)?.trim() || "User",
        role: (metadata.role as string | undefined)?.trim() || "Developer",
        phone: (metadata.phone as string | undefined)?.trim() || "",
        show: true,
    };
};

const mapAuthUserToStoreUser = (user: User): IUser =>
    mapProfileToUser(buildProfileFromAuthUser(user));

const getOrCreateProfile = async (user: User) => {
    const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (existingProfile) {
        return { profile: existingProfile, error: null };
    }

    if (existingProfileError) {
        return { profile: null, error: existingProfileError };
    }

    const profilePayload = buildProfileFromAuthUser(user);
    const { data: createdProfile, error: createProfileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" })
        .select("*")
        .single();

    return { profile: createdProfile, error: createProfileError };
};

const hydrateStoreUserFromSession = async (user: User) => {
    const { profile } = await getOrCreateProfile(user);
    const resolvedUser = profile ? mapProfileToUser(profile) : mapAuthUserToStoreUser(user);

    useStore.getState().addUser(resolvedUser);

    return resolvedUser;
};

export const authProvider: AuthProvider = {
    login: async ({ email, password }) => {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !signInData.user) {
            return {
                success: false,
                error: {
                    message: error?.message || "Login failed.",
                    name: "LoginError",
                },
            };
        }

        if (signInData.session) {
            await supabase.auth.setSession({
                access_token: signInData.session.access_token,
                refresh_token: signInData.session.refresh_token,
            });
        }

        const { profile, error: profileError } = await getOrCreateProfile(signInData.user);

        if (profileError || !profile) {
            await supabase.auth.signOut();

            return {
                success: false,
                error: {
                    message:
                        profileError?.code === "42501"
                            ? "Your account signed in, but the profile row could not be created. Apply the latest Supabase migrations, then try again."
                            : profileError?.message || "Profile setup is incomplete for this account.",
                    name: "LoginError",
                },
            };
        }

        useStore.getState().addUser(mapProfileToUser(profile));

        return {
            success: true,
            redirectTo: "/",
        };
    },
    logout: async () => {
        await supabase.auth.signOut();
        useStore.getState().removeUser();
        return {
            success: true,
            redirectTo: "/sign-in",
        };
    },
    check: async () => {
        const { data } = await supabase.auth.getSession();

        if (data.session?.user) {
            const sessionUser = data.session.user;
            const currentStoreUser = useStore.getState().user;
            const sessionEmail = sessionUser.email ?? "";

            if (
                currentStoreUser?.id !== sessionUser.id ||
                currentStoreUser?.email !== sessionEmail
            ) {
                await hydrateStoreUserFromSession(sessionUser);
            }

            return {
                authenticated: true,
            };
        }

        useStore.getState().removeUser();

        return {
            authenticated: false,
            redirectTo: "/sign-in",
        };
    },
    getIdentity: async () => {
        const { data } = await supabase.auth.getUser();

        if (data.user) {
            const currentStoreUser = useStore.getState().user;

            if (
                currentStoreUser?.id !== data.user.id ||
                currentStoreUser?.email !== (data.user.email ?? "")
            ) {
                await hydrateStoreUserFromSession(data.user);
            }

            const resolvedUser = useStore.getState().user;

            return {
                id: data.user.id,
                name: resolvedUser.username || resolvedUser.firstname || data.user.email,
                avatar: resolvedUser.photo ?? null,
            };
        }

        return null;
    },
    onError: async (error) => {
        console.error(error);
        return {};
    },
    register: async (userData: IUser) => {
        const generatedUsername =
            userData.username.trim() ||
            `${userData.firstname}${userData.lastname}`
                .replace(/[^a-zA-Z0-9]/g, "")
                .toLowerCase()
                .slice(0, 18) +
            Math.floor(Math.random() * 1000);

        const { data, error } = await supabase.auth.signUp({
            email: userData.email.trim().toLowerCase(),
            password: userData.password,
            options: {
                data: {
                    firstname: userData.firstname.trim(),
                    lastname: userData.lastname.trim(),
                    username: generatedUsername,
                    role: userData.role,
                    phone: userData.phone.trim(),
                },
            },
        });

        if (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    name: "RegisterError",
                },
            };
        }

        if (data.session) {
            await supabase.auth.signOut();
        }

        return {
            success: true,
            redirectTo: "/sign-in",
        };
    },
};
