import { UserLogin } from "@/app/forms/signin.form";

export default function UserSignIn() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br to-muted/50">
            <UserLogin />
        </main>
    )
}