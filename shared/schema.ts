import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("employee"),
  isActive: boolean("is_active").notNull().default(true),
});

export const pixelSettings = pgTable("pixel_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  pixelId: text("pixel_id").notNull(),
  accessToken: text("access_token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  name: text("name").notNull(),
  subscribers: integer("subscribers").notNull(),
  logo: text("logo").notNull(),
  inviteLink: text("invite_link").notNull(),
  description: text("description").default("👨🏻‍🏫 Start Your Profitable Journey with NISM Registered research analyst\n\nIndia's Best Channel For Option Trading\n\n✅ 👇🏻Click on the below link Before it Expires 👇🏻"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").notNull(),
  // Add custom pixel settings fields
  customPixelId: text("custom_pixel_id"),
  customAccessToken: text("custom_access_token"),
});

// Only used internally for admin creating new employees
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Login schema - only username and password
export const loginUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPixelSettingsSchema = createInsertSchema(pixelSettings)
  .pick({
    pixelId: true,
    accessToken: true,
  });

export const insertChannelSchema = createInsertSchema(channels)
  .pick({
    name: true,
    subscribers: true, 
    inviteLink: true,
    description: true,
    customPixelId: true,
    customAccessToken: true
  })
  .extend({
    subscribers: z.coerce.number().min(0),
    description: z.string().optional(),
    logo: z.any(), // This is a placeholder, needs further refinement based on the actual File type.
    customPixelId: z.string().optional(),
    customAccessToken: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPixelSettings = z.infer<typeof insertPixelSettingsSchema>;
export type PixelSettings = typeof pixelSettings.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;