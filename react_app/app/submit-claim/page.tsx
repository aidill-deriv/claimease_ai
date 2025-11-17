"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, CheckCircle2, AlertCircle, FileText, DollarSign } from "lucide-react"

export default function SubmitClaim() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    date: "",
    description: "",
    provider: "",
  })

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail")
    if (!email) {
      router.push("/")
      return
    }
    setUserEmail(email)
  }, [router])

  const categories = [
    { value: "medical", label: "Medical" },
    { value: "dental", label: "Dental" },
    { value: "optical", label: "Optical" },
    { value: "wellness", label: "Wellness" },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In real implementation, use submitClaim from lib/api.ts
      // const formDataToSend = new FormData()
      // formDataToSend.append('user_email', userEmail)
      // formDataToSend.append('category', formData.category)
      // formDataToSend.append('amount', formData.amount)
      // formDataToSend.append('date', formData.date)
      // formDataToSend.append('description', formData.description)
      // formDataToSend.append('provider', formData.provider)
      // if (selectedFile) {
      //   formDataToSend.append('receipt', selectedFile)
      // }
      // await submitClaim(formDataToSend)

      setSubmitSuccess(true)
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          category: "",
          amount: "",
          date: "",
          description: "",
          provider: "",
        })
        setSelectedFile(null)
        setSubmitSuccess(false)
      }, 3000)
    } catch (error) {
      setSubmitError("Failed to submit claim. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.category &&
      formData.amount &&
      formData.date &&
      formData.description &&
      formData.provider
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit Claim</h1>
          <p className="text-muted-foreground">
            Fill out the form below to submit a new claim for reimbursement
          </p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Claim submitted successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your claim has been received and is being processed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {submitError && (
          <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">
                    Submission failed
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {submitError}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Claim Details</CardTitle>
            <CardDescription>
              Please provide accurate information for faster processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Claim Category *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Claim Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Service Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Provider */}
              <div className="space-y-2">
                <Label htmlFor="provider">Healthcare Provider *</Label>
                <Input
                  id="provider"
                  name="provider"
                  type="text"
                  value={formData.provider}
                  onChange={handleInputChange}
                  placeholder="e.g., City General Hospital"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide details about the service or treatment received..."
                  required
                  rows={4}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt/Invoice (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    id="receipt"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <label htmlFor="receipt" className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Click to upload receipt</p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, or PNG (Max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Claim
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">📋 Submission Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Claims must be submitted within 30 days of service</p>
            <p>• Receipts should clearly show the date, amount, and provider</p>
            <p>• Processing typically takes 3-5 business days</p>
            <p>• You'll receive an email notification once processed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
