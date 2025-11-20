
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMenuDescription = async (name: string, ingredients: string[]): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Actúa como un experto en marketing gastronómico. Escribe una descripción corta (máximo 250 caracteres), apetitosa y vendedora para un plato de menú llamado "${name}".
      Ingredientes principales: ${ingredients.join(', ')}.
      El tono debe ser atractivo para los clientes. Devuelve solo el texto de la descripción, sin comillas ni preámbulos. Idioma: Español.`,
    });
    return response.text ? response.text.trim() : null;
  } catch (error) {
    console.error("Error generating description:", error);
    return null;
  }
};

export const analyzeReport = async (reportData: any): Promise<string | null> => {
    try {
        // Simplify data to reduce token usage and focus on key metrics
        const summaryData = {
            totalRevenue: reportData.totalRevenue,
            totalOrders: reportData.totalOrders,
            avgOrderValue: reportData.avgOrderValue,
            topProducts: reportData.topProfitableProducts.map((p: any) => p.name),
            salesByCategory: reportData.salesByCategory,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: `Actúa como un consultor de negocios para restaurantes. Analiza el siguiente resumen de reporte de ventas (JSON) y proporciona un breve análisis estratégico.
            
            Datos: ${JSON.stringify(summaryData)}
            
            Por favor, proporciona:
            1. 🟢 2 Puntos Fuertes detectados.
            2. 🔴 2 Áreas de Oportunidad o mejora.
            3. 💡 2 Recomendaciones rápidas para aumentar ventas.
            
            Formato: Texto plano con emojis, conciso. No uses Markdown complejo. Idioma: Español.`,
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing report:", error);
        return null;
    }
}

export const suggestCoupon = async (): Promise<{ codigo: string, tipo: 'PORCENTAJE' | 'FIJO', valor: number, descripcion: string } | null> => {
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Genera una idea creativa para un cupón de descuento de restaurante para atraer clientes.
            Devuelve SOLO un objeto JSON válido con este formato:
            {
                "codigo": "CODE",
                "tipo": "PORCENTAJE" (o "FIJO"),
                "valor": number,
                "descripcion": "string"
            }
            Ejemplo: {"codigo": "VERANO20", "tipo": "PORCENTAJE", "valor": 20, "descripcion": "20% off para celebrar el calor"}`,
            config: { responseMimeType: "application/json" }
        });
        
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating coupon:", error);
        return null;
    }
}
