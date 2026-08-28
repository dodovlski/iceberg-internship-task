import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.5-flash-lite";

export function hasGeminiApiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiJson<T>(prompt: string): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("Gemini generation failed. Falling back to deterministic demo output.", error);
    return null;
  }
}

export async function generateGeminiJsonWithPdf<T>(prompt: string, pdf: Buffer): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: pdf.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      { text: prompt },
    ]);
    const text = result.response.text();

    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("Gemini PDF analysis failed. Falling back to built-in legal checks.", error);
    return null;
  }
}
