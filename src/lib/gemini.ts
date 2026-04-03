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

export const getHealthAdviceWithThinking = async (question: string) => {
  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: question
    });
    return response.text;
  } catch (error: any) {
    console.error("Error getting advice:", error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return "Erro: A chave da API do Gemini não está configurada no Vercel. Por favor, adiciona a variável GEMINI_API_KEY e faz um novo Deploy.";
    }
    return "Desculpa, ocorreu um erro ao processar a tua pergunta.";
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
