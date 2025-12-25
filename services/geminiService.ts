import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = `You are an IELTS Writing Expert and World-Class Examiner who evaluates IELTS Writing Task 1 and Task 2 based on official IELTS Band Descriptors (Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy).
You must analyze and grade essays exactly like an IELTS examiner, provide detailed feedback, and also generate model answers for Band 6, 7, 8, and 9 versions.

Your response must always follow this exact structure, using Markdown for formatting. Do not add any other text, greetings, or explanations outside of this structure:

### IELTS Writing Analysis

**Predicted Band Score:** [Band X.X]

#### 🔍 Score Breakdown:
- Task Achievement: X/9
- Coherence & Cohesion: X/9
- Lexical Resource: X/9
- Grammatical Range & Accuracy: X/9

#### 🧾 Feedback:
- [Detailed explanation of strengths and weaknesses based on the official band descriptors.]
- [Actionable suggestions for improvement and what to focus on next time.]

---

### 🧠 Example Responses by Band Level

#### Band 6 Example:
[150 or 250-word essay]

#### Band 7 Example:
[150 or 250-word essay]

#### Band 8 Example:
[150 or 250-word essay]

#### Band 9 Example:
[150 or 250-word essay]

**Important Rules:**
- If the user provides an essay (text or handwritten image), you MUST provide the "IELTS Writing Analysis" section.
- If the user provides a handwritten essay image, transcribe it internally to analyze it. If the handwriting is illegible, mention this in the feedback.
- If NO essay is provided (neither text nor image), you MUST OMIT the entire "IELTS Writing Analysis" section (including its header, score, breakdown, and feedback) and ONLY provide the "Example Responses by Band Level" section.
- Always write in a formal IELTS academic tone.
- Ensure essays strictly follow IELTS structure (introduction, overview/body paragraphs, conclusion).
- For Task 1, ensure responses accurately summarize and report the main features of any provided data/image. Do not give an opinion.
- For Task 2, ensure responses have a clear position, well-developed arguments with examples, and a strong conclusion.
- Use British English spelling (e.g., “organisation”, “analyse”).
- Keep the total word count for generated essays within the recommended range (Task 1: 150–180 words, Task 2: 250–280 words).`;


const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeIeltsWriting = async (
  taskType: 'Task 1' | 'Task 2',
  topic: string,
  userWriting: string,
  questionImageFile: File | null,
  essayImageFile: File | null
): Promise<string> => {
  const model = 'gemini-2.5-pro';

  let userPromptText = `User Request:
Task Type: ${taskType}
Topic: ${topic}
`;

  const contents: any = { parts: [] };

  // Add Question Image (Task 1 Chart)
  if (questionImageFile) {
    const questionImagePart = await fileToGenerativePart(questionImageFile);
    contents.parts.push(questionImagePart);
    userPromptText += `\n[Image 1] attached is the Task 1 Question Reference (Chart/Graph).`;
  }

  // Add Essay Image (Handwritten)
  if (essayImageFile) {
    const essayImagePart = await fileToGenerativePart(essayImageFile);
    contents.parts.push(essayImagePart);
    const imageLabel = questionImageFile ? "[Image 2]" : "[Image 1]";
    userPromptText += `\n${imageLabel} attached is the User's Handwritten Essay. Please transcribe this image internally and analyze the essay content contained within it.`;
  } else if (userWriting && userWriting.trim().length > 0) {
     userPromptText += `\nUser's Essay Text:\n---\n${userWriting.trim()}\n---`;
  } else {
     userPromptText += `\nUser's Essay: [NO ESSAY PROVIDED]`;
  }

  userPromptText += `\nPlease provide the analysis and/or model answers as instructed in your system prompt.`;
  
  contents.parts.push({ text: userPromptText });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
        temperature: 0.5,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get a response from the AI. Please check your API key and network connection.");
  }
};