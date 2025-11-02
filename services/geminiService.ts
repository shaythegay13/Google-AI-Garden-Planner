
import { GoogleGenAI, Type } from "@google/genai";
// FIX: Add EducationalResource to type imports.
import type { FormData, GardenPlan, DiseaseInfo, EducationalResource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

// FIX: Update prompt to not ask for educationalResources in JSON.
// This is because with `googleSearch` tool, resources should come from grounding chunks.
function buildPrompt(formData: FormData) {
  let prompt = `
    Analyze the following user data to create a comprehensive, agentic garden plan.

    **User's Location:**
    - Address: ${formData.location.address}
    - Coordinates: Lat ${formData.location.lat}, Lng ${formData.location.lng}

    **Garden Profile:**
    - Type(s): ${formData.gardenTypes.join(', ')}
    - Space: ${formData.space}
    - Environment: ${formData.environment}
    - Seasons: ${formData.seasons.join(', ')}
    - Time Commitment: ${formData.commitment}
    - Experience Level: ${formData.experience}

    **Gardening Goals:**
    - Desired Crops: ${formData.goals.crops.length > 0 ? formData.goals.crops.join(', ') : "Suggest crops for me"}
    - Preferences: ${formData.goals.preferences.join(', ')}
    - Additional Notes: ${formData.goals.notes || "None"}

    **Your Tasks:**
    1.  Use Google Search to find a diverse set of up-to-date educational resources to inform your recommendations. Aim to include a mix of high-quality articles, instructional videos (e.g., from YouTube), and relevant online courses. The search results will be provided to the user.
    2.  Your main response must be a single JSON object wrapped in \`\`\`json ... \`\`\`. Do NOT include any text before or after the JSON block.
    3.  The JSON object must have THREE top-level keys: "cropRecommendations", "gardenLayout", and "plantingSchedule".

    **JSON Structure Details:**
    - **"cropRecommendations"**: An array of 16-20 crop objects. The selection MUST be highly diverse and balanced across at least 4-5 different categories. A good target breakdown, depending on user suitability, would be: 5-7 Vegetables (from various sub-types like leafy greens, root, and fruiting vegetables), 2-3 Fruits, 2-3 Herbs, 2-3 Legumes (e.g., beans, peas), and 2-3 Grains (e.g., corn, amaranth, if viable). Ensure the 'type' field for each crop object accurately reflects its category (e.g., 'Vegetable', 'Fruit', 'Herb', 'Legume', 'Grain'). Each object must have the following keys: "cropName" (string), "type" (string), "growingSeason" (string), "timeToMaturity" (string), "expectedOutput" (string), "sunlightNeeds" (string), "waterNeeds" (string), "keyBenefits" (string).
    - **"gardenLayout"**: A string containing a detailed, actionable garden layout plan using companion planting. If a user photo was included, reference it. Format this string as Markdown text.
    - **"plantingSchedule"**: A string containing a clear planting schedule for all recommended crops. Format this string as a Markdown table.
  `;
  return prompt;
}


// FIX: Populate educationalResources from grounding chunks and ensure the returned object strictly conforms to the GardenPlan interface.
export const generateGardenPlan = async (formData: FormData): Promise<GardenPlan> => {
    const prompt = buildPrompt(formData);
    const contents = formData.photo ? [fileToGenerativePart(formData.photo.base64, formData.photo.mimeType), {text: prompt}] : [{text: prompt}];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: contents },
        config: {
            systemInstruction: "You are an expert horticulturalist and AI garden planner. Your goal is to create a detailed, actionable, and personalized garden plan based on the user's specific location, preferences, and constraints. Use Google Search to find up-to-date educational resources.",
            thinkingConfig: { thinkingBudget: 32768 },
            tools: [{ googleSearch: {} }],
        }
    });

    const responseText = response.text;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    
    let parsedJson: any;
    if (jsonMatch && jsonMatch[1]) {
        try {
            parsedJson = JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.error("Failed to parse extracted JSON:", jsonMatch[1], e);
            throw new Error("Failed to parse JSON from model response.");
        }
    } else {
        // Fallback for cases where the model might return raw JSON
        try {
            parsedJson = JSON.parse(responseText);
        } catch(e) {
            console.error("Raw model response:", responseText);
            throw new Error("Failed to parse JSON from model response. The response was not valid JSON.");
        }
    }

    if (typeof parsedJson !== 'object' || parsedJson === null) {
        console.error("Parsed model response is not an object:", parsedJson);
        throw new Error("Model response did not contain a valid garden plan object.");
    }

    // FIX: Safely access groundingChunks and ensure it's an array to prevent type errors.
    const groundingChunksSource = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingChunks = Array.isArray(groundingChunksSource) ? groundingChunksSource : [];
    const educationalResources: EducationalResource[] = groundingChunks
        .map((chunk: any) => {
            if (chunk.web?.uri) {
                let type: EducationalResource['type'] = 'Article';
                if (chunk.web.uri.includes('youtube.com') || chunk.web.uri.includes('vimeo.com')) {
                    type = 'Video';
                } else if (chunk.web.title?.toLowerCase().includes('course')) {
                    type = 'Course';
                }
                return {
                    title: chunk.web.title || 'Untitled Resource',
                    uri: chunk.web.uri,
                    type: type,
                };
            }
            return null;
        })
        .filter((resource: any): resource is EducationalResource => resource !== null);

    return {
        cropRecommendations: Array.isArray(parsedJson.cropRecommendations) ? parsedJson.cropRecommendations : [],
        gardenLayout: parsedJson.gardenLayout || '',
        plantingSchedule: parsedJson.plantingSchedule || '',
        educationalResources: educationalResources,
    };
};

export const identifyPlantDisease = async (photo: { base64: string, mimeType: string }): Promise<DiseaseInfo> => {
    const imagePart = fileToGenerativePart(photo.base64, photo.mimeType);
    const textPart = { text: "Identify the potential plant disease in this image. Describe it and suggest organic treatment options. Respond in JSON format with keys: 'disease', 'description', 'treatment'." };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    disease: { type: Type.STRING },
                    description: { type: Type.STRING },
                    treatment: { type: Type.STRING },
                }
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
