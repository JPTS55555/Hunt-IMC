import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

// Initialize Gemini
// We use a getter so it picks up the env var correctly if it changes or is loaded late
export const getGemini = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
};

export const generateMicroHabits = async (goal: string, currentWeight: number, targetWeight: number) => {
  const ai = getGemini();
  const prompt = `
    O utilizador tem um peso atual de ${currentWeight}kg e um objetivo de ${targetWeight}kg.
    O seu objetivo principal é: ${goal}.
    Gera 3 micro-hábitos diários simples, realistas e saudáveis para ajudar o utilizador a atingir este objetivo.
    Retorna APENAS um array JSON de strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
  } catch (error) {
    console.error("Error generating habits:", error);
    return ["Beber 2L de água", "Caminhar 15 minutos", "Dormir 7-8 horas"]; // Fallback
  }
};

export const analyzeHealthImage = async (base64Image: string, mimeType: string) => {
  const ai = getGemini();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Desculpa, não consegui analisar a imagem neste momento.";
  }
};

export const getHealthAdviceWithThinking = async (question: string) => {
  const ai = getGemini();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: question,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error getting advice:", error);
    return "Desculpa, ocorreu um erro ao processar a tua pergunta.";
  }
};

export const searchHealthyPlaces = async (location: string) => {
  const ai = getGemini();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Quais são os melhores restaurantes saudáveis ou ginásios perto de ${location}?`,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });
    return {
      text: response.text,
      places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error searching places:", error);
    return { text: "Não foi possível procurar locais neste momento.", places: [] };
  }
};
