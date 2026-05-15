import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined. AI features may be limited.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function getCAROARecommendation(studentData: any, availableModules: any[]) {
  const prompt = `Analyze the following student learning data and recommend the best next modules from the available list.
    Student Data: ${JSON.stringify(studentData)}
    Available Modules: ${JSON.stringify(availableModules)}
    
    Provide a personalized learning path with 'reasoning' for each recommendation.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                moduleId: { type: Type.STRING },
                title: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                priority: { type: Type.NUMBER, description: "1 to 5, 5 being highest" }
              },
              required: ["moduleId", "title", "reasoning", "priority"]
            }
          }
        },
        required: ["recommendations"]
      }
    }
  });

  return JSON.parse(response.text || '{"recommendations": []}');
}

export async function gradeSubjectiveAnswer(question: string, studentAnswer: string, modelAnswer: string) {
  const prompt = `Grade the following student answer based on the question and model answer.
    Question: ${question}
    Student Answer: ${studentAnswer}
    Model Answer: ${modelAnswer}
    
    Provide a score (0-100) and constructive feedback identifying strengths and weak points.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          masteryAdjustment: { type: Type.NUMBER, description: "Suggested adjustment to mastery level (-0.1 to 0.1)" }
        },
        required: ["score", "feedback", "masteryAdjustment"]
      }
    }
  });

  return JSON.parse(response.text || '{"score": 0, "feedback": "Error in grading", "masteryAdjustment": 0}');
}
