import crypto from "crypto";
import { db } from "@/drizzle/db";
import { userApiKeys } from "@/drizzle/schema/userApiKeys";
import { eq } from "drizzle-orm";

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";

if (!ENCRYPTION_KEY) {
  throw new Error("API_KEY_ENCRYPTION_KEY is not set in environment variables");
}

const encryptionKeyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");

export class ApiKeyService {
  private static encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKeyBuffer, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
  }

  private static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }

    const [ivHex, encrypted, authTagHex] = parts;

    if (!ivHex || !encrypted || !authTagHex) {
      throw new Error("Invalid encrypted text parts");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      encryptionKeyBuffer,
      iv
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted as string;
  }

  static async setApiKey(userId: string, apiKey: string): Promise<void> {
    const encryptedApiKey = this.encrypt(apiKey);

    await db
      .insert(userApiKeys)
      .values({
        userId,
        encryptedApiKey,
      })
      .onConflictDoUpdate({
        target: userApiKeys.userId,
        set: {
          encryptedApiKey,
          updatedAt: new Date(),
        },
      });
  }

  static async getApiKey(userId: string): Promise<string | null> {
    const result = await db
      .select()
      .from(userApiKeys)
      .where(eq(userApiKeys.userId, userId))
      .limit(1);

    const apiKey = result[0]?.encryptedApiKey;
    if (!apiKey) {
      return null;
    }

    return this.decrypt(apiKey);
  }

  static async updateLastUsed(userId: string): Promise<void> {
    await db
      .update(userApiKeys)
      .set({
        lastUsedAt: new Date(),
      })
      .where(eq(userApiKeys.userId, userId));
  }

  static async deleteApiKey(userId: string): Promise<void> {
    await db.delete(userApiKeys).where(eq(userApiKeys.userId, userId));
  }
}
