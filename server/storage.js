const { users, channels, pixelSettings } = require("@shared/schema");
const { db } = require("./db");
const { eq, and } = require("drizzle-orm");
const session = require("express-session");
const connectPg = require("connect-pg-simple");
const { pool } = require("./db");
const { randomUUID } = require("node:crypto");
const { writeFile, mkdir, unlink } = require("fs/promises");
const { join } = require("path");

const PostgresSessionStore = connectPg(session);

class DatabaseStorage {
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsers() {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserRole(userId, role) {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getPixelSettings(userId) {
    const [settings] = await db
      .select()
      .from(pixelSettings)
      .where(eq(pixelSettings.userId, userId));
    return settings;
  }

  async createPixelSettings(insertSettings, userId) {
    const [settings] = await db
      .insert(pixelSettings)
      .values({ ...insertSettings, userId })
      .returning();
    return settings;
  }

  async updatePixelSettings(userId, insertSettings) {
    const [settings] = await db
      .update(pixelSettings)
      .set(insertSettings)
      .where(eq(pixelSettings.userId, userId))
      .returning();
    return settings;
  }

  async createChannel(insertChannel, userId, logoFile) {
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

  async updateChannel(channelId, channel, logoFile) {
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

  async getChannel(uuid) {
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

  async getUserChannels(userId) {
    console.log('Fetching channels for user:', userId);
    const userChannels = await db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.userId, userId),
          eq(channels.deleted, false)
        )
      );
    console.log('Found channels:', userChannels.length, 'Deleted status of first channel:', userChannels[0]?.deleted);
    return userChannels;
  }

  async deleteChannel(channelId) {
    console.log('Starting deleteChannel process for ID:', channelId);

    try {
      const [channel] = await db
        .select()
        .from(channels)
        .where(eq(channels.id, channelId));

      console.log('Found channel to delete:', channel);

      if (channel?.logo) {
        try {
          const logoPath = join(process.cwd(), channel.logo.replace(/^\/uploads/, 'uploads'));
          await unlink(logoPath);
          console.log('Logo file deleted successfully:', logoPath);
        } catch (error) {
          console.error('Error deleting logo file:', error);
        }
      }

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
      throw error;
    }
  }
}

const storage = new DatabaseStorage();
module.exports = { storage, DatabaseStorage };
