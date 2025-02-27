import { supabase } from "@/pages/api/supabaseclinet"

export const GetUser = async (username: string) => {
    const { data } = await supabase.from('personal').select('*').eq('username', username).single()
    return data
}