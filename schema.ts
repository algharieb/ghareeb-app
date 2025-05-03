import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  role: text("role").default("host").notNull(),
  lastSeen: timestamp("last_seen").defaultNow(),
  isOnline: boolean("is_online").default(false),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content"),
  contentType: text("content_type").default("text").notNull(), // text, image, audio, financial
  mediaUrl: text("media_url"),
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata")
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("general").notNull(), // general, financial, broadcast
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata")
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  notifications: many(notifications)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sender" }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: "receiver" })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] })
}));

// Schemas
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  email: (schema) => schema.email("Must provide a valid email").optional()
}).omit({ id: true, lastSeen: true, isOnline: true, createdAt: true });

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, timestamp: true, isRead: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true, timestamp: true, isRead: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
