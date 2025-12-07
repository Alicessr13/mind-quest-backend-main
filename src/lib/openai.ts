import OpenAI from "openai";
import { env } from "@/env";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AppError } from "@/errors/app-error";

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

const studyPlanSchema = z.object({
    subject: z.string(),
    subtopics: z.array(z.object({
        name: z.string(),
        allocated_minutes: z.number(),
        learning_objectives: z.array(z.string()),
    })),
});

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
        model: 'gpt-4.1-nano',
        messages: [
            {
                role: "system",
                content: `Você é um planejador educacional experiente especializado em criar planos de estudo eficientes e personalizados.

Suas responsabilidades:
- Dividir o tópico principal em subtópicos lógicos e progressivos
- Distribuir o tempo de forma equilibrada considerando a complexidade de cada subtópico
- Definir objetivos de aprendizado claros para cada subtópico
- Seguir uma progressão do básico ao avançado

**REGRAS CRÍTICAS:**
1. Nenhum subtópico individual deve ter 'allocated_minutes' superior a 90 minutos
2. Se um tópico for complexo, divida-o em partes sequenciais (ex: 'Parte 1', 'Parte 2')
3. A soma EXATA de todos os 'allocated_minutes' DEVE ser igual a ${prompt.total_minutes} minutos
4. Use TODO o tempo disponível sem exceder ou faltar minutos

**IMPORTANTE**: Crie subtópicos suficientes para usar EXATAMENTE ${prompt.total_minutes} minutos.`,
            },
            {
                role: "user",
                content: `Crie um plano de estudos completo para:

Tópico: ${prompt.subject}
Tempo total disponível: ${prompt.total_minutes} minutos

A soma dos allocated_minutes de TODOS os subtópicos deve ser EXATAMENTE ${prompt.total_minutes} minutos.`,
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

    // Validar e ajustar para garantir que o total seja exato
    const totalAllocated = parsed.subtopics.reduce((sum, st) => sum + st.allocated_minutes, 0);
    const difference = prompt.total_minutes - totalAllocated;

    if (difference !== 0) {
        // Ajustar o último subtópico para compensar a diferença
        const lastSubtopic = parsed.subtopics[parsed.subtopics.length - 1];
        if (lastSubtopic) {
            lastSubtopic.allocated_minutes += difference;
            // Garantir que não fique negativo
            if (lastSubtopic.allocated_minutes < 10) {
                lastSubtopic.allocated_minutes = 10;
            }
        }
    }

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
        model: 'gpt-4.1-nano',
        messages: [
            {
                role: "system",
                content: `Você é um assistente especializado em criar descrições diárias de estudo curtas e concisas e práticas.

**Regras:**
1. Objetividade: Descrição concisa, direta e clara (máximo 3-4 frases)
2. Foco em Ação: Instruções práticas sobre o que estudar hoje
3. Variação: Sugira diferentes tipos de atividades (Análise, Resumo, Mapa Mental, Projeto, etc)
4. Adaptação ao Progresso:
   - Início: Conceitos fundamentais
   - Meio: Conexões e aprofundamento
   - Fim: Revisão e aplicação prática`,
            },
            {
                role: "user",
                content: `Gere uma descrição breve para a sessão de hoje:

- Tópico: ${params.subject}
- Subtópico: ${params.subtopic}
- Tempo: ${params.allocated_minutes} minutos
- Progresso: Dia ${params.day_number}/${params.total_days}
${params.is_first_day ? "- INÍCIO do plano (foque em fundamentos)" : ""}
${params.is_last_day ? "- FIM do plano (foque em revisão e aplicação)" : ""}

Objetivos:
${params.learning_objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}`,
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
    console.log('Generated daily description:', parsed);
    return parsed;
}