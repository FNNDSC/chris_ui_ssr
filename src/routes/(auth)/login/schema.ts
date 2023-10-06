import { z } from 'zod';

export const schema = z.object({
	username: z.string(),
	password: z.string(),
	message: z.string().optional()
});
export type LoginSchema = typeof schema;
