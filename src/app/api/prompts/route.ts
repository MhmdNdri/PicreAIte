import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { PromptTable } from "@/drizzle/schema";
import { eq, isNull } from "drizzle-orm";
import { handleRouteError, badRequest, notFound } from "@/lib/api-errors";
import {
  promptDeleteSchema,
  promptInsertSchema,
  promptUpdateSchema,
} from "@/lib/validators";

export async function GET() {
  try {
    const prompts = await db
      .select()
      .from(PromptTable)
      .where(isNull(PromptTable.deletedAt));
    return NextResponse.json(prompts);
  } catch (error) {
    return handleRouteError({
      error,
      fallbackMessage: "Failed to fetch prompts",
      context: "api/prompts GET",
    });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch((cause) => {
      throw badRequest("Invalid JSON body", undefined, cause);
    });

    const parsed = promptInsertSchema.safeParse(json);
    if (!parsed.success) {
      throw badRequest("Invalid request body", parsed.error.flatten());
    }

    const [newPrompt] = await db
      .insert(PromptTable)
      .values({
        name: parsed.data.name,
        type: parsed.data.type,
        promptDesc: parsed.data.promptDesc,
        description: parsed.data.description ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
        originalImage: parsed.data.originalImage ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newPrompt);
  } catch (error) {
    return handleRouteError({
      error,
      fallbackMessage: "Failed to create prompt",
      context: "api/prompts POST",
    });
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json().catch((cause) => {
      throw badRequest("Invalid JSON body", undefined, cause);
    });

    const parsed = promptUpdateSchema.safeParse(json);
    if (!parsed.success) {
      throw badRequest("Invalid request body", parsed.error.flatten());
    }

    // Prepare the update data
    const updateData = {
      name: parsed.data.name,
      type: parsed.data.type,
      promptDesc: parsed.data.promptDesc,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      originalImage: parsed.data.originalImage ?? null,
      updatedAt: new Date(),
    };

    const [updatedPrompt] = await db
      .update(PromptTable)
      .set(updateData)
      .where(eq(PromptTable.id, parsed.data.id))
      .returning();

    if (!updatedPrompt) {
      throw notFound("Prompt not found");
    }

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    return handleRouteError({
      error,
      fallbackMessage: "Failed to update prompt",
      context: "api/prompts PUT",
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const json = await request.json().catch((cause) => {
      throw badRequest("Invalid JSON body", undefined, cause);
    });

    const parsed = promptDeleteSchema.safeParse(json);
    if (!parsed.success) {
      throw badRequest("Invalid request body", parsed.error.flatten());
    }

    const [deletedPrompt] = await db
      .update(PromptTable)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(PromptTable.id, parsed.data.id))
      .returning();

    return NextResponse.json(deletedPrompt);
  } catch (error) {
    return handleRouteError({
      error,
      fallbackMessage: "Failed to delete prompt",
      context: "api/prompts DELETE",
    });
  }
}
