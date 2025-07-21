export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new Response('Image URL is required', { status: 400 })
    }

    // Fetch the image from the OpenAI URL
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()

    // Return the image with proper headers for download
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="giogpt-image-${Date.now()}.png"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return new Response('Failed to download image', { status: 500 })
  }
} 