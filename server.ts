import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Structured interpretation endpoint for user messages
app.post('/api/penny/interpret', async (req, res) => {
  const { message, currentContext } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  // If Gemini API key is missing or client is null, inform frontend so fallback is used
  if (!aiClient) {
    return res.status(503).json({
      fallbackRequired: true,
      reason: 'Gemini API key not configured on server',
    });
  }

  try {
    const prompt = `Analyze this message sent by an everyday user to "Penny", an automated robo-investing companion:
"${message}"

Current conversation context:
${JSON.stringify(currentContext || {})}

Tasks:
1. Identify the user's intent:
   - 'start_investing': User has money and wants Penny to manage or invest it (e.g. "I have $100 and want you to handle investing it").
   - 'report_expense': User mentions an upcoming essential expense or bill (e.g. "I need around $60 for textbooks in January").
   - 'report_emergency': User experiences an unexpected life event or shock (e.g. "My car just broke down and repairs might cost $300").
   - 'report_income_change': User got a raise, bonus, or gift.
   - 'change_risk': User specifies or asks to change risk tolerance ("Low", "Medium", "High").
   - 'approve': User accepts or approves a plan.
   - 'pause': User wants to pause contributions.
   - 'withdraw': User wants to take money out.
   - 'ask_question': User asks an educational or informational question.
   - 'unknown': Other.
2. Extract the dollar amount (e.g. 100, 60, 300).
3. Extract the item/label (e.g. 'textbooks', 'car repairs', 'starting cash').
4. Extract effective date (e.g. 'January') or null.
5. Extract risk level if mentioned ('Low', 'Medium', 'High') or null.

Remember: YOU DO NOT compute portfolio allocations, calculate investable cash, or move funds. You only parse natural language into structured data.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a structured financial intent parser for Penny, an iMessage robo-investing companion. Output strictly structured JSON according to the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description:
                'Intent: start_investing | report_expense | report_income_change | report_emergency | ask_question | change_risk | approve | pause | withdraw | unknown',
            },
            amount: {
              type: Type.NUMBER,
              description: 'The numerical dollar amount extracted from the message, or 0 if none.',
            },
            label: {
              type: Type.STRING,
              description: 'Short descriptor of the expense, emergency, or purpose.',
            },
            effectiveDate: {
              type: Type.STRING,
              description: 'Timeframe or month mentioned, or empty/null.',
            },
            riskLevel: {
              type: Type.STRING,
              description: 'Low, Medium, or High if explicitly stated, otherwise empty/null.',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0 and 1.',
            },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Any missing fields needed to execute the intent.',
            },
            clarifyingQuestion: {
              type: Type.STRING,
              description: 'Optional brief clarifying question if ambiguous.',
            },
          },
          required: ['intent', 'amount', 'label', 'confidence', 'missingFields'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const structured = JSON.parse(text);
    return res.json(structured);
  } catch (err: any) {
    console.error('Gemini interpretation error:', err);
    return res.status(500).json({
      fallbackRequired: true,
      error: err?.message || 'Gemini processing failed',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Penny iMessage App listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
