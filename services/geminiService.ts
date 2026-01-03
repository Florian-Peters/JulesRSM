
import { GoogleGenAI, Type } from "@google/genai";

export const geminiService = {
  async generateDailyPrompt(topic: string = 'general') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a fun, viral social media challenge prompt for an app called Real social meet. 
                The theme is "${topic}". Make it engaging for Gen Z.
                Format the response as JSON with fields "title", "description", and "reward" (a number).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            reward: { type: Type.NUMBER },
          },
          required: ["title", "description", "reward"],
          propertyOrdering: ["title", "description", "reward"]
        }
      }
    });
    
    return JSON.parse(response.text.trim());
  },

  async remixCaption(caption: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Take this social media caption and remix it to be more viral, fun, and Gen Z friendly with emojis: "${caption}"`,
    });
    
    return response.text?.trim() || caption;
  },

  async generateSmartReply(lastMessage: string, context: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a cool Gen Z user on the "Real social meet" social app. 
                User ${context} said: "${lastMessage}". 
                Generate a short, witty, and engaging reply with 1-2 emojis. Keep it under 15 words.`,
    });
    
    return response.text?.trim() || "";
  },

  async generateImage(prompt: string, referenceImageBase64?: string): Promise<{ base64: string; mimeType: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [];
    
    if (referenceImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: referenceImageBase64
        }
      });
      parts.push({ text: `Modify this image based on the following instruction: ${prompt}. Maintain the main subject but apply the requested style. High quality, viral aesthetic.` });
    } else {
      parts.push({ text: `Create a high-quality, viral social media style image: ${prompt}. Cinematic lighting, trendy aesthetic.` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        };
      }
    }
    throw new Error("No image data returned from model");
  }
};
