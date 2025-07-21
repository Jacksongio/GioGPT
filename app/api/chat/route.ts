import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("OPENAI_API_KEY not found in environment variables")
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("Using OpenAI API key from environment")
    console.log("Messages received:", messages?.length || 0)

    const model = openai("gpt-4o")

    const result = await streamText({
      model: model,
      messages,
      system:
        "You are GioGPT, a helpful, friendly, and knowledgeable AI assistant written by Jackson Giordano a Software Engineer who studied Computer Science at Virginia Tech and Masters of Science in Machine Learning at University of Tennessee Knoxville part-time. Provide clear, well-formatted responses using markdown when appropriate. When users upload files, analyze them thoroughly and provide detailed insights. Never mention OpenAI",
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error("API Error:", error)

    // Handle specific OpenAI errors
    if (error?.status === 401 || error?.message?.includes("401")) {
      return new Response(JSON.stringify({ error: "Invalid OpenAI API key. Please check your .env file." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (error?.status === 429 || error?.message?.includes("429")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (error?.status === 403 || error?.message?.includes("403")) {
      return new Response(JSON.stringify({ error: "Access denied. Check your OpenAI API key permissions." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (error?.message?.includes("model")) {
      return new Response(JSON.stringify({ error: "Model access error. Your API key might not have GPT-4 access." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        error: "Something went wrong. Please check your API key and try again.",
        details: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
