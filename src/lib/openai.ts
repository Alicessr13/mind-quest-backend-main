import OpenAI from "openai";
import { env } from "@/env";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AppError } from "@/errors/app-error";

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

const responseSchema = z.object({
    subject: z.string(),
    subtopics: z.array(z.object({
        name: z.string(),
        allocated_minutes: z.number(),
    })),
});

export async function gpt(prompt: {
    subject: string;
    total_minutes: number;
}) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: "system",
                content: "Você é um planejador de plano de estudos",
            },
            {
                role: "system",
                content: "Você deve separar o tópico principal em subtópicos",
            },
            {
                role: "system",
                content: "Você deve usar todo o tempo fornecido para gerar o plano de estudo e retornar em minutos",
            },
            {
                role: "user",
                content: `tópico: ${prompt.subject}; total de minutos disponíveis: ${prompt.total_minutes}`,
            },
        ],
        response_format: zodResponseFormat(responseSchema, "event"),
    });

    if (!completion.choices[0].message.content) {
        throw new AppError('failed to generate plan', 502);
    }

    const { subject, subtopics } = responseSchema.parse(JSON.parse(completion.choices[0].message.content));

    return { subject, subtopics };
}
