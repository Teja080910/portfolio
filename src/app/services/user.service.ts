import { supabase } from "@/lib/db"

export const GetUser = async (username: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('username', username).single()
    return data
}
