import { GoogleGenAI } from "@google/genai";
import { AICategoryResponse, QUESTION_TYPES } from "../types";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class AIService {
  static async generateContent(prompt: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const textResponse = response.text;
      if (!textResponse) {
        throw new Error("No response from AI");
      }

      try {
        return JSON.parse(textResponse);
      } catch {
        return textResponse;
      }
    } catch (error) {
      console.error('Error in AIService:', error);
      throw error;
    }
  }

  static async generateCategories(categoriesTitles = []) {
    const prompt = `
    Generate exactly 30 diverse and popular and engaging quiz categories for an educational quiz app.
    Each category should be a broad field of knowledge (e.g., "Information Technology", "Art History").
    Each object must have: "name", "description", "trending" (boolean), "color" (string like "bg-blue-50").
    Return them as a JSON array of strings in the below format:
   [{"name": "Information Technology","description": "Master the digital world - from coding and cybersecurity to cloud computing and AI systems that power modern society.","trending": true},...]
   Do NOT repeat any of the following categorie names: ${categoriesTitles.length ? categoriesTitles.join(", ") : "none"}.
   give categories other than the above ones
    Do NOT wrap the response in markdown code blocks.
    Do NOT add any explanation, prefix, or suffix.
    `;
    return await this.generateContent(prompt);
  }
  //   static async generateCategoriesWithCache(existingCategories: string[] = [], serverCache: [string, string][] = []): Promise<AICategoryResponse[]> {
  //     console.log("Generating categories with cache. Existing categories:", existingCategories, serverCache);
  //     const cacheText = serverCache.map(([id, name,]) =>
  //       `"${name}" → ${id}`
  //     ).join('\n');

  //     const prompt = `
  // Generate exactly 30 diverse and engaging quiz categories. the categories should be popular and should be engaging for users.

  // CRITICAL REQUIREMENTS:
  // 1. DO NOT generate any of these existing categories: ${existingCategories.join(', ') || 'None provided'}
  // 2. Check if any new category you generate is semantically similar to categories in our server cache below
  // 3. If a new category is essentially the same as a cached category, use the cachedId from our cache

  // SERVER CACHE (existing categories with their IDs):
  // ${cacheText || 'No cached categories yet'}

  // SEMANTIC MATCHING EXAMPLES:
  // - If cache has "React" with ID "cat_123", then "React JS" should use cachedId: "cat_123"
  // - If cache has "JavaScript" with ID "cat_456", then "Modern JS" should use cachedId: "cat_456"  
  // - If cache has "Web Development" with ID "cat_789", then "Frontend Development" should use cachedId: "cat_789"
  // - Only use cachedId when the core topic is essentially the same

  // RESPONSE FORMAT - STRICT JSON ARRAY:
  // [
  //   {
  //     "name": "Clear category name",
  //     "description": "Engaging 1-2 sentence description",
  //     "trending": true/false,
  //     "cachedId": "cat_123"  // ONLY include if matching cached category, otherwise OMIT this field
  //   }
  // ]

  // IMPORTANT:
  // - Return ONLY valid JSON, no other text
  // - Include exactly 30 categories
  // - Ensure categories are broad educational fields (Technology, Science, Business, Arts, etc.)
  // - Make descriptions engaging and educational
  // - Do NOT wrap the response in markdown code blocks.
  // `;

  //     return await this.generateContent(prompt);
  //   }
  static async generateCategoriesWithCache(existingCategories: string[] = [], serverCache: [string, string][] = []): Promise<AICategoryResponse[]> {
    console.log("Generating categories with cache. Existing categories:", existingCategories, serverCache);
    const cacheText = serverCache.map(([id, name]) =>
      `"${name}" → ${id}`
    ).join('\n');

    const prompt = `
Generate exactly 30 popular, engaging, and well-known quiz categories that users would actually want to explore. These should be famous topics that appeal to broad audiences.

CRITICAL REQUIREMENTS:
1. DO NOT generate any of these existing categories: ${existingCategories.join(', ') || 'None provided'}
2. Check if any new category matches cached categories for ID reuse
3. Categories must be FAMOUS, POPULAR topics - not obscure or niche
4. Cover diverse domains that real people care about

DOMAIN DISTRIBUTION REQUIREMENT:
- 40% Technology & Science (AI, Programming, Space, etc.)
- 20% Entertainment & Pop Culture (Movies, Music, Sports, Games)
- 15% Business & Finance (Startups, Marketing, Investing)
- 15% Lifestyle & General Knowledge (Food, Travel, Health)
- 10% History & Geography (World History, Countries, Landmarks)

SERVER CACHE (existing categories with their IDs):
${cacheText || 'No cached categories yet'}

SEMANTIC MATCHING RULES:
- If cache has "React" with ID "cat_123", then "React JS" should use cachedId: "cat_123"
- If cache has "JavaScript" with ID "cat_456", then "Modern JS" should use cachedId: "cat_456"
- Only use cachedId when the core topic is essentially the same

RESPONSE FORMAT - STRICT JSON ARRAY:
[
  {
    "name": "Famous and engaging category name",
    "description": "Exciting 1-2 sentence description that makes people want to take the quiz",
    "trending": true/false, // Mark as trending if currently popular
    "cachedId": "cat_123"  // ONLY if matching cached category
  }
]

IMPORTANT:
- Return ONLY valid JSON, no other text
- Include exactly 30 categories
- Make descriptions exciting and inviting
- Focus on topics people actually search for and discuss
- Ensure good mix of technical and non-technical topics
- Do NOT wrap the response in markdown code blocks
`;

    return await this.generateContent(prompt);
  }

  static async generateCategoriesBySearch(search: string, existingCategories: string[] = [], serverCache: [string, string][] = []): Promise<AICategoryResponse[]> {
    console.log("Generating search categories with cache. Search:", search, "Existing:", existingCategories, "Cache:", serverCache.length);

    const cacheText = serverCache.map(([id, name]) =>
      `"${name}" → ${id}`
    ).join('\n');

    const prompt = `
Generate exactly 30 diverse and engaging quiz categories related to or starting with "${search}".

CRITICAL REQUIREMENTS:
1. Categories must be related to "${search}" - either starting with "${search}" or semantically related
2. DO NOT generate any of these existing categories: ${existingCategories.join(', ') || 'None provided'}
3. Check if any new category you generate is semantically similar to categories in our server cache below
4. If a new category is essentially the same as a cached category, use the cachedId from our cache
5.  If "${search}" appears to be random characters or nonsense like 'xdfgcbhjgvb'(anything meaningless), return EMPTY ARRAY []

SERVER CACHE (existing categories with their IDs):
${cacheText || 'No cached categories yet'}

SEMANTIC MATCHING RULES:
- If cache has "React" with ID "cat_123", then "React JS" should use cachedId: "cat_123"
- If cache has "JavaScript" with ID "cat_456", then "Modern JS" should use cachedId: "cat_456"  
- If cache has "Web Development" with ID "cat_789", then "Frontend Development" should use cachedId: "cat_789"
- If cache has "Artificial Intelligence" with ID "cat_111", then "AI Basics" should use cachedId: "cat_111"
- Only use cachedId when the core topic is essentially the same
- For search "${search}", if cache has related categories, prefer using cached IDs

SEARCH-SPECIFIC GUIDELINES:
- Include categories that start with "${search}" (e.g., "${search} Fundamentals", "${search} History")
- Include categories that are closely related to "${search}" 
- Ensure categories are educational and suitable for quizzes
- Avoid overly narrow or specific topics unless highly relevant to "${search}"

RESPONSE FORMAT - STRICT JSON ARRAY:
[
  {
    "name": "Clear category name related to ${search}",
    "description": "Engaging 1-2 sentence description explaining the category",
    "trending": true/false,
    "cachedId": "cat_123"  // ONLY include if matching cached category, otherwise OMIT this field
  }
]

IMPORTANT:
- Return ONLY valid JSON, no other text
- Include exactly 30 categories
- Ensure all categories are related to "${search}" in some way
- Make descriptions engaging and educational
- Do NOT wrap the response in markdown code blocks
- Prioritize using cached IDs when semantically appropriate
`;

    return await this.generateContent(prompt);
  }

static async generateSubcategories(category: string, existingSubcategories: string[] = []) {
    const prompt = `
    Generate exactly 10 diverse and relevant subcategories for the main quiz category: "${category}".
    
    Each subcategory should be a specific, well-defined topic within "${category}"
    (e.g., if parent is "Information Technology", valid subcategories include "React.js", "Node.js", "Cybersecurity", "Cloud Architecture").

    CRITICAL DISTRIBUTION RULES:
    - "trending": Set to TRUE for only 2-3 subcategories that are currently most popular/high-demand in 2024
    - "new": Set to TRUE for only 1-2 subcategories that are recently emerging topics
    - A subcategory can be BOTH trending AND new, but this should be rare (max 1 item)
    - Ensure variety: not all items should be trending or new

    Each object must have:
      - "name": short, clear title (e.g., "Machine Learning")
      - "description": 1-sentence engaging explanation of what the subcategory covers
      - "trending": boolean (follow the distribution rules above)
      - "new": boolean (follow the distribution rules above) 
      - "usersTaken": number between 1-100 (distribute realistically: trending items should have higher numbers 60-100, new items 10-40, regular items 20-80)

    Return them as a JSON array of objects in this exact format:
    [{"name":"...","description":"...","trending":true,"new":false,"usersTaken":50}, ...]

    Do NOT include any of the following subcategory names (avoid duplicates):
    ${existingSubcategories.length ? existingSubcategories.join(", ") : "none"}

    Do NOT wrap the response in markdown code blocks (no \`\`\`json).
    Do NOT add any introduction, explanation, prefix, or suffix.
    Return ONLY valid JSON.
    `;
    return await this.generateContent(prompt);
}

  static async generateSubcategoriesBySearch(categoryTitle: string, search: string, existingSubcategories: string[] = []) {
    const prompt = `
    Generate exactly 10 diverse and relevant subcategories for the main quiz category: "${categoryTitle}".
    subcategory names should only start with ${search} or should be subcategories related with ${search}
   
    Each subcategory should be a specific, well-defined topic within "${categoryTitle}"
    (e.g., if parent is "Information Technology", valid subcategories include "React.js", "Node.js", "Cybersecurity", "Cloud Architecture").
   
    Each object must have:
      - "name": short, clear title (e.g., "Machine Learning")
      - "description": 1-sentence engaging explanation of what the subcategory covers
      - "trending": boolean (true if currently popular or high-demand)
      - "new" : boolean (true if the topic is recently introduced)
      - "usersTaken" : number<100 (give a random value for this)
      - "color": a Tailwind-compatible background color class like "bg-blue-50", "bg-green-50", etc. (use varied soft colors)
   
    Return them as a JSON array of objects in this exact format:
    [{"name":"...","description":"...","trending":true,"new":true,"usersTaken":50,"color":"..."}, ...]
   
    Do NOT include any of the following subcategory names (avoid duplicates):
    ${existingSubcategories.length ? existingSubcategories.join(", ") : "none"}
   
    Do NOT wrap the response in markdown code blocks (no \`\`\`json).
    Do NOT add any introduction, explanation, prefix, or suffix.
    Return ONLY valid JSON.
    `;
    return await this.generateContent(prompt);
  }

  static async generateQuestion(categoryTitle: string, subcategoryTitle: string, difficultyLevel: number = 3, questionType: "multiple_choice" | "descriptive" = "multiple_choice") {
    const prompt = questionType === "multiple_choice" ? `
    Generate a CRYSTAL CLEAR multiple choice quiz question where ONE option is DEFINITELY correct and others are clearly wrong.
    
    CATEGORY: ${categoryTitle}
    SUBCATEGORY: ${subcategoryTitle}
    DIFFICULTY: ${difficultyLevel}/5
    
    REQUIREMENTS:
    - Create 1 unambiguous question with exactly 4 options
    - ONE option must be 100% factually correct based on established knowledge
    - Other 3 options must be clearly incorrect with no ambiguity
    - Avoid "trick" questions or debatable answers
    - Question should test clear factual knowledge, not interpretation
    - Make it appropriate for difficulty level ${difficultyLevel}
    
    Return ONLY valid JSON:
    {
      "questionText": "clear direct question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "questionType": "${questionType}",
      "difficultyLevel": ${difficultyLevel}
    }
    Do NOT wrap the response in markdown code blocks (no \`\`\`json).
    Return ONLY valid JSON.
    ` : `
    Generate a SPECIFIC descriptive question that can be answered in 1-2 lines and has a clear, evaluatable correct answer.
    
    CATEGORY: ${categoryTitle}
    SUBCATEGORY: ${subcategoryTitle}
    DIFFICULTY: ${difficultyLevel}/5
    
    REQUIREMENTS:
    - Question should be answerable in 1-2 sentences maximum
    - Must have ONE clear correct answer based on facts, not opinions
    - Should test specific knowledge that can be objectively evaluated
    - Avoid open-ended or general discussion questions
    - Focus on definitions, processes, or specific concepts
    - Make it appropriate for difficulty level ${difficultyLevel}
    
    Return ONLY valid JSON:
    {
      "questionText": "specific factual question",
      "options": [],
      "questionType": "${questionType}",
      "difficultyLevel": ${difficultyLevel}
    }
    Do NOT wrap the response in markdown code blocks (no \`\`\`json).
    Return ONLY valid JSON.
    `;

    const response = await this.generateContent(prompt);
    response.questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return response;
  }

  static async evaluateAnswer({ questionData, userAnswer, category, subcategory }: { questionData: { text: string, options: string[], type: string, difficulty: number }, userAnswer: string, category: string, subcategory: string }) {
    const prompt = `
    Evaluate the answer and provide a SHORT explanation:
    
    QUESTION: ${questionData.text}
    ${questionData.options.length > 0 ? `OPTIONS: ${questionData.options.join(', ')}` : ''}
    USER'S ANSWER: ${userAnswer}
    QUESTION TYPE: ${questionData.type}
    
    CATEGORY: ${category}
    SUBCATEGORY: ${subcategory}
    
    EVALUATION RULES:
    ${questionData.type == QUESTION_TYPES.MULTIPLE_CHOICE
        ? "- Check if answer exactly matches the correct option\n- Score: 10 if correct, 0 if wrong"
        : "- Evaluate completeness and accuracy (0-10)\n- Score based on key points covered"
      }
    CORRECT ANSWER REQUIREMENTS:
    - For multiple choice: provide the exact correct option text
    - For descriptive: provide a SHORT ideal answer (1-2 lines maximum, 10-20 words)
    - Keep descriptive answers concise and focused on key points only
    - Avoid lengthy explanations in the correct answer field

    EXPLANATION REQUIREMENTS:
    - Keep it VERY SHORT (1 sentence maximum)
    - Focus on the KEY LEARNING POINT only
    - Explain the correct concept directly to the user
    - Do NOT mention "user gave" or "user answered"
    - Do NOT repeat the question or options
    - Just state the core concept clearly
    
    RESPONSE FORMAT (JSON only):
    {
      "wasCorrect": boolean,
      "correctAnswer": "string",
      "score": number,
      "explanation": "one short sentence with key learning point"
    }
    Do NOT wrap the response in markdown code blocks (no \`\`\`json).
    Return ONLY valid JSON.
    `;
    return await this.generateContent(prompt);
  }

  static async generateQuizEvaluation(totalScore: number, maxPossibleScore: number, quizRecords: any[]) {
    const correctAnswers = quizRecords.filter(record => record.score > 5).length;
    const incorrectAnswers = quizRecords.length - correctAnswers;

    const prompt = `
    Generate a brief evaluation and feedback for a quiz performance:
    
    TOTAL SCORE: ${totalScore}/${maxPossibleScore}
    TOTAL QUESTIONS: ${quizRecords.length}
    PERFORMANCE BREAKDOWN:
    - Questions with good scores: ${correctAnswers}
    - Questions needing improvement: ${incorrectAnswers}
    - Overall performance: ${totalScore}/${maxPossibleScore}
    
    Generate a constructive evaluation that:
    1. Acknowledges their performance level based on the ${totalScore}/${maxPossibleScore} score
    2. Provides specific feedback based on their score pattern
    3. Suggests areas for improvement or next steps
    4. Is encouraging and motivational
    5. Keep it brief (2-3 sentences)
    
    Examples:
    - For high scores >=80%: "Excellent performance! You have strong grasp of the concepts. Consider exploring advanced topics to further enhance your skills."
    - For medium scores >=50% and <80%: "Good effort! You understand the basics well. Focus on practicing more complex scenarios to improve your accuracy."
    - For low scores <50%: "You've made a good start! Review the fundamental concepts and try again. Consistent practice will help you improve significantly."
    
    Return only the evaluation text as a string, no JSON.
    `;

    try {
      return await this.generateContent(prompt);
    } catch (error) {
      console.error('Error generating quiz evaluation:', error);

      if (totalScore / maxPossibleScore >= 0.8) {
        return "Great job! You demonstrated excellent understanding of the material.";
      } else if (totalScore / maxPossibleScore >= 0.5) {
        return "Good work! You have a solid foundation. Keep practicing to improve further.";
      } else {
        return "You're on the right track! Review the concepts and try again to improve your score.";
      }
    }
  }
}