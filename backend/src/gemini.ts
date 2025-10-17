import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
// The client gets the API key from the environment variable `GEMINI_API_KEY`.
console.log(process.env.GEMINI_API_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
    Generate exactly 10 diverse and popular quiz categories for an educational quiz app.
    Each category should be a broad field of knowledge (e.g., "Information Technology", "Art History").
    Return them as a JSON array of strings, nothing else.
    Example: [{name: "Information Technology",description: "Master the digital world - from coding and cybersecurity to cloud computing and AI systems that power modern society.",trending: true},...]
    Do NOT wrap the response in markdown code blocks.
    Do NOT add any explanation, prefix, or suffix.
    Catogories should start with painter or should be catogories related with painter
  `,
  });
  console.log(response.text);
}

main();