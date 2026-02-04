
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

// A inicialização usa a chave de ambiente conforme as diretrizes
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * OCR: Processa imagem da nota fiscal e retorna JSON.
   */
  analyzeReceipt: async (base64Image: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Analise esta nota fiscal. Extraia: Nome da loja, Data (ISO), Valor Total, e uma lista de itens com {name, price, quantity, category}. Use categorias: Essenciais, Perecíveis, Hortifruti, Limpeza, Higiene Pessoal, Manutenção, Eletrodomésticos.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storeName: { type: Type.STRING },
            date: { type: Type.STRING },
            total: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  quantity: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                },
                required: ["name", "price", "quantity", "category"],
              },
            },
          },
          required: ["storeName", "total", "items"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  /**
   * Predição de Estoque baseada em histórico.
   */
  getPredictions: async (history: any[]) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este histórico: ${JSON.stringify(history)}. Identifique padrões de compra e preveja quais itens devem ser repostos hoje.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              status: { type: Type.STRING, description: "Acabou ou Acabando" },
              reason: { type: Type.STRING },
            },
            required: ["name", "status", "reason"],
          },
        },
      },
    });
    return JSON.parse(response.text || "[]");
  },

  /**
   * Pesquisa em tempo real de preços de eletrodomésticos.
   */
  compareAppliancePrice: async (productName: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Qual o preço atual e onde encontrar o produto: ${productName} em lojas online no Brasil (Amazon, Mercado Livre, Magalu)? Liste os 3 melhores preços.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    // Extração de URLs de grounding se disponíveis
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text,
      sources: sources
    };
  },

  /**
   * Gera relatório de rota de compra otimizada.
   */
  generateRouteReport: async (history: any[]) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base nas compras anteriores: ${JSON.stringify(history)}, sugira um roteiro de compras eficiente (quais categorias comprar em quais lojas) para economizar tempo e dinheiro.`,
    });
    return response.text;
  }
};
