
import { GoogleGenAI, Type, Modality } from "@google/genai";

export const getGeminiClient = () => {
  // Use process.env.API_KEY directly as per SDK guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Fix: Moved history out of the config object because it belongs to ChatParameters, not GenerateContentConfig
export const chatWithPro = async (message: string, history: { role: string, parts: { text: string }[] }[] = []) => {
  const ai = getGeminiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      systemInstruction: "Eres Gumi (o Pipo, su mejor amigo robot), una criatura mágica, amigable y sabia. Responde con entusiasmo, usa emojis y sé muy cariñoso con los niños.",
    },
  });
  
  const result = await chat.sendMessage({ message });
  return result;
};

export const searchGrounding = async (query: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const text = response.text || "No encontré información específica.";
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any) => web) || [];
    
  return { text, sources };
};

export const generateImagePro = async (prompt: string, options: any) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: options.aspectRatio || "1:1",
        imageSize: options.imageSize || "1K"
      }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const editImageFlash = async (prompt: string, base64Image: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const analyzeContent = async (prompt: string, media: { data: string, mimeType: string }[]) => {
  const ai = getGeminiClient();
  const parts = media.map(m => ({
    inlineData: { data: m.data.split(',')[1], mimeType: m.mimeType }
  }));
  parts.push({ text: prompt } as any);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: parts as any }
  });

  return response.text;
};

export const deepThinking = async (query: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: query,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });
  return response.text;
};

export const textToSpeech = async (text: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Dilo con alegría: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
