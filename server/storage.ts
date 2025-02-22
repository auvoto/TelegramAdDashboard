import { users, channels, type User, type InsertUser, type Channel, type InsertChannel } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { randomUUID } from "node:crypto";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createChannel(channel: InsertChannel, userId: number): Promise<Channel>;
  getChannel(uuid: string): Promise<Channel | undefined>;
  getUserChannels(userId: number): Promise<Channel[]>;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createChannel(insertChannel: InsertChannel, userId: number): Promise<Channel> {
    const uuid = randomUUID();
    const [channel] = await db
      .insert(channels)
      .values({ 
        ...insertChannel, 
        userId,
        uuid 
      })
      .returning();
    return channel;
  }

  async getChannel(uuid: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.uuid, uuid));
    return channel;
  }

  async getUserChannels(userId: number): Promise<Channel[]> {
    return await db.select().from(channels).where(eq(channels.userId, userId));
  }
}

export const storage = new DatabaseStorage();