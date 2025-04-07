import { pgTable, text, serial, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  mode: varchar("mode", { length: 20 }).notNull().default('harmonograph'),
  colorScheme: varchar("color_scheme", { length: 20 }).notNull().default('default'),
  sensitivity: integer("sensitivity").notNull().default(75),
  complexity: integer("complexity").notNull().default(60),
  decay: integer("decay").notNull().default(40),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  mode: true,
  colorScheme: true,
  sensitivity: true,
  complexity: true,
  decay: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
