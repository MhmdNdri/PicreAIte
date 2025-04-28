import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Set max duration to 300 seconds (5 minutes)
export const runtime = "nodejs"; // Specify Node.js runtime

export async function POST(request: NextRequest) {
  try {
    // Ensure OpenAI API key is set
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is missing" },
        { status: 500 }
      );
    }

    // Parse the multipart form data from the request
    const formData = await request.formData();

    // Extract params from the form data
    const prompt = formData.get("prompt") as string;
    const model = (formData.get("model") as string) || "gpt-image-1";
    const n = Number(formData.get("n")) || 1;
    const quality = (formData.get("quality") as string) || "low";
    const size = (formData.get("size") as string) || "1024x1024";
    const user = formData.get("user") as string;

    // Get all image files
    const imageFiles = formData.getAll("image[]");

    // Get mask file if provided
    const maskFile = formData.get("mask") as File | null;

    // Create the new form data to send to OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append("prompt", prompt);
    openaiFormData.append("model", model);
    openaiFormData.append("n", n.toString());
    openaiFormData.append("quality", quality);
    openaiFormData.append("size", size);

    if (user) {
      openaiFormData.append("user", user);
    }

    // Append all image files
    imageFiles.forEach((imageFile, index) => {
      if (index === 0) {
        // First image goes under 'image' key
        openaiFormData.append("image", imageFile as File);
      } else {
        // Additional images go under 'image' key too (OpenAI will handle this)
        openaiFormData.append("image", imageFile as File);
      }
    });

    // Append mask if provided
    if (maskFile) {
      openaiFormData.append("mask", maskFile);
    }

    // Call the OpenAI API
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: openaiFormData,
    });

    // Check if response is successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Error calling OpenAI API" },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in generate-image API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
