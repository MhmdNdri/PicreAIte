import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ApiKeyService } from "@/services/apiKeyService";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    if (!body.apiKey) {
      return new NextResponse("API key is required", { status: 400 });
    }

    await ApiKeyService.setApiKey(userId, body.apiKey);
    return new NextResponse("API key saved successfully", { status: 200 });
  } catch (error) {
    console.error("Error setting API key:", error);
    return new NextResponse("Failed to save API key", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const apiKey = await ApiKeyService.getApiKey(userId);

    if (!apiKey) {
      return new NextResponse("API key not found", { status: 404 });
    }

    // Return only the last 4 characters for security
    const maskedKey = `sk-...${apiKey.slice(-4)}`;
    return NextResponse.json({ apiKey: maskedKey });
  } catch (error) {
    console.error("Error getting API key:", error);
    return new NextResponse("Failed to retrieve API key", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await ApiKeyService.deleteApiKey(userId);
    return new NextResponse("API key deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return new NextResponse("Failed to delete API key", { status: 500 });
  }
}
