import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
  count?: number;
}

export interface GeneratedImage {
  imageData: string;
  mimeType: string;
}

export class GeminiImageGenerator {
  private model: any;

  constructor() {
    // Use Gemini 2.0 Flash for image generation
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
  }

  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    try {
      const { prompt, count = 1 } = options;
      
      // Enhanced prompt for better image generation
      const enhancedPrompt = this.enhancePrompt(prompt);
      
      const result = await this.model.generateContent([
        {
          text: `Generate ${count} high-quality image(s) based on this description: ${enhancedPrompt}. 
                 The images should be photorealistic, well-composed, and visually appealing. 
                 Return the images in a format that can be displayed in a mobile app.`
        }
      ]);

      const response = await result.response;
      
      // For now, return mock data since Gemini 2.0 Flash doesn't directly generate images
      // In a real implementation, you would use a dedicated image generation model
      return this.mockImageGeneration(prompt, count);
      
    } catch (error) {
      console.error("Error generating image:", error);
      throw new Error("Failed to generate image. Please try again.");
    }
  }

  private enhancePrompt(prompt: string): string {
    // Enhance the prompt for better results
    const enhancements = [
      "high quality",
      "detailed",
      "professional",
      "aesthetic",
      "well-lit",
      "sharp focus"
    ];
    
    return `${prompt}, ${enhancements.join(", ")}`;
  }

  private mockImageGeneration(prompt: string, count: number): GeneratedImage[] {
    // Mock implementation - in production, this would be actual image generation
    return Array.from({ length: count }, (_, index) => ({
      imageData: `/api/placeholder/400/600?text=${encodeURIComponent(prompt.substring(0, 50))}&index=${index}`,
      mimeType: "image/jpeg"
    }));
  }

  async generatePromptVariations(originalPrompt: string): Promise<string[]> {
    try {
      const result = await this.model.generateContent([
        {
          text: `Generate 5 creative variations of this image prompt: "${originalPrompt}". 
                 Each variation should be unique but maintain the core concept. 
                 Return only the variations, one per line.`
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parse the variations
      return text.split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 5);
        
    } catch (error) {
      console.error("Error generating prompt variations:", error);
      return [];
    }
  }

  async improvePrompt(originalPrompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent([
        {
          text: `Improve this image generation prompt to make it more detailed and effective: "${originalPrompt}". 
                 Make it more specific, add relevant artistic terms, and ensure it will generate high-quality images. 
                 Return only the improved prompt.`
        }
      ]);

      const response = await result.response;
      return response.text().trim();
      
    } catch (error) {
      console.error("Error improving prompt:", error);
      return originalPrompt;
    }
  }
}

// Export singleton instance
export const geminiImageGenerator = new GeminiImageGenerator();