import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { PromptTable } from "@/drizzle/schema";
import { eq, isNull, and } from "drizzle-orm";
import { handleRouteError, notFound } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    const prompt = await db
      .select()
      .from(PromptTable)
      .where(and(eq(PromptTable.name, name), isNull(PromptTable.deletedAt)))
      .then((prompts) => prompts[0]);

    if (!prompt) {
      throw notFound("Prompt not found");
    }

    return NextResponse.json(prompt);
  } catch (error) {
    return handleRouteError({
      error,
      fallbackMessage: "Failed to fetch prompt",
      context: "api/prompts/[name] GET",
    });
  }
}
