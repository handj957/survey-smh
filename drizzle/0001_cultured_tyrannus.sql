CREATE TABLE `question_overrides` (
	`role` text PRIMARY KEY NOT NULL,
	`revision` text NOT NULL,
	`questions` text NOT NULL,
	`updated_at` text NOT NULL
);
