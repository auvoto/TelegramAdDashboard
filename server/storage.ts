import { InsertUser, User, Channel, InsertChannel } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomUUID } from "crypto";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createChannel(channel: InsertChannel, userId: number): Promise<Channel>;
  getChannel(uuid: string): Promise<Channel | undefined>;
  getUserChannels(userId: number): Promise<Channel[]>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private channels: Map<string, Channel>;
  private currentUserId: number;
  private currentChannelId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.channels = new Map();
    this.currentUserId = 1;
    this.currentChannelId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createChannel(insertChannel: InsertChannel, userId: number): Promise<Channel> {
    const id = this.currentChannelId++;
    const uuid = randomUUID();
    const channel: Channel = {
      ...insertChannel,
      id,
      uuid,
      userId,
      createdAt: new Date(),
    };
    this.channels.set(uuid, channel);
    return channel;
  }

  async getChannel(uuid: string): Promise<Channel | undefined> {
    return this.channels.get(uuid);
  }

  async getUserChannels(userId: number): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.userId === userId,
    );
  }
}

export const storage = new MemStorage();
