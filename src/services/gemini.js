const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

export const fetchQuestions = async (roundType) => {
  const prompt = `Generate 5 multiple-choice questions for a ${roundType} interview. 
  Focus on technical and logical skills. Return the response as a valid JSON array 
  of objects with: question, options (array of 4), correctAnswer (index 0-3), and explanation.`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await response.json();
    // Use regex to clean the AI response in case it includes markdown code blocks
    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Error:", error.message);
    // Return a fallback so the app doesn't crash if the API is busy
    return [
      {
        question: "What is the result of 5 + 5?",
        options: ["8", "10", "12", "15"],
        correctAnswer: 1,
        explanation: "Simple addition."
      }
    ];
  }
};