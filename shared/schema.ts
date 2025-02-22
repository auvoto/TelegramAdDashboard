import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChannelSchema = createInsertSchema(channels)
  .pick({
    name: true,
    subscribers: true, 
    inviteLink: true,
    description: true,
    logo:true
  })
  .extend({
    subscribers: z.coerce.number().min(0),
    description: z.string().optional(),
    logo: z.any(), //This is a placeholder, needs further refinement based on the actual File type.
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;