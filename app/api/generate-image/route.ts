import { openai } from "@ai-sdk/openai"
import OpenAI from 'openai'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { prompt, size = "1024x1024", quality = "standard" } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({
          error: "Prompt is required and must be a string.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

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

    console.log("Generating image with prompt:", prompt.substring(0, 100) + "...")

    // Use OpenAI client directly
    const client = new OpenAI({
      apiKey: apiKey,
    })

    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: size,
      quality: quality,
      style: "vivid"
    })

    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error("No image URL returned from OpenAI")
    }

    const imageUrl = response.data[0].url as string

    return new Response(
      JSON.stringify({
        success: true,
        image: imageUrl,
        prompt: prompt,
        revised_prompt: response.data[0].revised_prompt
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )

  } catch (error: any) {
    console.error("Image generation error:", error)

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

    if (error?.message?.includes("content_policy_violation")) {
      return new Response(JSON.stringify({ error: "The image prompt violates OpenAI's content policy. Please try a different prompt." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        error: "Failed to generate image. Please try again.",
        details: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
} 