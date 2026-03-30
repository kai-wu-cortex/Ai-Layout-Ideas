import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

// Initialize the Gemini client
export const getGeminiClient = () => {
  // In this environment, the API key is provided via these env vars
  // NEXT_PUBLIC_GEMINI_API_KEY is usually the free tier key
  // API_KEY is the one selected by the user via the selection dialog
  // Prioritize the free tier key as requested
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API key is missing. Please ensure it is set in the environment or selected via the UI.");
    throw new Error("API key is not set. Please connect your Gemini API key.");
  }
  
  return new GoogleGenAI({ apiKey });
};

// 1. Generate High-Quality Images (gemini-3-pro-image-preview)
export const generateHighQualityImage = async (
  prompt: string,
  size: "1K" | "2K" | "4K" = "1K",
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"
) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio,
        imageSize: size,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// 2. Generate/Edit Images (gemini-3.1-flash-image-preview)
export const generateOrEditImage = async (
  prompt: string,
  base64Image?: string,
  mimeType?: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "1:4" | "1:8" | "4:1" | "8:1" = "1:1"
) => {
  const ai = getGeminiClient();
  const parts: any[] = [{ text: prompt }];
  
  if (base64Image && mimeType) {
    parts.unshift({
      inlineData: {
        data: base64Image.split(',')[1] || base64Image, // remove data:image/...;base64, if present
        mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio,
      },
      tools: [
        {
          googleSearch: {
            searchTypes: {
              webSearch: {},
              imageSearch: {},
            }
          },
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// 3. Generate Text with Search Grounding (gemini-3-flash-preview)
export const generateTextWithSearch = async (prompt: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text;
};

// 4. Complex Layout/Design Ideas with High Thinking (gemini-3-flash-preview)
export const generateComplexIdeas = async (prompt: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    },
  });
  return response.text;
};

// 5. Fast Text Generation (gemini-3.1-flash-lite-preview)
export const generateFastText = async (prompt: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
  });
  return response.text;
};

// 6. Generate Layout Prototype (gemini-3.1-pro-preview)
export const generateLayoutPrototype = async (prompt: string, canvasWidth: number, canvasHeight: number, referenceImage?: string) => {
  const ai = getGeminiClient();
  const parts: any[] = [
    { text: `You are an expert UI/UX designer. Generate 3 distinct low-fidelity wireframe (RPD) layout options for a poster with the theme: "${prompt}".
The canvas size is ${canvasWidth}x${canvasHeight}.
Return a JSON array containing 3 arrays, each representing a layout option. Each element in the layout array should have:
- type: "text" or "placeholder" (use placeholder for images/graphics)
- x: number (x position)
- y: number (y position)
- width: number
- height: number
- content: string (for text elements, a short descriptive placeholder text like "Main Title", "Subtitle", "Body Text". For placeholders, leave empty)
- style: object (for text elements, include fontSize, fontWeight, textAlign, color, backgroundColor. Use gray colors like #666666 for text and #f5f5f5 for backgroundColor to keep it low-fidelity)

Make sure the elements fit within the canvas and create a balanced, professional layout.` }
  ];

  if (referenceImage) {
    const [prefix, base64Data] = referenceImage.split(',');
    const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
    parts.unshift({
      inlineData: {
        data: base64Data,
        mimeType,
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
              content: { type: Type.STRING },
              style: {
                type: Type.OBJECT,
                properties: {
                  fontSize: { type: Type.NUMBER },
                  fontWeight: { type: Type.STRING },
                  textAlign: { type: Type.STRING },
                  color: { type: Type.STRING },
                  backgroundColor: { type: Type.STRING },
                }
              }
            },
            required: ["type", "x", "y", "width", "height"]
          }
        }
      }
    }
  });
  
  return JSON.parse(response.text || "[]");
};

// 7. Stream Layout Prototypes (gemini-3-flash-preview)
export const streamLayoutPrototypes = async (
  prompt: string,
  canvasWidth: number,
  canvasHeight: number,
  onLayoutGenerated: (layout: any[]) => void,
  page: number = 1,
  referenceImage?: string,
  includePlaceholders: boolean = true
) => {
  const ai = getGeminiClient();
  const parts: any[] = [
    { text: `You are an expert UI/UX designer. Generate 16 distinct low-fidelity wireframe layout options for a poster with the theme: "${prompt}".
This is page ${page} of the results. Make these layouts different from previous ones if possible.
The canvas size is ${canvasWidth}x${canvasHeight}.
Output each layout option as a single-line JSON object (an array of elements).
Each element should have:
- type: "text", "placeholder", "shape", "circle", or "line"
- x: number
- y: number
- width: number (for "line", this is length)
- height: number (for "line", this is thickness)
- content: string (for text, the content; for shapes, use one of: "triangle", "diamond", "pentagon", "hexagon", "star")
- style: object (fontSize, fontWeight, textAlign, color, backgroundColor, borderRadius, opacity, rotation)

DESIGN PRINCIPLES TO FOLLOW:
1. ALIGNMENT: Use a clear grid system. Elements should align to each other or to the canvas edges.
2. HIERARCHY: Vary sizes significantly to create a clear focal point. The main title should be dominant.
3. RHYTHM & REPETITION: Use consistent spacing and repeat elements or styles to create a sense of movement.
4. FUNCTION: The layout must serve the theme. If it's an event, the date/time should be prominent.
5. READING HABITS: Design for F-pattern or Z-pattern reading flows.
6. WHITE SPACE: Don't crowd the canvas; use negative space to let elements breathe.

IMPORTANT:
- Use "circle" for circular elements.
- Use "shape" for specific geometric shapes, and set "content" to one of the supported types: "triangle", "diamond", "pentagon", "hexagon", "star".
- Use "line" for decorative lines.
- ${includePlaceholders ? 'Include "placeholder" elements for images or key visual areas.' : 'DO NOT include any "placeholder" elements. Focus on text and shapes.'}
- Create dynamic and flexible layouts. Don't just use rectangles. Incorporate diagonal lines, circular accents, and varied shapes to create visual interest.
- Experiment with overlapping elements, varied opacities, and rotations to create a modern, professional look.
- Ensure a balanced composition with clear hierarchy.

Output EXACTLY 16 lines, each line being a valid JSON array of elements. Do not include any other text, markdown blocks, or explanations. Just raw JSON lines.` }
  ];

  if (referenceImage) {
    const [prefix, base64Data] = referenceImage.split(',');
    const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
    parts.unshift({
      inlineData: {
        data: base64Data,
        mimeType,
      }
    });
  }

  let response;
  try {
    // Use Flash model as primary for layout generation as it's more stable and faster
    response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: { parts },
    });
  } catch (error: any) {
    const errorMsg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    console.error("Layout generation failed:", errorMsg);
    
    // If it's a network error or quota error, we've already tried Flash, so we just throw
    throw error;
  }

  let buffer = "";
  for await (const chunk of response) {
    buffer += chunk.text;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          const layout = JSON.parse(trimmed);
          onLayoutGenerated(layout);
        } catch (e) {
          console.error("Failed to parse layout line", trimmed, e);
        }
      }
    }
  }
  
  // Handle remaining buffer
  if (buffer.trim()) {
    try {
      const layout = JSON.parse(buffer.trim());
      onLayoutGenerated(layout);
    } catch (e) {
      console.error("Failed to parse final layout line", buffer, e);
    }
  }
};
