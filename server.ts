import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for transferring high-quality snapped/uploaded photos
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", apiKeyConfigured: !!apiKey });
  });

  // Endpoint 1: Analyze user portrait using gemini-3.1-pro-preview
  app.post("/api/analyze-face", async (req: express.Request, res: express.Response) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        res.status(400).json({ error: "Missing imageBase64 portrait data" });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      };

      const textPart = {
        text: `Analyze this person's portrait for a historical photo booth transformation. 
Provide a friendly, highly engaging description of their physical features, facial structures, current facial expression, emotional energy/vibe, and key visual attributes (hair, beard, eyes, mouth shape, posture, clothing style, glasses/accessories). 
In addition, suggest a creative, witty backstory of how they would fit into historical settings (e.g., as a powerful noble in Ancient Egypt, a dashing steampunk inventor in London, or an Apollo astronaut).
Keep your response strictly under 140 words, very warm, complementary, and inspiring!`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts: [imagePart, textPart] },
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Face analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image" });
    }
  });

  // Endpoint 2: Generate historical scene/background using gemini-3.1-flash-image
  app.post("/api/generate-scene", async (req: express.Request, res: express.Response) => {
    try {
      const { prompt, aspectRatio } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Missing text prompt for scene generation" });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: "1K",
          },
        },
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        res.status(500).json({ error: "No image part returned by Gemini API" });
        return;
      }

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Scene generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate scene" });
    }
  });

  // Endpoint 3: Fully AI-blended "AI Time Travel" composite using gemini-3.1-flash-image
  app.post("/api/ai-time-travel", async (req: express.Request, res: express.Response) => {
    try {
      const { imageBase64, mimeType, prompt } = req.body;
      if (!imageBase64) {
        res.status(400).json({ error: "Missing source portrait image" });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      };

      const finalPrompt = prompt || "Insert this person's face and head seamlessly onto a glorious historical figure in a detailed setting, maintaining their likeness, facial expression, and gaze direction perfectly. Style must be beautiful and integrated.";

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [imagePart, { text: finalPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K",
          },
        },
      });

      let resultImageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          resultImageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!resultImageUrl) {
        res.status(500).json({ error: "Failed to generate blended portrait" });
        return;
      }

      res.json({ imageUrl: resultImageUrl });
    } catch (error: any) {
      console.error("AI Time Travel blending error:", error);
      res.status(500).json({ error: error.message || "Failed to blend portrait with historical era" });
    }
  });

  // Integrate Vite Dev Server Middleware or serve static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Time-Travel Photo Booth] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
