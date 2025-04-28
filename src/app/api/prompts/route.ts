import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { PromptTable } from "@/drizzle/schema";
import { eq, isNull } from "drizzle-orm";

export async function GET() {
  try {
    const prompts = await db
      .select()
      .from(PromptTable)
      .where(isNull(PromptTable.deletedAt));
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.type || !data.promptDesc) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: {
            name: data.name,
            type: data.type,
            promptDesc: data.promptDesc,
          },
        },
        { status: 400 }
      );
    }

    const [newPrompt] = await db
      .insert(PromptTable)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newPrompt);
  } catch (error) {
    console.error("Error creating prompt:", error);
    return NextResponse.json(
      {
        error: "Failed to create prompt",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: "Missing prompt ID" }, { status: 400 });
    }

    const [updatedPrompt] = await db
      .update(PromptTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(PromptTable.id, data.id))
      .returning();

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Prompt ID is required" },
        { status: 400 }
      );
    }

    const [deletedPrompt] = await db
      .update(PromptTable)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(PromptTable.id, id))
      .returning();

    return NextResponse.json(deletedPrompt);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}
