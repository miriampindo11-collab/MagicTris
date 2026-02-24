
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Siempre creamos una instancia nueva para asegurar que use la API_KEY actual del proceso
export const getGeminiClient = () => {
  // En AI Studio se usa process.env.GEMINI_API_KEY o process.env.API_KEY
  // En despliegues externos (Vercel/Netlify) se usa import.meta.env.VITE_GEMINI_API_KEY
  const apiKey = (typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : '') || (import.meta as any).env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("Gemini API Key no encontrada. Asegúrate de configurar VITE_GEMINI_API_KEY en tu despliegue.");
  }
  
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const chatWithPro = async (message: string, history: any[] = []) => {
  const ai = getGeminiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history,
    config: {
      systemInstruction: "Eres Gumi, una criatura mágica y sabia. Habla con muchos emojis, sé muy cariñoso y breve con los niños. Tu amigo Pipo el robot también está aquí.",
    },
  });
  return await chat.sendMessage({ message });
};

export const textToSpeech = async (text: string): Promise<string | undefined> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
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

export const generateImagePro = async (prompt: string, options: { aspectRatio: string; imageSize: string }) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: options.aspectRatio as any,
      },
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const editImageFlash = async (prompt: string, base64Image: string) => {
  const ai = getGeminiClient();
  const [header, data] = base64Image.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data, mimeType } },
        { text: prompt },
      ],
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
};
