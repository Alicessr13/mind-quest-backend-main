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

**REGRA CRÍTICA DE GRANULARIDADE:** Nenhum subtópico individual deve ter 'allocated_minutes' superior a **90 minutos**. Se um tópico for complexo e exigir mais tempo, você deve dividi-lo em partes sequenciais (ex: 'Introdução aos Hooks - Parte 1', 'Introdução aos Hooks - Parte 2').

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
                content: `Você é um **assistente inteligente** especializado em criar descrições diarias de estudo. Sua missão eh **gerar descrições de estudos conciso e prático**, focado em entregar instruções de estudo **diversificadas e de alto valor**.

**Regras estritas:**
1.  **Objetividade:** Mantenha a descrição concisa, direta e clara.
2.  **Foco em Ação e Profundidade:** A descrição deve focar no valor, importância e aplicação do subtópico de hoje, **mas com foco na seção que cabe no tempo disponível hoje.**
3.  **Variação de Atividades:** As "suggested_activities" devem variar a cada dia (ex: Análise de Caso, Resumo, Mapeamento Mental, Simulação, Mini-Projeto, Debate, etc.).
4.  **Adaptação ao Progresso:**
    * **Início do Plano:** Focar em **conceitos chave** e **configuração de base**.
    * **Meio do Plano:** Focar em **conexões entre subtópicos**, **resolução de problemas** e **aprofundamento**.
    * **Fim do Plano:** Focar em **revisão estratégica**, **aplicações complexas** e **simulação de teste**.
5.  **Diferenciação Diária (Crucial):** Se for a primeira vez que um subtópico está sendo coberto, foque na introdução. Se este subtópico foi estudado em dias anteriores (o que pode ser deduzido se o tempo alocado for uma fração do total), foque estritamente no **próximo bloco de informação** e em **atividades de retenção** do que foi visto no dia anterior.

Gere apenas a estrutura JSON pedida.`,
            },
            {
                role: "user",
                content: `Gere uma descrição, pontos-chave e atividades sugeridas para a sessão de estudo de hoje.

Contexto:
- Tópico geral: ${params.subject}
- Subtópico de hoje: ${params.subtopic}
- Tempo disponível: ${params.allocated_minutes} minutos
- Progresso: Dia ${params.day_number} de ${params.total_days}
${params.is_first_day ? " - Este é o **INÍCIO** do seu plano, priorize a base conceitual." : ""}
${params.is_last_day ? " - Este é o **FIM** do seu plano, priorize a aplicação e revisão final." : ""}
${!params.is_first_day && !params.is_last_day ? " - Este é o **MEIO** do seu plano, priorize a conexão entre temas e profundidade." : ""}

Objetivos de aprendizado a serem alcançados:
${params.learning_objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

**Cumpra as regras de adaptação ao progresso e varie as atividades sugeridas.**`,
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