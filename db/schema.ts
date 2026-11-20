import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const responses = sqliteTable('responses', {id:text('id').primaryKey(), role:text('role').notNull(), answers:text('answers').notNull(), comment:text('comment').notNull(), createdAt:text('created_at').notNull()});
export const questionOverrides = sqliteTable('question_overrides', {role:text('role').primaryKey(), revision:text('revision').notNull(), questions:text('questions').notNull(), updatedAt:text('updated_at').notNull()});
