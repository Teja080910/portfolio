import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IUser } from "@/lib/interfaces"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useLogin } from "@refinedev/core"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Lock, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

export function UserLogin({ className }: React.ComponentProps<typeof Card>) {
    const { mutate: register } = useLogin<IUser>()
    const [pending, setPending] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState<IUser>({
        firstname: "",
        lastname: "",
        username: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        confirmpassword: "",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const router = useRouter()
    const { user } = useStore()

    if (!user) {
        return (
            <motion.div>
                <Card className={cn(className, "flex flex-col gap-4")}>
                    <Loader2 />
                </Card>
            </motion.div>
        )
    }

    useEffect(() => {
        if (user?.id) {
            router.push('/')
        }
    }, [user?.id])

    const validateStep = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.email.trim()) newErrors.email = "Email is required"
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format"
        if (!formData.password) newErrors.password = "Password is required"
        else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const valid = validateStep()
        if (!valid) {
            setPending(false);
            return
        }
        setPending(true)
        try {
            register(formData, {
                onSuccess: (data) => {
                    if (data.succes) {
                        setSuccess(true)
                        setPending(true);
                    } else {
                        setSuccess(false)
                        setPending(false);
                    }
                },
                onError: (error) => {
                    console.error("Login failed:", error)
                    setSuccess(false)
                    setPending(false);
                },
            })
        } catch (error) {
            console.error("Form submission error:", error)
            setErrors({ form: "An unexpected error occurred. Please try again." })
            setPending(false)
        } finally {
            setPending(false)
        }
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.5 },
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.95,
            transition: { duration: 0.3 },
        },
    }

    const inputVariants = {
        initial: { y: 10, opacity: 0 },
        animate: (i: number) => ({
            y: 0,
            opacity: 1,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
            },
        }),
        exit: (i: number) => ({
            y: 10,
            opacity: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.2,
            },
        }),
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    return (
        <motion.div
            className="perspective-1000 w-full max-w-md"
            initial={{ rotateX: 10, rotateY: -10 }}
            animate={{ rotateX: 0, rotateY: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <Card
                className={cn(
                    "w-full max-w-md transform-gpu transition-all duration-300",
                    "hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]",
                    "shadow-[0_10px_30px_rgba(0,0,0,0.1)]",
                    "border-opacity-50 backdrop-blur-sm",
                    className,
                )}
            >
                <CardHeader className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 -z-10" />
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold">Login Account</CardTitle>
                    </div>
                    <CardDescription>
                        Please fill email and password
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        <motion.div key="step1" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                            <CardContent className="space-y-6 pt-4">
                                <motion.div
                                    className="group/field space-y-2"
                                    data-invalid={!!errors.email}
                                    custom={2}
                                    variants={inputVariants}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <Label
                                        htmlFor="email"
                                        className="group-data-[invalid=true]/field:text-destructive flex items-center gap-2"
                                    >
                                        <Mail className="size-3.5" />
                                        Email <span aria-hidden="true">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="yourname@gmail.com"
                                        className="group-data-[invalid=true]/field:border-destructive focus-visible:group-data-[invalid=true]/field:ring-destructive transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(var(--primary-500),0.3)]"
                                        disabled={pending}
                                        aria-invalid={!!errors.email}
                                        aria-errormessage="error-email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                    {errors.email && (
                                        <p id="error-email" className="text-destructive text-sm">
                                            {errors.email}
                                        </p>
                                    )}
                                </motion.div>

                                <motion.div
                                    className="group/field space-y-2"
                                    data-invalid={!!errors.password}
                                    custom={0}
                                    variants={inputVariants}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <Label
                                        htmlFor="password"
                                        className="group-data-[invalid=true]/field:text-destructive flex items-center gap-2"
                                    >
                                        <Lock className="size-3.5" />
                                        Password <span aria-hidden="true">*</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="group-data-[invalid=true]/field:border-destructive focus-visible:group-data-[invalid=true]/field:ring-destructive transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(var(--primary-500),0.3)]"
                                        disabled={pending}
                                        aria-invalid={!!errors.password}
                                        aria-errormessage="error-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    {errors.password && (
                                        <p id="error-password" className="text-destructive text-sm">
                                            {errors.password}
                                        </p>
                                    )}
                                </motion.div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Link href={'/sign-up'}>Create Account</Link>
                                {!pending &&
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                        <Button type="submit" disabled={pending} className="relative overflow-hidden">
                                            {pending ? (
                                                <span className="flex items-center">
                                                    <svg
                                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Login"
                                            )}
                                        </Button>
                                    </motion.div>}
                            </CardFooter>
                        </motion.div>
                    </AnimatePresence>
                </form>
            </Card>
        </motion.div>
    )
}