import { z } from 'zod';

export const schema = z.object({
	url: z.string(),
	username: z.string(),
	password: z.string(),
	message: z.string().optional()
});

export type ConfigureSchema = typeof schema;
