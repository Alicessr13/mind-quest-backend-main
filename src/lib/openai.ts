import OpenAI from "openai";
import { env } from "@/env";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AppError } from "@/errors/app-error";

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

// Schema para o plano de estudos inicial
const studyPlanSchema = z.object({
    subject: z.string(),
    subtopics: z.array(z.object({
        name: z.string(),
        allocated_minutes: z.number(),
        learning_objectives: z.array(z.string()),
    })),
});

// Schema para descrição diária
const dailyDescriptionSchema = z.object({
    description: z.string(),
    key_points: z.array(z.string()),
    suggested_activities: z.array(z.string()),
});

export async function generateStudyPlan(prompt: {
    subject: string;
    total_minutes: number;
}) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: "system",
                content: `Você é um planejador educacional experiente especializado em criar planos de estudo eficientes e personalizados.

Suas responsabilidades:
- Dividir o tópico principal em subtópicos lógicos e progressivos
- Distribuir o tempo de forma equilibrada considerando a complexidade de cada subtópico
- Definir objetivos de aprendizado claros para cada subtópico
- Seguir uma progressão do básico ao avançado

Use TODO o tempo disponível (${prompt.total_minutes} minutos) de forma inteligente.`,
            },
            {
                role: "user",
                content: `Crie um plano de estudos completo para:

Tópico: ${prompt.subject}
Tempo total disponível: ${prompt.total_minutes} minutos

Divida em subtópicos sequenciais que cobrem desde conceitos fundamentais até aplicações práticas.`,
            },
        ],
        response_format: zodResponseFormat(studyPlanSchema, "study_plan"),
    });

    if (!completion.choices[0].message.content) {
        throw new AppError('Falha ao gerar plano de estudos', 502);
    }

    const parsed = studyPlanSchema.parse(
        JSON.parse(completion.choices[0].message.content)
    );

    return parsed;
}

export async function generateDailyDescription(params: {
    subject: string;
    subtopic: string;
    allocated_minutes: number;
    day_number: number;
    total_days: number;
    learning_objectives: string[];
    is_first_day: boolean;
    is_last_day: boolean;
}) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: "system",
                content: `Você é um tutor educacional que cria descrições motivadoras e práticas para sessões de estudo diárias.

Suas descrições devem:
- Ser inspiradoras e motivacionais
- Explicar claramente o que será estudado
- Incluir pontos-chave a serem dominados
- Sugerir atividades práticas e técnicas de estudo
- Adaptar o tom ao progresso do aluno (início, meio ou fim do plano)`,
            },
            {
                role: "user",
                content: `Crie uma descrição detalhada para esta sessão de estudo:

Contexto:
- Tópico geral: ${params.subject}
- Subtópico de hoje: ${params.subtopic}
- Tempo disponível: ${params.allocated_minutes} minutos
- Dia ${params.day_number} de ${params.total_days}
${params.is_first_day ? "- É o PRIMEIRO dia do plano!" : ""}
${params.is_last_day ? "- É o ÚLTIMO dia do plano!" : ""}

Objetivos de aprendizado:
${params.learning_objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Crie uma descrição que motive o estudante e forneça direcionamento claro sobre o que fazer.`,
            },
        ],
        response_format: zodResponseFormat(dailyDescriptionSchema, "daily_description"),
    });

    if (!completion.choices[0].message.content) {
        throw new AppError('Falha ao gerar descrição diária', 502);
    }

    const parsed = dailyDescriptionSchema.parse(
        JSON.parse(completion.choices[0].message.content)
    );

    return parsed;
}