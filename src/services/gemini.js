import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const fetchQuestions = async (roundType) => {
  const prompt = `Generate exactly 5 multiple-choice questions for a ${roundType} interview. 
Focus on technical and logical skills. Return ONLY a valid JSON array of objects with no extra text or markdown formatting outside the array, where each object has: 
- "question" (string)
- "options" (array of 4 strings)
- "correctAnswer" (integer index 0-3)
- "explanation" (string)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const rawText = response.text;
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Error:", error.message);
    return [
      {
        question: "What is the primary purpose of a key in a React list element?",
        options: [
          "To style the elements", 
          "To help React identify which items have changed, been added, or been removed", 
          "To encrypt user session tokens", 
          "To sort the list alphabetically automatically"
        ],
        correctAnswer: 1,
        explanation: "Keys give elements a stable identity to optimize rendering performance."
      }
    ];
  }
};