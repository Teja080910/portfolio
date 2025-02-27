import { UserRegistrationForm } from "@/app/forms/signup.form";

export default function UserRegister() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br to-muted/50">
            <UserRegistrationForm />
        </main>
    )
}