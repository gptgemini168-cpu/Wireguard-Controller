import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ImageSize } from '../types';

const getAiClient = () => {
  // Always create a new client to ensure the latest API key is used
  // The API key is injected into process.env.API_KEY by the environment wrapper
  // after the user selects it via window.aistudio.openSelectKey()
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateImage = async (prompt: string, size: ImageSize) => {
  const ai = getAiClient();
  
  // Use gemini-3-pro-image-preview for high quality generation
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: "1:1" // Defaulting to square, could be parameterized
      }
    }
  });

  const images: string[] = [];
  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      }
    }
  }
  return images;
};

export const editImage = async (base64Image: string, prompt: string) => {
  const ai = getAiClient();
  const mimeType = base64Image.split(';')[0].split(':')[1];
  const data = base64Image.split(',')[1];

  // Use gemini-2.5-flash-image for editing tasks as per instructions ("Nano banana powered app")
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: data
          }
        },
        { text: prompt }
      ]
    }
  });

  const images: string[] = [];
  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      }
    }
  }
  return images;
};

export const thinkingMode = async (prompt: string) => {
  const ai = getAiClient();
  
  // Use gemini-3-pro-preview with high thinking budget
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingBudget: 32768 // Max for gemini-3-pro
      }
      // NOT setting maxOutputTokens as per instructions
    }
  });

  return response.text;
};
