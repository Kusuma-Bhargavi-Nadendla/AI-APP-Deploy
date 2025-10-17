// import express from "express";
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import cors from "cors";
// import { GoogleGenAI } from "@google/genai";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());
// console.log("MongoDB URI:", process.env.MONGO_DB_URI);
// mongoose
//   .connect(process.env.MONGO_DB_URI!)
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => {
//     console.error("DB Connection Error:", err.message);
//     process.exit(1);
//   });

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// const User = mongoose.model("User", userSchema);

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// const generateToken = (user: { id: string; name: string }) => {
//   return jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET!, {
//     expiresIn: "7d",
//   });
// };

// app.post("/register", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     const token = generateToken({ id: user._id.toString(), name: name });

//     res.status(201).json({
//       message: "User registered successfully",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// app.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = generateToken({ id: user._id.toString(), name: user.name });

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// app.post("/categories", async (req, res) => {
//   const { categoriesTitles } = req.body;
//   console.log(categoriesTitles);
//   const newCatogories = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: `
//     Generate exactly 30 diverse and popular quiz categories for an educational quiz app.
//     Each category should be a broad field of knowledge (e.g., "Information Technology", "Art History").
//     Each object must have: "name", "description", "trending" (boolean), "color" (string like "bg-blue-50").
//     Return them as a JSON array of strings in the below format:
//    [{"name": "Information Technology","description": "Master the digital world - from coding and cybersecurity to cloud computing and AI systems that power modern society.","trending": true},...]
//    Do NOT repeat any of the following categorie names: ${
//      categoriesTitles.length ? categoriesTitles.join(", ") : "none"
//    }.
//    give categories other than the above ones
//     Do NOT wrap the response in markdown code blocks.
//     Do NOT add any explanation, prefix, or suffix.
//   `,
//   });
//   const JsonResponse = newCatogories.text;
//   let response = [];
//   if (JsonResponse) {
//     response = JSON.parse(JsonResponse);
//     console.log(1, typeof response);
//   }
//   console.log(response);
//   res.json({ response });
// });

// app.post("/categoriesBySearch", async (req, res) => {
//   const { search } = req.body();
//   const catogories = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: `
//     Generate exactly 10 diverse and popular quiz categories for an educational quiz app.
//     Each category should be a broad field of knowledge (e.g., "Information Technology", "Art History").
//     Return them as a JSON array of strings, nothing else.
//     Example: ["Information Technology", "World Geography", "Classical Music"]
//     Do NOT wrap the response in markdown code blocks.
//     Do NOT add any explanation, prefix, or suffix.
//     Categories should start with ${search} or should be catogories related with ${search}
//   `,
//   });
//   const JsonResponse = catogories.text;
//   let response = [];
//   if (JsonResponse) {
//     response = JSON.parse(JsonResponse);
//     console.log(1, typeof response);
//   }
//   // console.log(response);
//   res.json({ response });
// });

// app.post("/subcategory", async (req, res) => {
//   const { category,existingSubcategories } = req.body;
//   const newSubCategories = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: `
//   Generate exactly 10 diverse and relevant subcategories for the main quiz category: "${category}".

//   Each subcategory should be a specific, well-defined topic within "${category}" 
//   (e.g., if parent is "Information Technology", valid subcategories include "React.js", "Node.js", "Cybersecurity", "Cloud Architecture").

//   Each object must have:
//     - "name": short, clear title (e.g., "Machine Learning")
//     - "description": 1-sentence engaging explanation of what the subcategory covers
//     - "trending": boolean (true if currently popular or high-demand)
//     - "new" : boolean (true if the topic is recently introduced)
//     - "color": a Tailwind-compatible background color class like "bg-blue-50", "bg-green-50", etc. (use varied soft colors)

//   Return them as a JSON array of objects in this exact format:
//   [{"name":"...","description":"...","trending":true,,"new":true,"color":"..."}, ...]

//   Do NOT include any of the following subcategory names (avoid duplicates):
//   ${existingSubcategories.length ? existingSubcategories.join(", ") : "none"}

//   Do NOT wrap the response in markdown code blocks (no \`\`\`json).
//   Do NOT add any introduction, explanation, prefix, or suffix.
//   Return ONLY valid JSON.
// `,
//   });
//   const JsonResponse = newSubCategories.text;
//   let response = [];
//   if (JsonResponse) {
//     response = JSON.parse(JsonResponse);
//     console.log(1, typeof response);
//   }
//   console.log(response);
//   res.json({ response });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });







import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
console.log("MongoDB URI:", process.env.MONGO_DB_URI);
mongoose
  .connect(process.env.MONGO_DB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("DB Connection Error:", err.message);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryTitle: {
    type: String,
    required: true
  },
  subcategoryTitle: {
    type: String,
    required: true
  },
  questionsCount: {
    type: Number,
    default: 5
  },
  finalScore: {
    type: Number
  },
  status: {
    type: String,
    enum: ['completed', 'in_progress'],
    default: 'in_progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

const Quiz = mongoose.model('Quiz', quizSchema);

const quizRecordSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  userAnswer: {
    type: String
  },
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
  },
  score: {
    type: Number,
    default: 0
  },
  difficultyLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'descriptive'],
    default: 'multiple_choice'
  }
});

const QuizRecord = mongoose.model('QuizRecord', quizRecordSchema);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateToken = (user: { id: string; name: string }) => {
  return jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
};

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken({ id: user._id.toString(), name: name });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get('/validate-auth-token', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET ||"";
    const decoded = jwt.verify(token, secret);
    res.json({ 
      valid: true, 
      user: decoded,
      message: 'Token is valid' 
    });
  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      message: 'Invalid or expired token' 
    });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({ id: user._id.toString(), name: user.name });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/categories", async (req, res) => {
  const { categoriesTitles } = req.body;
  console.log(categoriesTitles);
  const newCatogories = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
    Generate exactly 30 diverse and popular quiz categories for an educational quiz app.
    Each category should be a broad field of knowledge (e.g., "Information Technology", "Art History").
    Each object must have: "name", "description", "trending" (boolean), "color" (string like "bg-blue-50").
    Return them as a JSON array of strings in the below format:
   [{"name": "Information Technology","description": "Master the digital world - from coding and cybersecurity to cloud computing and AI systems that power modern society.","trending": true},...]
   Do NOT repeat any of the following categorie names: ${categoriesTitles.length ? categoriesTitles.join(", ") : "none"
      }.
   give categories other than the above ones
    Do NOT wrap the response in markdown code blocks.
    Do NOT add any explanation, prefix, or suffix.
  `,
  });
  const JsonResponse = newCatogories.text;
  let response = [];
  if (JsonResponse) {
    response = JSON.parse(JsonResponse);
    console.log(1, typeof response);
  }
  console.log(response);
  res.json({ response });
});

app.post("/categoriesBySearch", async (req, res) => {
  // const { search, categoriesTitles } = req.body;
  const { search, categoriesTitles = [] } = req.body;
  const catogories = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
    Generate exactly 30 diverse and popular quiz categories for an educational quiz app.
    Each category should be a broad field of knowledge (e.g., "Information Technology", "Art History").
    Each object must have: "name", "description", "trending" (boolean), "color" (string like "bg-blue-50").
    Return them as a JSON array of strings in the below format:
   [{"name": "Information Technology","description": "Master the digital world - from coding and cybersecurity to cloud computing and AI systems that power modern society.","trending": true},...]
   Do NOT repeat any of the following categorie names: ${categoriesTitles.length ? categoriesTitles.join(", ") : "none"
      }.
   give categories other than the above ones
    Do NOT wrap the response in markdown code blocks.
    Do NOT add any explanation, prefix, or suffix.
    Category names should start with ${search} or should be categories related with ${search}
  `,
  });
  const JsonResponse = catogories.text;
  let response = [];
  if (JsonResponse) {
    response = JSON.parse(JsonResponse);
    console.log(1, typeof response);
  }
  // console.log(response);
  res.json({ response });
});

app.post("/subcategories", async (req, res) => {
  const { category, existingSubcategories } = req.body;
  const newSubCategories = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
  Generate exactly 10 diverse and relevant subcategories for the main quiz category: "${category}".
 
  Each subcategory should be a specific, well-defined topic within "${category}"
  (e.g., if parent is "Information Technology", valid subcategories include "React.js", "Node.js", "Cybersecurity", "Cloud Architecture").
 
  Each object must have:
    - "name": short, clear title (e.g., "Machine Learning")
    - "description": 1-sentence engaging explanation of what the subcategory covers
    - "trending": boolean (true if currently popular or high-demand)
    - "new" : boolean (true if the topic is recently introduced)
    - "usersTaken" : number<100 (give a random value for this)
    - "color": a Tailwind-compatible background color class like "bg-blue-50", "bg-green-50", etc. (use varied soft colors)
 
  Return them as a JSON array of objects in this exact format:
  [{"name":"...","description":"...","trending":true,,"new":true,"color":"..."}, ...]
 
  Do NOT include any of the following subcategory names (avoid duplicates):
  ${existingSubcategories.length ? existingSubcategories.join(", ") : "none"}
 
  Do NOT wrap the response in markdown code blocks (no \`\`\`json).
  Do NOT add any introduction, explanation, prefix, or suffix.
  Return ONLY valid JSON.
`,
  });
  const JsonResponse = newSubCategories.text;
  let response = [];
  if (JsonResponse) {
    response = JSON.parse(JsonResponse);
    console.log(1, typeof response);
  }
  console.log(response);
  res.json({ response });
});

app.post("/subcategories/search", async (req, res) => {
  const { categoryTitle, query:search, existingSubcategories = [] } = req.body;
  console.log(111,search);
  const newSubCategories = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
  Generate exactly 10 diverse and relevant subcategories for the main quiz category: "${categoryTitle}".
  subcategory names should only start with ${search} or should be subcatogories related with ${search}
 
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
  [{"name":"...","description":"...","trending":true,,"new":true,"color":"..."}, ...]
 
  Do NOT include any of the following subcategory names (avoid duplicates):
  ${existingSubcategories.length ? existingSubcategories.join(", ") : "none"}
 
 
 
  Do NOT wrap the response in markdown code blocks (no \`\`\`json).
  Do NOT add any introduction, explanation, prefix, or suffix.
  Return ONLY valid JSON.
`,
  });
  const JsonResponse = newSubCategories.text;
  let response = [];
  if (JsonResponse) {
    response = JSON.parse(JsonResponse);
    console.log(1, typeof response);
  }
  console.log(response);
  res.json({ response });
});

const getAIResponse = async (prompt: string) => {
  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    const JsonResponse = aiResponse.text;

    if (!JsonResponse) {
      throw new Error("No response from AI");
    }

    try {
      return JSON.parse(JsonResponse);
    } catch {
      return JsonResponse;
    }
  } catch (error) {
    console.error('Error in getAIResponse:', error);
    throw error;
  }
}
const generateAIQuestion = async (categoryTitle: string, subcategoryTitle: string, difficultyLevel: number = 3, questionType: string = "multiple_choice") => {

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
  try {
    const response = await getAIResponse(prompt);
    response.questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated AI Question:', response);
    return response;
  } catch (error) {
    console.error('Error generating AI question:', error);
    return error;
    // return {
    //   questionId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    //   questionText: questionType === "multi_choice" 
    //     ? `What is a key concept in ${subcategoryTitle}?`
    //     : `Explain the main idea of ${subcategoryTitle} in ${categoryTitle}.`,
    //   options: questionType === "multi_choice" 
    //     ? ["Basic principle", "Advanced technique", "Core concept", "Fundamental method"]
    //     : [],
    //   questionType: questionType,
    //   difficultyLevel: difficultyLevel
    // };
  }
};

app.post('/quiz/start', async (req, res) => {
  try {
    console.log(' START QUIZ REQUEST BODY:', req.body);
    const { userId, categoryTitle, subcategoryTitle, questionsCount = 10 } = req.body;

    const newQuiz = new Quiz({
      userId,
      categoryTitle,
      subcategoryTitle,
      questionsCount,
      status: 'in_progress',
      startedAt: new Date()
    });
    await newQuiz.save();

    const firstQuestion = await generateAIQuestion(categoryTitle, subcategoryTitle);

    res.json({
      quizId: newQuiz._id,
      question: firstQuestion
    });

  } catch (error: any) {
    console.log("got error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const evaluateQuestion = async ({ currentQuestion, userAnswer, category, subcategory }:
  { currentQuestion: { text: string, options: string[], type: string, difficulty: number }, userAnswer: string, category: string, subcategory: string }) => {
  
  const prompt = `
  Evaluate the answer and provide a SHORT explanation:
  
  QUESTION: ${currentQuestion.text}
  ${currentQuestion.options.length > 0 ? `OPTIONS: ${currentQuestion.options.join(', ')}` : ''}
  USER'S ANSWER: ${userAnswer}
  QUESTION TYPE: ${currentQuestion.type}
  
  CATEGORY: ${category}
  SUBCATEGORY: ${subcategory}
  
  EVALUATION RULES:
  ${currentQuestion.type === "multiple_choice"
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
  try {
    const response = await getAIResponse(prompt);
    return response;
  } catch (error) {
    console.error('Error in evaluateQuestion:', error);

    // const isMultipleChoice = currentQuestion.type === "multiple_choice";
    // const wasCorrect = isMultipleChoice ? false : Math.random() > 0.5;
    // const score = isMultipleChoice ? 0 : Math.floor(Math.random() * 11);

    // return {
    //   wasCorrect: wasCorrect,
    //   correctAnswer: isMultipleChoice 
    //     ? (currentQuestion.options[0] || "Correct answer") 
    //     : "The ideal answer should cover key concepts and main points.",
    //   score: score,
    //   explanation: "Unable to evaluate at this time."
    // };
  }
};


const calculateFinalScore = async (quizId: string) => {
  try {
    const quizRecords = await QuizRecord.find({ quizId: quizId });

    if (quizRecords.length === 0) {
      return { finalScore: 0, evaluation: "No questions were answered." };
    }

    const totalScore = quizRecords.reduce((sum, record) => sum + record.score, 0);
    const maxPossibleScore = quizRecords.length * 10;
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
    let evaluation;
    try {
      evaluation = await getAIResponse(prompt);
    } catch (error) {
      console.error('Error generating quiz evaluation:', error);

      if (totalScore / maxPossibleScore >= 0.8) {
        evaluation = "Great job! You demonstrated excellent understanding of the material."
      }
      else if (totalScore / maxPossibleScore >= 0.5) {
        evaluation = "Good work! You have a solid foundation. Keep practicing to improve further."
      } else {
        evaluation = "You're on the right track! Review the concepts and try again to improve your score.";
      }
    }
    return { totalScore, evaluation };
  } catch (error) {
    console.error('Error calculating final score:', error);
    return { totalScore: 0, evaluation: "Unable to generate evaluation at this time." };
  }
}

app.post('/quiz/submit-answer', async (req, res) => {
  try {
    const { quizData, currentQuestion, userAnswer, progress } = req.body;

    const aiResponse = await evaluateQuestion({
      currentQuestion: {
        text: currentQuestion.questionText,
        options: currentQuestion.options,
        type: currentQuestion.questionType,
        difficulty: currentQuestion.difficultyLevel
      },
      userAnswer,
      category: quizData.categoryTitle,
      subcategory: quizData.subcategoryTitle,
    });

    console.log('AI EVALUATION RESPONSE:', aiResponse);

    const quizRecord = new QuizRecord({
      quizId: quizData.quizId,
      userId: quizData.userId,
      question: currentQuestion.questionText,
      options: currentQuestion.options,
      userAnswer,
      correctAnswer: aiResponse.correctAnswer,
      score: aiResponse.score,
      explanation: aiResponse.explanation,
      difficultyLevel: currentQuestion.difficultyLevel,
      questionType: currentQuestion.questionType
    });
    await quizRecord.save();

    if (progress.current >= progress.total) {
      const { totalScore:finalScore, evaluation } = await calculateFinalScore(quizData.quizId);

      await Quiz.findByIdAndUpdate(quizData.quizId, {
        status: 'completed',
        finalScore,
        completedAt: new Date()
      });

      return res.json({
        evaluation: {
          wasCorrect: aiResponse.wasCorrect,
          correctAnswer: aiResponse.correctAnswer,
          score: aiResponse.score,
          explanation: aiResponse.explanation
        },
        quizCompleted: true,
        finalScore,
        finalFeedback:evaluation
      });
    }
    let nextDifficulty;
    if (aiResponse.wasCorrect) {
      nextDifficulty = Math.min(currentQuestion.difficultyLevel + 1, 5);
    } else {
      nextDifficulty = Math.max(currentQuestion.difficultyLevel - 1, 1);
    }
    let nextType = Math.random() > 0.7 ? "descriptive" : "multiple_choice";
    const nextQuestion = await generateAIQuestion(quizData.categoryTitle, quizData.subcategoryTitle, nextDifficulty, nextType);

    res.json({
      evaluation: {
        wasCorrect: aiResponse.wasCorrect,
        correctAnswer: aiResponse.correctAnswer,
        score: aiResponse.score,
        explanation: aiResponse.explanation
      },
      nextQuestion: {
        questionId: nextQuestion.questionId,
        questionText: nextQuestion.questionText,
        options: nextQuestion.options,
        questionType: nextQuestion.questionType,
        difficultyLevel: nextQuestion.difficultyLevel
      },
      progress: {
        current: progress.current + 1,
        total: progress.total
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/quiz/analytics', async (req, res) => {
  try {
    const { userId } = req.body;

    // Fetch all completed quizzes for this user, already sorted by date descending
    const quizzes = await Quiz.find({ 
      userId, 
      status: 'completed',
      finalScore: { $exists: true, $ne: null }
    }).sort({ completedAt: -1 }).lean();

    if (quizzes.length === 0) {
      return res.json({
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0,
        categoryProgress: [],
        categoryDistribution: [],
        quizHistory: []
      });
    }

    // Type-safe calculations
    const totalQuizzes = quizzes.length;
    
    const validQuizzes = quizzes.filter((q): q is typeof q & { finalScore: number } => 
      typeof q.finalScore === 'number'
    );

    const averageScore = validQuizzes.length > 0 
      ? Number((validQuizzes.reduce((sum, q) => sum + q.finalScore, 0) / validQuizzes.length).toFixed(1))
      : 0;

    const highestScore = validQuizzes.length > 0
      ? Math.max(...validQuizzes.map(q => q.finalScore))
      : 0;

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    validQuizzes.forEach(quiz => {
      categoryCounts[quiz.categoryTitle] = (categoryCounts[quiz.categoryTitle] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: Number(((count / totalQuizzes) * 100).toFixed(1))
    }));

    // Category progress (last 5 scores per category)
    const categoryProgress: Record<string, { scores: number[]; dates: string[] }> = {};
    
    validQuizzes.forEach(quiz => {
      if (!categoryProgress[quiz.categoryTitle]) {
        categoryProgress[quiz.categoryTitle] = { scores: [], dates: [] };
      }
      categoryProgress[quiz.categoryTitle].scores.push(quiz.finalScore);
      if (quiz.completedAt) {
        categoryProgress[quiz.categoryTitle].dates.push(quiz.completedAt.toISOString().split('T')[0]);
      }
    });

    // Quiz history - simplified without time spent, date first
    const quizHistory = validQuizzes.slice(0, 15).map(quiz => ({
      id: quiz._id.toString(),
      date: quiz.completedAt ? quiz.completedAt.toISOString().split('T')[0] : 'Unknown',
      category: quiz.categoryTitle,
      subcategory: quiz.subcategoryTitle,
      score: quiz.finalScore
    }));

    res.json({
      totalQuizzes,
      averageScore,
      highestScore,
      categoryProgress: Object.entries(categoryProgress).map(([category, data]) => ({
        category,
        scores: data.scores.slice(-5),
        dates: data.dates.slice(-5)
      })),
      categoryDistribution,
      quizHistory
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
