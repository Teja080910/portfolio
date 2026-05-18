// utility/authProvider.ts

import { supabase } from "@/lib/db";
import { IUser } from "@/lib/interfaces";
import { useStore } from "@/lib/store";
import { AuthProvider } from "@refinedev/core";
import { User } from "@supabase/supabase-js";

const enhancePhotoUrl = (url?: string | null) => {
    if (!url) return "";
    let enhancedUrl = url;
    if (enhancedUrl.includes("googleusercontent.com")) {
        if (enhancedUrl.match(/=s\d+-c/)) {
            enhancedUrl = enhancedUrl.replace(/=s\d+-c/g, "=s800-c");
        } else if (!enhancedUrl.includes("=")) {
            enhancedUrl += "=s800-c";
        }
    } else if (enhancedUrl.includes("avatars.githubusercontent.com")) {
        if (!enhancedUrl.includes("s=")) {
            enhancedUrl = enhancedUrl.includes("?") ? `${enhancedUrl}&s=800` : `${enhancedUrl}?s=800`;
        }
    }
    return enhancedUrl;
};

const mapProfileToUser = (profile: Partial<IUser>): IUser => ({
    id: profile.id,
    username: profile.username ?? "",
    email: profile.email ?? "",
    photo: enhancePhotoUrl(profile.photo),
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

const buildGeneratedUsername = (input?: string | null, fallbackEmail?: string | null, suffix?: string) => {
    const baseValue = (input?.trim() || fallbackEmail?.split("@")[0] || "user")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase()
        .slice(0, 15);

    return suffix ? `${baseValue}_${suffix}` : (baseValue || "user");
};

const buildProfileFromAuthUser = (user: User) => {
    const metadata = user.user_metadata ?? {};

    // OAuth mapping (Google/GitHub standard fields)
    const oauthFullName = (metadata.name as string | undefined) || (metadata.full_name as string | undefined) || "";
    const rawPhoto = (metadata.avatar_url as string | undefined) || (metadata.picture as string | undefined) || "";
    const oauthPhoto = enhancePhotoUrl(rawPhoto);

    return {
        id: user.id,
        email: user.email ?? "",
        username: buildGeneratedUsername(metadata.username || oauthFullName, user.email, user.id.slice(0, 4)),
        firstname: oauthFullName || (metadata.firstname as string | undefined)?.trim() || "New",
        lastname: (metadata.lastname as string | undefined)?.trim() || "",
        role: (metadata.role as string | undefined)?.trim() || "Developer",
        phone: (metadata.phone as string | undefined)?.trim() || "",
        photo: oauthPhoto,
        password: "oauth-placeholder-password",
        show: true,
    };
};

const buildUserFromAuthAndProfile = (user: User, profile?: Partial<IUser> | null): IUser => {
    const fromAuth = buildProfileFromAuthUser(user);
    return mapProfileToUser({
        ...(profile || {}),
        id: user.id,
        email: user.email ?? profile?.email ?? "",
        username: profile?.username || fromAuth.username,
        firstname: fromAuth.firstname,
        lastname: fromAuth.lastname,
        photo: fromAuth.photo,
        role: profile?.role || fromAuth.role,
        phone: profile?.phone || fromAuth.phone,
        password: profile?.password || fromAuth.password,
        show: profile?.show ?? true,
    });
};

const getOrCreateProfile = async (user: User) => {
    // 1. Try to get existing profile
    const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (existingProfile) {
        const metadata = user.user_metadata ?? {};
        const oauthPhoto = (metadata.avatar_url as string | undefined) || (metadata.picture as string | undefined);

        if (oauthPhoto && !existingProfile.photo) {
            const { data: updatedProfile } = await supabase
                .from("profiles")
                .update({ photo: oauthPhoto })
                .eq("id", user.id)
                .select("*")
                .single();

            if (updatedProfile) return { profile: updatedProfile, error: null };
        }
        return { profile: existingProfile, error: null };
    }

    if (existingProfileError) {
        console.error("Database error while checking for profile:", existingProfileError);
    }

    // 2. Profile doesn't exist, try to create it
    const profilePayload = buildProfileFromAuthUser(user);
    console.log("Attempting to create profile in database...", profilePayload);

    const { data: createdProfile, error: createProfileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" })
        .select("*")
        .single();

    if (createProfileError) {
        console.error("FAILED to create profile row. This is usually due to RLS policies or missing columns:", createProfileError);
        
        // Final attempt: if upsert failed, try a simple insert
        if (createProfileError.code === "P0001" || createProfileError.code === "23505") {
             console.log("Retrying with simple insert...");
             const { data: retryProfile } = await supabase
                .from("profiles")
                .insert([profilePayload])
                .select("*")
                .single();
             if (retryProfile) return { profile: retryProfile, error: null };
        }
    }

    return { profile: createdProfile, error: createProfileError };
};

const hydrateStoreUserFromSession = async (user: User) => {
    const { profile } = await getOrCreateProfile(user);
    const resolvedUser = buildUserFromAuthAndProfile(user, profile);

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

        useStore.getState().addUser(buildUserFromAuthAndProfile(signInData.user, profile));

        return {
            success: true,
            redirectTo: profile.username?.trim() ? `/u/${encodeURIComponent(profile.username.trim())}` : "/",
        };
    },
    logout: async () => {
        await supabase.auth.signOut();
        useStore.getState().removeUser();
        return {
            success: true,
            redirectTo: "/",
        };
    },
    check: async () => {
        const { data } = await supabase.auth.getSession();

        if (data.session?.user) {
            const sessionUser = data.session.user;
            const currentStoreUser = useStore.getState().user;
            const sessionEmail = sessionUser.email ?? "";

            const oauthPhoto = (sessionUser.user_metadata?.avatar_url as string | undefined) || (sessionUser.user_metadata?.picture as string | undefined);

            if (
                currentStoreUser?.id !== sessionUser.id ||
                currentStoreUser?.email !== sessionEmail ||
                (oauthPhoto && !currentStoreUser?.photo) ||
                currentStoreUser?.firstname === "New" ||
                currentStoreUser?.lastname === "User"
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
            redirectTo: "/",
        };
    },
    getIdentity: async () => {
        const { data } = await supabase.auth.getUser();

        if (data.user) {
            const currentStoreUser = useStore.getState().user;
            const oauthPhoto = (data.user.user_metadata?.avatar_url as string | undefined) || (data.user.user_metadata?.picture as string | undefined);
            const metadata = data.user.user_metadata ?? {};
            const oauthGivenName = (metadata.given_name as string | undefined) || "";
            const oauthFamilyName = (metadata.family_name as string | undefined) || "";

            if (
                currentStoreUser?.id !== data.user.id ||
                currentStoreUser?.email !== (data.user.email ?? "") ||
                (oauthPhoto && !currentStoreUser?.photo) ||
                currentStoreUser?.firstname === "New" ||
                currentStoreUser?.lastname === "User"
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
