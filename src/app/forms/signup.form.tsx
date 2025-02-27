"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardTitle, CardHeader, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Check, ChevronRight, ChevronLeft, User, Mail, Phone, Briefcase, Lock } from "lucide-react"

// This would be your server action
const registerUserAction = async (formData: FormData) => {
  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Validation logic would go here
  const errors: Record<string, string> = {}

  // Return success or errors
  return {
    success: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : null,
  }
}

const roleOptions = ["Developer", "Designer", "Product Manager", "Marketing", "Sales", "Customer Support", "Other"]

export function UserRegistrationForm({ className }: React.ComponentProps<typeof Card>) {
  const [step, setStep] = React.useState(1)
  const [pending, setPending] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))

    // Clear error when user selects
    if (errors.role) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.role
        return newErrors
      })
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    if (!formData.role) newErrors.role = "Please select a role"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"

    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password"
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handlePrevStep = () => {
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) return

    setPending(true)

    try {
      // Convert form data to FormData object
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value)
      })

      const result = await registerUserAction(submitData)

      if (result.success) {
        setSuccess(true)
      } else if (result.errors) {
        setErrors(result.errors)
      }
    } catch (error) {
      console.error("Form submission error:", error)
      setErrors({ form: "An unexpected error occurred. Please try again." })
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

  console.log(errors, formData)

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
            <CardTitle className="text-2xl font-bold">{step === 1 ? "Create Account" : "Set Password"}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span
                className={cn(
                  "size-6 rounded-full flex items-center justify-center",
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                1
              </span>
              <span className="w-4 h-0.5 bg-muted-foreground/30" />
              <span
                className={cn(
                  "size-6 rounded-full flex items-center justify-center",
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                2
              </span>
            </div>
          </div>
          <CardDescription>
            {step === 1 ? "Please fill in your personal information" : "Create a secure password for your account"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                <CardContent className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      className="group/field space-y-2"
                      data-invalid={!!errors.firstName}
                      custom={0}
                      variants={inputVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <Label
                        htmlFor="firstName"
                        className="group-data-[invalid=true]/field:text-destructive flex items-center gap-2"
                      >
                        <User className="size-3.5" />
                        First Name <span aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        className="group-data-[invalid=true]/field:border-destructive focus-visible:group-data-[invalid=true]/field:ring-destructive transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(var(--primary-500),0.3)]"
                        disabled={pending}
                        aria-invalid={!!errors.firstName}
                        aria-errormessage="error-firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                      {errors.firstName && (
                        <p id="error-firstName" className="text-destructive text-sm text-white">
                          {errors.firstName}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      className="group/field space-y-2"
                      data-invalid={!!errors.lastName}
                      custom={1}
                      variants={inputVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <Label
                        htmlFor="lastName"
                        className="group-data-[invalid=true]/field:text-destructive flex items-center gap-2"
                      >
                        <User className="size-3.5" />
                        Last Name <span aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        className="group-data-[invalid=true]/field:border-destructive focus-visible:group-data-[invalid=true]/field:ring-destructive transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(var(--primary-500),0.3)]"
                        disabled={pending}
                        aria-invalid={!!errors.lastName}
                        aria-errormessage="error-lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                      {errors.lastName && (
                        <p id="error-lastName" className="text-destructive text-sm">
                          {errors.lastName}
                        </p>
                      )}
                    </motion.div>
                  </div>

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
                      placeholder="john.doe@gmail.com"
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
                    data-invalid={!!errors.phone}
                    custom={3}
                    variants={inputVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <Label
                      htmlFor="phone"
                      className="group-data-[invalid=true]/field:text-destructive flex items-center gap-2"
                    >
                      <Phone className="size-3.5" />
                      Phone <span aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+1 (555) 123-4567"
                      className="group-data-[invalid=true]/field:border-destructive focus-visible:group-data-[invalid=true]/field:ring-destructive transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(var(--primary-500),0.3)]"
                      disabled={pending}
                      aria-invalid={!!errors.phone}
                      aria-errormessage="error-phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && (
                      <p id="error-phone" className="text-destructive text-sm">
                        {errors.phone}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    className="group/field space-y-2"
                    data-invalid={!!errors.role}
                    custom={4}
                    variants={inputVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <Label
                      htmlFor="role"
                      className="group-data-[invalid=true]/field:text-destructive flex items-center gap-2"
                    >
                      <Briefcase className="size-3.5" />
                      Role <span aria-hidden="true">*</span>
                    </Label>
                    <Select value={formData.role} onValueChange={handleRoleChange} disabled={pending}>
                      <SelectTrigger
                        id="role"
                        className={cn(
                          "group-data-[invalid=true]/field:border-destructive focus-visible:group-data-[invalid=true]/field:ring-destructive",
                          "transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(var(--primary-500),0.3)]",
                        )}
                      >
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p id="error-role" className="text-destructive text-sm">
                        {errors.role}
                      </p>
                    )}
                  </motion.div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      disabled={pending}
                      className="group relative overflow-hidden"
                    >
                      Next Step
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </motion.div>
                </CardFooter>
              </motion.div>
            ) : (
              <motion.div key="step2" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                <CardContent className="space-y-6 pt-4">
                  {success ? (
                    <motion.div
                      className="flex flex-col items-center justify-center py-8 text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Check className="size-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Registration Complete!</h3>
                      <p className="text-muted-foreground">
                        Your account has been created successfully. You can now log in.
                      </p>
                    </motion.div>
                  ) : (
                    <>
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

                      <motion.div
                        className="group/field space-y-2"
                        data-invalid={!!errors.confirmPassword}
                        custom={1}
                        variants={inputVariants}
                        initial="initial"
                        animate="animate"
                      >
                        <Label
                          htmlFor="confirmPassword"
                          className="group-data-[invalid=true]/field:text-destructive flex items-center gap-2"
                        >
                          <Lock className="size-3.5" />
                          Confirm Password <span aria-hidden="true">*</span>
                        </Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="group-data-[invalid=true]/field:border-destructive focus-visible:group-data-[invalid=true]/field:ring-destructive transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(var(--primary-500),0.3)]"
                          disabled={pending}
                          aria-invalid={!!errors.confirmPassword}
                          aria-errormessage="error-confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        {errors.confirmPassword && (
                          <p id="error-confirmPassword" className="text-destructive text-sm">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </motion.div>

                      {errors.form && (
                        <p className="text-destructive text-sm bg-destructive/10 p-2 rounded">{errors.form}</p>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  {!success && (
                    <>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevStep}
                          disabled={pending}
                          className="group"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                          Back
                        </Button>
                      </motion.div>
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
                            "Create Account"
                          )}
                        </Button>
                      </motion.div>
                    </>
                  )}
                  {success && <Button className="w-full">Go to Login</Button>}
                </CardFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Card>
    </motion.div>
  )
}