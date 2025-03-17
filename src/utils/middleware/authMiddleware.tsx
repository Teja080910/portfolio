// utility/authProvider.ts

import { supabase } from "@/lib/db";
import { AuthBindings } from "@refinedev/core";

export const authProvider: AuthBindings = {
    login: async ({ email, password }) => {
        const { error, data } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    name: "LoginError",
                },
            };
        }

        return {
            success: true,
            redirectTo: "/",
        };
    },
    logout: async () => {
        await supabase.auth.signOut();
        return {
            success: true,
            redirectTo: "/login",
        };
    },
    check: async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            return {
                authenticated: true,
            };
        }
        return {
            authenticated: false,
            redirectTo: "/login",
        };
    },
    getIdentity: async () => {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
            return {
                id: data.user.id,
                name: data.user.email,
                avatar: null,
            };
        }
        return null;
    },
    onError: async (error) => {
        console.error(error);
        return {};
    },
};
