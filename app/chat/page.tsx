"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Sparkles, Lightbulb, Zap } from "lucide-react"
import { queryAI } from "@/lib/api"
import { MarkdownMessage } from "@/components/markdown-message"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function Chat() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only access sessionStorage in the browser
    if (typeof window !== 'undefined') {
      const email = sessionStorage.getItem("userEmail")
      if (!email) {
        router.push("/")
        return
      }
      setUserEmail(email)
    }
    
    // Add welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your AI assistant for claims and benefits. How can I help you today?",
        timestamp: new Date(),
      },
    ])
  }, [router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const quickQuestions = [
    { text: "What is my current claim balance?", icon: Sparkles },
    { text: "How do I submit a medical claim?", icon: Lightbulb },
    { text: "What are the claim limits?", icon: Zap },
    { text: "Show my recent claims", icon: Sparkles },
  ]

  const handleQuickQuestion = (question: string) => {
    setInput(question)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await queryAI({
        user_email: userEmail,
        query_text: input,
        thread_id: threadId,
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      if (response.thread_id) {
        setThreadId(response.thread_id)
      }
    } catch (error) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I apologize, but I'm having trouble connecting to the server. Please make sure the backend API is running at ${apiUrl} and try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-coral-50 dark:from-slate-1100 dark:via-slate-1000 dark:to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-coral rounded-full"></div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Assistant</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 ml-7">
            Ask me anything about your claims, policies, and benefits
          </p>
        </div>

        {/* Chat Container */}
        <Card className="h-[calc(100vh-280px)] flex flex-col border-slate-200 dark:border-slate-800 shadow-xl">
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 animate-fade-in ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-10 w-10 border-2 border-coral-200 dark:border-coral-800">
                    <AvatarFallback className="bg-gradient-coral">
                      <Bot className="h-5 w-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-coral text-white"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <MarkdownMessage 
                    content={message.content} 
                    className={`text-sm leading-relaxed ${
                      message.role === "user" ? "text-white" : "text-slate-900 dark:text-slate-100"
                    }`}
                  />
                  <p className={`text-xs mt-2 ${
                    message.role === "user" ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                  }`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
                    <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                      <User className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3 animate-fade-in">
                <Avatar className="h-10 w-10 border-2 border-coral-200 dark:border-coral-800">
                  <AvatarFallback className="bg-gradient-coral">
                    <Bot className="h-5 w-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-coral-700 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-coral-700 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2.5 h-2.5 bg-coral-700 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-6 pb-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-coral-700" />
                Quick questions to get started:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => {
                  const Icon = question.icon
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(question.text)}
                      className="justify-start text-left h-auto py-3 px-4 border-slate-200 dark:border-slate-800 hover:border-coral-300 dark:hover:border-coral-700 hover:bg-coral-50 dark:hover:bg-coral-950 transition-all duration-300 group"
                    >
                      <Icon className="h-4 w-4 mr-2 flex-shrink-0 text-coral-700 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{question.text}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question here..."
                disabled={isLoading}
                className="flex-1 h-12 border-slate-200 dark:border-slate-800 focus:border-coral-700 focus:ring-coral-700 bg-white dark:bg-slate-1000"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="h-12 px-6 bg-gradient-coral hover:bg-gradient-coral-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-pulse"></span>
              Press Enter to send • Powered by Deriv AI
            </p>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Card className="border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-sm text-slate-900 dark:text-white">Tips for better results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <p className="flex items-start gap-2">
                <span className="text-blue-700 dark:text-blue-400 mt-0.5">•</span>
                <span>Be specific about what you want to know</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-700 dark:text-blue-400 mt-0.5">•</span>
                <span>Ask about claim balances, policies, or procedures</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-700 dark:text-blue-400 mt-0.5">•</span>
                <span>You can ask follow-up questions for more details</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-emerald flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-sm text-slate-900 dark:text-white">AI Capabilities</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <p className="flex items-start gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 mt-0.5">•</span>
                <span>Instant answers from policy documents</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 mt-0.5">•</span>
                <span>Personalized claim balance information</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 mt-0.5">•</span>
                <span>Step-by-step guidance for submissions</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
