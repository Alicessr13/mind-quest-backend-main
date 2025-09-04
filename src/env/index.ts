import { z } from 'zod';

const env_schema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string(),
    OPENAI_API_KEY: z.string(),
});

const env_parse = env_schema.safeParse(process.env);

if (env_parse.success === false) {
    console.error('❌ Invalid environment variables: ', env_parse.error.format());
    throw new Error('Invalid environment variables');
}

export const env = env_parse.data;
