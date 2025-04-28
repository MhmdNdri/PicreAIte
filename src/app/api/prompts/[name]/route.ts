import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { PromptTable } from "@/drizzle/schema";
import { eq, isNull, and } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: any }) {
  try {
    const prompt = await db
      .select()
      .from(PromptTable)
      .where(
        and(eq(PromptTable.name, params.name), isNull(PromptTable.deletedAt))
      )
      .then((prompts) => prompts[0]);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
