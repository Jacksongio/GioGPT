"use client"

import type React from "react"

import { useChat, Message } from "ai/react"
import { nanoid } from "nanoid"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, MessageCircle, Palette, Shield, Lock, Copy, Download, Check, Square } from "lucide-react"
import ReactMarkdown from "react-markdown"

type Theme = "dark" | "neon" | "ocean" | "forest" | "minimal"

const themes = {
  dark: {
    name: "Dark Pro",
    gradient: "from-gray-900 via-black to-gray-800",
    header: "bg-black/80",
    card: "bg-gray-800/80",
    border: "border-gray-700/50",
    text: "text-white",
    accent: "from-blue-500 to-purple-600",
  },
  neon: {
    name: "Neon Cyber",
    gradient: "from-purple-900 via-black to-pink-900",
    header: "bg-black/90",
    card: "bg-purple-900/30",
    border: "border-pink-500/30",
    text: "text-pink-100",
    accent: "from-pink-500 to-cyan-500",
  },
  ocean: {
    name: "Ocean Deep",
    gradient: "from-blue-900 via-slate-900 to-teal-900",
    header: "bg-slate-900/90",
    card: "bg-blue-900/40",
    border: "border-teal-500/30",
    text: "text-blue-100",
    accent: "from-teal-400 to-blue-500",
  },
  forest: {
    name: "Forest Night",
    gradient: "from-green-900 via-gray-900 to-emerald-900",
    header: "bg-gray-900/90",
    card: "bg-green-900/30",
    border: "border-emerald-500/30",
    text: "text-green-100",
    accent: "from-emerald-400 to-green-500",
  },
  minimal: {
    name: "Minimal Pro",
    gradient: "from-slate-800 via-gray-900 to-slate-800",
    header: "bg-slate-900/95",
    card: "bg-slate-800/60",
    border: "border-slate-600/40",
    text: "text-slate-100",
    accent: "from-slate-400 to-slate-600",
  },
}

export default function GioGPT() {
  const [isTyping, setIsTyping] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>("dark")
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [copiedImageUrl, setCopiedImageUrl] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append, setInput, setMessages, stop } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error)

      // Parse error message if it's JSON
      let errorMessage = error.message
      try {
        const parsed = JSON.parse(error.message)
        if (parsed.error) {
          errorMessage = parsed.error
        }
      } catch (e) {
        // Not JSON, use as is
      }

      alert(`❌ ${errorMessage}`)
    },
    onFinish: () => {
      setIsTyping(false)
    },
    onResponse: () => {
      // Stop typing indicator as soon as response starts
      setIsTyping(false)
    },
  })

  const theme = themes[currentTheme]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setIsTyping(isLoading)
  }, [isLoading])

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem("giogpt-theme", currentTheme)
  }, [currentTheme])

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem("giogpt-theme") as Theme
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  const isImageGenerationRequest = (text: string): boolean => {
    const lower = text.toLowerCase().trim()
    if (lower.startsWith('/image ') || lower.startsWith('/img ')) return true
    const regex = /(generate|create|draw|make|paint|show)\s+.*\b(image|picture|photo|art|drawing)\b/
    return regex.test(lower)
  }

  const generateImageFromPrompt = async (prompt: string) => {
    setIsGeneratingImage(true)
    setImageProgress(0)
    console.log("🖼️ Starting image generation, NOT calling chat API")
    
    // Simulate progress updates during generation
    const progressInterval = setInterval(() => {
      setImageProgress(prev => {
        if (prev >= 85) return prev // Cap at 85% until actual completion
        const increment = Math.random() * 8 + 3 // Random increment between 3-11%
        const newProgress = prev + increment
        return Math.min(newProgress, 85) // Ensure we never exceed 85%
      })
    }, 1000)
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          size: "1024x1024",
          quality: "standard"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      // Complete the progress smoothly
      setTimeout(() => {
        setImageProgress(100)
      }, 300)
      
      console.log("🖼️ Image generated successfully, adding to messages")
      // Add the generated image as a message using setMessages to avoid triggering API call
      setMessages((prev) => [
        ...prev,
        { id: nanoid(), role: 'assistant', content: `![Generated Image](${data.image})` }
      ])
      console.log("🖼️ Image message added to chat")

    } catch (error: any) {
      console.error('Image generation error:', error)
      setMessages((prev) => [
        ...prev,
        { id: nanoid(), role: 'assistant', content: `❌ Sorry, I couldn't generate the image. ${error.message || 'Please try again.'}` }
      ])
    } finally {
      clearInterval(progressInterval)
      // Let users see the completion briefly before hiding
      setTimeout(() => {
        setIsGeneratingImage(false)
        setImageProgress(0)
      }, 800)
    }
  }

  const stopGeneration = () => {
    stop()
    setIsTyping(false)
    if (isGeneratingImage) {
      setIsGeneratingImage(false)
      setImageProgress(0)
    }
  }

  const copyTextToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(identifier)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const copyImageToClipboard = async (imageUrl: string) => {
    try {
      // Use our API route to get the image (bypasses CORS issues)
      const response = await fetch('/api/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      })
      
      if (response.ok) {
        const blob = await response.blob()
        
        // Copy the actual image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ])
        
        setCopiedImageUrl(imageUrl)
        setTimeout(() => setCopiedImageUrl(null), 2000)
      } else {
        throw new Error('Failed to fetch image for copying')
      }
    } catch (error) {
      console.error('Failed to copy image:', error)
      // Fallback: copy the URL instead and show a message
      try {
        await navigator.clipboard.writeText(imageUrl)
        setCopiedImageUrl(imageUrl)
        setTimeout(() => setCopiedImageUrl(null), 2000)
        console.log('Copied image URL as fallback')
      } catch (urlError) {
        console.error('Failed to copy URL:', urlError)
      }
    }
  }

  const saveImage = async (imageUrl: string) => {
    try {
      // Use our API route to download the image (bypasses CORS issues)
      const response = await fetch('/api/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `giogpt-image-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Server download failed')
      }
    } catch (error) {
      console.error('Download failed, trying fallback:', error)
      
      // Fallback: Open image in new tab for manual save
      const link = document.createElement('a')
      link.href = imageUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!input.trim()) return

    console.log("=== SUBMITTING MESSAGE ===")
    console.log("Input text:", input)
    
    // Check if this is an image generation request
    if (isImageGenerationRequest(input)) {
      console.log("Detected image generation request - NOT sending to chat API")

      // Show the user's prompt in the chat immediately
      setMessages((prev) => [
        ...prev,
        { id: nanoid(), role: 'user', content: input }
      ])

      await generateImageFromPrompt(input)
      setInput('')
      inputRef.current?.focus()
      return
    }

    try {
      // Set typing indicator to show "GioGPT is thinking..."
      setIsTyping(true)
      
      // Use append to send the message
      await append({
        role: 'user',
        content: input
      })

      console.log("Message sent successfully")

      // Clear the input after submission
      setInput('')
      inputRef.current?.focus()
    } catch (error) {
      console.error("Error in onSubmit:", error)
      setIsTyping(false) // Clear typing indicator on error
    }
  }

  const MarkdownRenderer = ({ content }: { content: string }) => (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          img: ({ src, alt, ...props }) => (
            <div className="relative group inline-block">
              <img
                src={src}
                alt={alt}
                className="rounded-lg max-w-full h-auto"
                {...props}
              />
              {src && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                  <button
                    onClick={() => copyImageToClipboard(src)}
                    className={`p-2 rounded-lg backdrop-blur-sm transition-all duration-200 ${
                      copiedImageUrl === src
                        ? 'bg-green-500/80 text-white'
                        : 'bg-black/50 hover:bg-black/70 text-white'
                    }`}
                    title={copiedImageUrl === src ? "Copied!" : "Copy image"}
                  >
                    {copiedImageUrl === src ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => saveImage(src)}
                    className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200"
                    title="Save image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ),
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : ""

            return !inline ? (
              <div className="relative group">
                <pre
                  className={`border rounded-lg p-4 overflow-x-auto mt-2 mb-2 ${
                    currentTheme === "neon"
                      ? "bg-purple-950/50 border-pink-500/30"
                      : currentTheme === "ocean"
                        ? "bg-blue-950/50 border-teal-500/30"
                        : currentTheme === "forest"
                          ? "bg-green-950/50 border-emerald-500/30"
                          : currentTheme === "minimal"
                            ? "bg-slate-900/50 border-slate-600/30"
                            : "bg-gray-900 border-gray-700"
                  }`}
                >
                  <code className={`text-sm font-mono ${theme.text}`} {...props}>
                    {children}
                  </code>
                </pre>
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  {language && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      currentTheme === "neon"
                        ? "bg-pink-900/80 text-pink-200"
                        : currentTheme === "ocean"
                          ? "bg-blue-900/80 text-blue-200"
                          : currentTheme === "forest"
                            ? "bg-green-900/80 text-green-200"
                            : currentTheme === "minimal"
                              ? "bg-slate-700/80 text-slate-300"
                              : "bg-gray-800 text-gray-400"
                    }`}>
                      {language}
                    </span>
                  )}
                  <button
                    onClick={() => copyTextToClipboard(String(children), `code-${Date.now()}`)}
                    className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                      copiedText?.startsWith('code-') 
                        ? 'bg-green-500/80 text-white' 
                        : 'bg-gray-600/80 hover:bg-gray-500/80 text-gray-200'
                    }`}
                    title={copiedText?.startsWith('code-') ? "Copied!" : "Copy code"}
                  >
                    {copiedText?.startsWith('code-') ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <code
                className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                  currentTheme === "neon"
                    ? "bg-pink-900/50 text-pink-200"
                    : currentTheme === "ocean"
                      ? "bg-teal-900/50 text-teal-200"
                      : currentTheme === "forest"
                        ? "bg-emerald-900/50 text-emerald-200"
                        : currentTheme === "minimal"
                          ? "bg-slate-700/50 text-slate-200"
                          : "bg-gray-700 text-gray-200"
                }`}
                {...props}
              >
                {children}
              </code>
            )
          },
          h1: ({ children }) => <h1 className={`text-2xl font-bold mb-4 ${theme.text}`}>{children}</h1>,
          h2: ({ children }) => <h2 className={`text-xl font-semibold mb-3 ${theme.text}`}>{children}</h2>,
          h3: ({ children }) => <h3 className={`text-lg font-medium mb-2 ${theme.text}`}>{children}</h3>,
          p: ({ children }) => (
            <p className={`mb-3 leading-relaxed ${theme.text.replace("white", "gray-100")}`}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul className={`list-disc list-inside mb-3 space-y-1 ${theme.text.replace("white", "gray-100")}`}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={`list-decimal list-inside mb-3 space-y-1 ${theme.text.replace("white", "gray-100")}`}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className={theme.text.replace("white", "gray-100")}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              className={`border-l-4 pl-4 italic my-3 py-2 rounded-r ${
                currentTheme === "neon"
                  ? "border-pink-500 bg-pink-900/20 text-pink-200"
                  : currentTheme === "ocean"
                    ? "border-teal-500 bg-teal-900/20 text-teal-200"
                    : currentTheme === "forest"
                      ? "border-emerald-500 bg-emerald-900/20 text-emerald-200"
                      : currentTheme === "minimal"
                        ? "border-slate-500 bg-slate-800/20 text-slate-300"
                        : "border-blue-500 bg-gray-800/30 text-gray-300"
              }`}
            >
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className={`underline transition-colors ${
                currentTheme === "neon"
                  ? "text-pink-400 hover:text-pink-300"
                  : currentTheme === "ocean"
                    ? "text-teal-400 hover:text-teal-300"
                    : currentTheme === "forest"
                      ? "text-emerald-400 hover:text-emerald-300"
                      : currentTheme === "minimal"
                        ? "text-slate-400 hover:text-slate-300"
                        : "text-blue-400 hover:text-blue-300"
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} transition-all duration-500`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl ${theme.header} border-b ${theme.border}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <button
              onClick={() => window.location.reload()}
              className="transition-all duration-200 hover:opacity-80 hover:scale-105 cursor-pointer"
              title="Refresh GioGPT"
            >
              <img 
                src="/giogpt.png" 
                alt="GioGPT" 
                className="h-12 w-auto"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center">
            <div className="mb-8">
              <img 
                src="/g.png" 
                alt="GioGPT" 
                className="w-20 h-20 mx-auto"
              />
            </div>
            <h2 className={`text-4xl sm:text-5xl font-bold ${theme.text} mb-4 tracking-tight`}>Welcome to GioGPT</h2>
            <p className={`text-xl mb-8 max-w-2xl leading-relaxed ${theme.text.replace("white", "gray-300")}`}>
              Your privacy-focused AI assistant. No conversation history stored locally.
            </p>

            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {[
                "Generate an image of a Roman Emperor",
                "Explain quantum computing",
                "Help me write secure code",
                "Write me a personal website",
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleInputChange({ target: { value: suggestion } } as any)
                    setTimeout(() => inputRef.current?.focus(), 100)
                  }}
                  className={`p-4 text-left ${theme.card} backdrop-blur-sm rounded-2xl border ${theme.border} hover:border-opacity-75 transition-all duration-200 group`}
                >
                  <span
                    className={`${theme.text.replace("white", "gray-300")} group-hover:${theme.text} transition-colors`}
                  >
                    {suggestion}
                  </span>
                </button>
              ))}
            </div> */}
          </div>
        ) : (
          /* Messages */
          <div className="py-8 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] ${
                    message.role === "user"
                      ? `bg-gradient-to-r ${theme.accent} text-white rounded-3xl rounded-br-lg shadow-lg`
                      : `${theme.card} backdrop-blur-sm ${theme.text} rounded-3xl rounded-bl-lg border ${theme.border} shadow-lg`
                  } px-6 py-4`}
                >
                  {message.role === "user" ? (
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</div>
                  ) : (
                    <div className="relative group">
                      <MarkdownRenderer content={message.content} />
                      <button
                        onClick={() => copyTextToClipboard(message.content, `message-${message.id}`)}
                        className={`absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                          copiedText === `message-${message.id}`
                            ? 'bg-green-500/80 text-white'
                            : 'bg-gray-600/80 hover:bg-gray-500/80 text-gray-200'
                        }`}
                        title={copiedText === `message-${message.id}` ? "Copied!" : "Copy response"}
                      >
                        {copiedText === `message-${message.id}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {(isTyping || isGeneratingImage) && (
              <div className="flex justify-start">
                <div
                  className={`${theme.card} backdrop-blur-sm ${theme.text} rounded-3xl rounded-bl-lg border ${theme.border} px-6 py-4 shadow-lg min-w-80`}
                >
                  {isGeneratingImage ? (
                    /* Image Generation Progress Bar */
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Sparkles className={`w-4 h-4 ${
                          currentTheme === "neon"
                            ? "text-pink-400"
                            : currentTheme === "ocean"
                              ? "text-teal-400"
                              : currentTheme === "forest"
                                ? "text-emerald-400"
                                : currentTheme === "minimal"
                                  ? "text-slate-400"
                                  : "text-blue-400"
                        } animate-pulse`} />
                        <span className="text-sm font-medium">Generating image...</span>
                        <span className="text-xs opacity-75">{Math.min(Math.round(imageProgress), 100)}%</span>
                      </div>
                      <div className={`relative w-full h-2 rounded-full overflow-hidden ${
                        currentTheme === "neon"
                          ? "bg-pink-900/30"
                          : currentTheme === "ocean"
                            ? "bg-teal-900/30"
                            : currentTheme === "forest"
                              ? "bg-emerald-900/30"
                              : currentTheme === "minimal"
                                ? "bg-slate-700/30"
                                : "bg-gray-700/30"
                      }`}>
                        <div
                          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${theme.accent} transition-all duration-300 ease-out rounded-full`}
                          style={{ width: `${Math.min(imageProgress, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular Chat Thinking Indicator */
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            currentTheme === "neon"
                              ? "bg-pink-400"
                              : currentTheme === "ocean"
                                ? "bg-teal-400"
                                : currentTheme === "forest"
                                  ? "bg-emerald-400"
                                  : currentTheme === "minimal"
                                    ? "bg-slate-400"
                                    : "bg-gray-400"
                          }`}
                        ></div>
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            currentTheme === "neon"
                              ? "bg-pink-400"
                              : currentTheme === "ocean"
                                ? "bg-teal-400"
                                : currentTheme === "forest"
                                  ? "bg-emerald-400"
                                  : currentTheme === "minimal"
                                    ? "bg-slate-400"
                                    : "bg-gray-400"
                          }`}
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            currentTheme === "neon"
                              ? "bg-pink-400"
                              : currentTheme === "ocean"
                                ? "bg-teal-400"
                                : currentTheme === "forest"
                                  ? "bg-emerald-400"
                                  : currentTheme === "minimal"
                                    ? "bg-slate-400"
                                    : "bg-gray-400"
                          }`}
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm">GioGPT is thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div
        className={`fixed bottom-0 left-0 right-0 pt-8 pb-6`}
        style={{
          background: `linear-gradient(to top, ${
            currentTheme === "dark" 
              ? "rgb(0, 0, 0), rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.8)"
              : currentTheme === "neon"
                ? "rgb(24, 24, 27), rgba(88, 28, 135, 0.95), rgba(88, 28, 135, 0.8)"
                : currentTheme === "ocean"
                  ? "rgb(15, 23, 42), rgba(30, 58, 138, 0.95), rgba(30, 58, 138, 0.8)"
                  : currentTheme === "forest"
                    ? "rgb(20, 83, 45), rgba(21, 128, 61, 0.95), rgba(21, 128, 61, 0.8)"
                    : "rgb(15, 23, 42), rgba(51, 65, 85, 0.95), rgba(51, 65, 85, 0.8)"
          })`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="relative">
            <div
              className={`relative flex items-center ${theme.card} backdrop-blur-xl rounded-3xl border ${theme.border} shadow-2xl transition-all duration-200`}
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask questions or generate images..."
                className={`flex-1 border-0 bg-transparent px-4 py-4 text-[16px] ${theme.text} placeholder:${theme.text.replace("white", "gray-400")} focus-visible:ring-0 focus-visible:ring-offset-0 rounded-3xl`}
                disabled={isLoading || isGeneratingImage}
              />
              {isLoading || isTyping || isGeneratingImage ? (
                <Button
                  type="button"
                  onClick={isGeneratingImage ? undefined : stopGeneration}
                  className={`mr-2 w-10 h-10 rounded-full ${
                    isGeneratingImage 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  } transition-all duration-200 flex items-center justify-center shadow-lg`}
                  title={isGeneratingImage ? "Generating image..." : "Stop generation"}
                  disabled={isGeneratingImage}
                >
                  <Square className="w-4 h-4 text-white fill-white" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!input.trim()}
                  className={`mr-2 w-10 h-10 rounded-full bg-gradient-to-r ${theme.accent} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg`}
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              )}
            </div>
          </form>
          <p className={`text-center text-xs mt-3 ${theme.text.replace("white", "gray-500")}`}>
            🔒 Private & secure
          </p>
        </div>
      </div>

      {/* Click outside to close theme selector */}
      {showThemeSelector && <div className="fixed inset-0 z-40" onClick={() => setShowThemeSelector(false)} />}

      {/* Floating Theme Selector */}
      <div className="fixed bottom-28 right-6 z-50">
        <Button
          onClick={() => setShowThemeSelector(!showThemeSelector)}
          className={`p-3 rounded-full bg-gradient-to-r ${theme.accent} hover:opacity-80 transition-opacity shadow-2xl`}
          title="Change Theme"
        >
          <Palette className="w-5 h-5 text-white" />
        </Button>
        {showThemeSelector && (
          <div
            className={`absolute bottom-16 right-0 ${theme.card} backdrop-blur-xl border ${theme.border} rounded-2xl p-4 shadow-2xl min-w-48`}
          >
            <h3 className={`text-sm font-semibold ${theme.text} mb-3`}>Choose Theme</h3>
            <div className="space-y-2">
              {Object.entries(themes).map(([key, themeOption]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentTheme(key as Theme)
                    setShowThemeSelector(false)
                  }}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all ${
                    currentTheme === key
                      ? `bg-gradient-to-r ${themeOption.accent} text-white`
                      : `hover:${theme.card} ${theme.text.replace("white", "gray-300")}`
                  }`}
                >
                  <div className={`w-4 h-4 bg-gradient-to-br ${themeOption.accent} rounded-full`}></div>
                  <span className="text-sm">{themeOption.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
