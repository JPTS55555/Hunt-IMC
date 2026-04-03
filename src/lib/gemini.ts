import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

// Initialize Gemini
// We use a getter so it picks up the env var correctly if it changes or is loaded late
export const getGemini = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("ERRO CRÍTICO: GEMINI_API_KEY não está definida nas variáveis de ambiente!");
    throw new Error("A chave da API do Gemini não está configurada. Por favor, adiciona a variável GEMINI_API_KEY no Vercel e faz um novo Deploy.");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const generateMicroHabits = async (goal: string, currentWeight: number, targetWeight: number) => {
  try {
    const ai = getGemini();
    const prompt = `
    O utilizador tem um peso atual de ${currentWeight}kg e um objetivo de ${targetWeight}kg.
    O seu objetivo principal é: ${goal}.
    Gera 3 micro-hábitos diários simples, realistas e saudáveis para ajudar o utilizador a atingir este objetivo.
    Retorna APENAS um array JSON de strings.
  `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error: any) {
    console.error("Error generating habits:", error);
    if (error.message?.includes('GEMINI_API_KEY')) throw error;
    return ["Beber 2L de água", "Caminhar 15 minutos", "Dormir 7-8 horas"]; // Fallback
  }
};

export const analyzeHealthImage = async (base64Image: string, mimeType: string) => {
  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          }
        },
        "Analisa esta imagem relacionada com saúde/fitness (pode ser uma refeição ou um exercício). Dá-me um feedback construtivo, estimativa de calorias/macronutrientes (se for comida) ou dicas de postura (se for exercício). Sê encorajador e usa português de Portugal."
      ]
    });
    return response.text;
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return "Erro: A chave da API do Gemini não está configurada no Vercel. Por favor, adiciona a variável GEMINI_API_KEY e faz um novo Deploy.";
    }
    return "Desculpa, não consegui analisar a imagem neste momento.";
  }
};

export const getHealthAdviceWithThinking = async (question: string, profile?: any, communityData?: any) => {
  try {
    const ai = getGemini();
    let systemInstruction = `És um coach de saúde e fitness motivacional, empático e muito humano. 
    Usa português de Portugal. 
    Fala de forma natural, como um amigo experiente que quer ajudar. 
    NÃO uses formatação markdown (sem asteriscos, sem cardinais, sem negritos, sem listas complexas). Escreve apenas texto simples e limpo.`;
    
    if (profile) {
      systemInstruction += `\n\nDados do utilizador com quem estás a falar: 
      - Peso atual: ${profile.currentWeight}kg
      - Objetivo: ${profile.targetWeight}kg
      - Altura: ${profile.height}cm
      - Género: ${profile.gender}
      - Objetivo principal: ${profile.goal}
      Usa estes dados para dar conselhos super personalizados.`;
    }

    if (communityData) {
      systemInstruction += `\n\nDados anónimos da comunidade BioBússola (usa isto para contextualizar e motivar o utilizador, mostrando que ele não está sozinho):
      - Peso médio dos utilizadores: ${communityData.averageWeight}kg
      - Objetivo médio: ${communityData.averageTarget}kg
      - Objetivos mais comuns: ${communityData.commonGoals.join(', ')}
      - Total de utilizadores na comunidade: ${communityData.totalUsers}
      Podes referir estes dados de forma natural, por exemplo: "Muitas pessoas na nossa comunidade também procuram..." ou "O peso médio da malta por aqui anda à volta de..."`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: question,
      config: {
        systemInstruction
      }
    });
    
    // Remove any markdown bolding/headers that might have slipped through
    let cleanText = response.text || "";
    cleanText = cleanText.replace(/[*#_]/g, '');
    
    return cleanText;
  } catch (error: any) {
    console.error("Error getting advice:", error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return "Erro: A chave da API do Gemini não está configurada no Vercel. Por favor, adiciona a variável GEMINI_API_KEY e faz um novo Deploy.";
    }
    return "Desculpa, ocorreu um erro ao processar a tua pergunta.";
  }
};

export const generateActionPlan = async (base64Data: string, mimeType: string, profile: any, depth: 'rapida' | 'profunda') => {
  try {
    const ai = getGemini();
    const modelToUse = depth === 'profunda' ? "gemini-3.1-pro-preview" : "gemini-3.1-flash-lite-preview";
    
    const prompt = `
      Analisa a imagem do físico deste utilizador.
      Dados do utilizador:
      - Peso atual: ${profile.currentWeight}kg
      - Objetivo: ${profile.targetWeight}kg
      - Altura: ${profile.height}cm
      - Género: ${profile.gender}

      Com base na imagem e nestes dados, gera um plano de ação a longo prazo.
      Retorna APENAS um objeto JSON com a seguinte estrutura exata:
      {
        "analysis": "Breve análise do físico atual e viabilidade do objetivo",
        "diet": [
          "Dica de dieta 1",
          "Dica de dieta 2",
          "Dica de dieta 3"
        ],
        "workout": [
          "Dica de treino 1",
          "Dica de treino 2",
          "Dica de treino 3"
        ],
        "timeline": "Estimativa realista de tempo para atingir o objetivo (ex: '3 a 4 meses')"
      }
    `;

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Resposta vazia da IA.");
  } catch (error: any) {
    console.error("Error generating plan:", error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      throw new Error("Erro: A chave da API do Gemini não está configurada no Vercel. Por favor, adiciona a variável GEMINI_API_KEY e faz um novo Deploy.");
    }
    throw new Error("Desculpa, não foi possível gerar o plano neste momento.");
  }
};
export const searchHealthyPlaces = async (location: string) => {
  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Quais são os melhores restaurantes saudáveis ou ginásios perto de ${location}?`,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });
    return {
      text: response.text,
      places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error: any) {
    console.error("Error searching places:", error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return { text: "Erro: A chave da API do Gemini não está configurada no Vercel. Por favor, adiciona a variável GEMINI_API_KEY e faz um novo Deploy.", places: [] };
    }
    return { text: "Não foi possível procurar locais neste momento.", places: [] };
  }
};
