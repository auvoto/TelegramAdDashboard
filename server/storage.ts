import { users, channels, pixelSettings, type User, type InsertUser, type Channel, type InsertChannel, type PixelSettings, type InsertPixelSettings } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User>;

  getPixelSettings(userId: number): Promise<PixelSettings | undefined>;
  createPixelSettings(settings: InsertPixelSettings, userId: number): Promise<PixelSettings>;
  updatePixelSettings(userId: number, settings: InsertPixelSettings): Promise<PixelSettings>;

  createChannel(channel: InsertChannel, userId: number, logoFile: Express.Multer.File): Promise<Channel>;
  updateChannel(channelId: number, channel: Partial<InsertChannel>, logoFile?: Express.Multer.File): Promise<Channel>;
  getChannel(uuid: string): Promise<Channel | undefined>;
  getUserChannels(userId: number): Promise<Channel[]>;
  deleteChannel(channelId: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getPixelSettings(userId: number): Promise<PixelSettings | undefined> {
    const [settings] = await db
      .select()
      .from(pixelSettings)
      .where(eq(pixelSettings.userId, userId));
    return settings;
  }

  async createPixelSettings(insertSettings: InsertPixelSettings, userId: number): Promise<PixelSettings> {
    const [settings] = await db
      .insert(pixelSettings)
      .values({ ...insertSettings, userId })
      .returning();
    return settings;
  }

  async updatePixelSettings(userId: number, insertSettings: InsertPixelSettings): Promise<PixelSettings> {
    const [settings] = await db
      .update(pixelSettings)
      .set(insertSettings)
      .where(eq(pixelSettings.userId, userId))
      .returning();
    return settings;
  }

  async createChannel(insertChannel: InsertChannel, userId: number, logoFile: Express.Multer.File): Promise<Channel> {
    const uuid = randomUUID();
    const filename = `${uuid}-${logoFile.originalname}`;
    const uploadDir = join(process.cwd(), 'uploads', 'logos');
    await mkdir(uploadDir, { recursive: true });

    const logoPath = join(uploadDir, filename);
    await writeFile(logoPath, logoFile.buffer);

    const logoUrl = `/uploads/logos/${filename}`;

    const [channel] = await db
      .insert(channels)
      .values({ 
        ...insertChannel, 
        userId,
        uuid,
        logo: logoUrl,
      })
      .returning();
    return channel;
  }

  async updateChannel(channelId: number, channel: Partial<InsertChannel>, logoFile?: Express.Multer.File): Promise<Channel> {
    let logoUrl;

    if (logoFile) {
      const uuid = randomUUID();
      const filename = `${uuid}-${logoFile.originalname}`;
      const uploadDir = join(process.cwd(), 'uploads', 'logos');
      await mkdir(uploadDir, { recursive: true });

      const logoPath = join(uploadDir, filename);
      await writeFile(logoPath, logoFile.buffer);

      logoUrl = `/uploads/logos/${filename}`;
    }

    const [updatedChannel] = await db
      .update(channels)
      .set({ 
        ...channel,
        ...(logoUrl && { logo: logoUrl }),
      })
      .where(eq(channels.id, channelId))
      .returning();

    return updatedChannel;
  }

  async getChannel(uuid: string): Promise<Channel | undefined> {
    const [channel] = await db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.uuid, uuid),
          eq(channels.deleted, false)
        )
      );
    return channel;
  }

  async getUserChannels(userId: number): Promise<Channel[]> {
    console.log('Fetching channels for user:', userId);
    // Use explicit select to ensure all columns are included
    const userChannels = await db
      .select({
        id: channels.id,
        uuid: channels.uuid,
        name: channels.name,
        nickname: channels.nickname,
        subscribers: channels.subscribers,
        logo: channels.logo,
        inviteLink: channels.inviteLink,
        description: channels.description,
        createdAt: channels.createdAt,
        userId: channels.userId,
        customPixelId: channels.customPixelId,
        customAccessToken: channels.customAccessToken,
        deleted: channels.deleted
      })
      .from(channels)
      .where(
        and(
          eq(channels.userId, userId),
          eq(channels.deleted, false)
        )
      );
    console.log('Found channels:', userChannels.length, 'First channel:', userChannels[0]);
    return userChannels;
  }

  async deleteChannel(channelId: number): Promise<void> {
    console.log('Starting deleteChannel process for ID:', channelId);

    try {
      // First, get the channel details to delete the logo file
      const [channel] = await db
        .select()
        .from(channels)
        .where(eq(channels.id, channelId));

      console.log('Found channel to delete:', channel);

      if (channel?.logo) {
        try {
          // Delete the logo file from the filesystem
          const logoPath = join(process.cwd(), channel.logo.replace(/^\/uploads/, 'uploads'));
          await unlink(logoPath);
          console.log('Logo file deleted successfully:', logoPath);
        } catch (error) {
          console.error('Error deleting logo file:', error);
          // Continue with channel deletion even if logo deletion fails
        }
      }

      // Soft delete the channel by setting deleted=true
      const [updatedChannel] = await db
        .update(channels)
        .set({ deleted: true })
        .where(eq(channels.id, channelId))
        .returning();

      if (!updatedChannel) {
        throw new Error(`Failed to update channel ${channelId}`);
      }

      console.log('Channel updated successfully:', {
        id: updatedChannel.id,
        deleted: updatedChannel.deleted
      });

    } catch (error) {
      console.error('Error in deleteChannel:', error);
      throw error; // Re-throw to handle in the route handler
    }
  }
}

export const storage = new DatabaseStorage();