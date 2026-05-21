/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 audio and imagery
app.use(express.json({ limit: '30mb' }));

// Lazy-initialize Gemini SDK to fail safe when key is initialized
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. HEALTHCHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// 2. SUGGEST VERSES BASED ON INTUITION OR THEME
app.post('/api/gemini/suggest-verses', async (req, res) => {
  try {
    const { theme, excludeReferences } = req.body;
    if (!theme) {
      return res.status(400).json({ error: 'O tema ou estado de espírito é obrigatório.' });
    }

    const ai = getGeminiClient();
    
    let excludePrompt = '';
    if (excludeReferences && Array.isArray(excludeReferences) && excludeReferences.length > 0) {
      excludePrompt = `\nIMPORTANTE: Você NÃO DEVE sugerir NENHUMA das seguintes passagens/referências bíblicas, pois elas já foram mostradas de antemão e o usuário quer novas opções: [${excludeReferences.join(', ')}]. Varie ao máximo escolhendo outros versículos igualmente relevantes para o tema.`;
    }

    const prompt = `Você é um curador e teólogo perito em mensagens bíblicas e inspiracionais para redes sociais.
Sugira exatamente 5 versículos da Bíblia Sagrada que correspondam perfeitamente ao tema ou sentimento do usuário: "${theme}".
Os versículos devem ser em português brasileiro (PT-BR). Escolha passagens impactantes e fáceis de memorizar.${excludePrompt}

Instruções para o JSON de saída:
- Ofereça uma lista limpa.
- Retorne apenas o objeto JSON respeitando o schema fornecido.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Você é um assistente teológico especialista em mídia cristã e curadoria de versículos bíblicos edificantes.',
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'O texto integral do versículo bíblico bíblico em português.',
              },
              reference: {
                type: Type.STRING,
                description: 'A referência exata da passagem (ex: Filipenses 4:13).',
              },
              theme: {
                type: Type.STRING,
                description: 'O sentimento ou subtema que ela abraça.',
              },
              reflectionPrompt: {
                type: Type.STRING,
                description: 'Uma mini-frase (até 12 palavras) explicando por que este versículo conforta este sentimento.',
              },
            },
            required: ['text', 'reference', 'theme', 'reflectionPrompt'],
          },
        },
      },
    });

    const listText = response.text || '[]';
    const parsed = JSON.parse(listText.trim());
    return res.json({ list: parsed });
  } catch (error: any) {
    console.error('Error suggesting verses:', error);
    return res.status(500).json({
      error: 'Erro ao obter sugestões de versículos.',
      detail: error.message,
    });
  }
});

// 3. GENERATE COMPLETE SHORT DEVOTIONAL VIDEO CONTENT
app.post('/api/gemini/generate-short-content', async (req, res) => {
  try {
    const { verse, reference } = req.body;
    if (!verse || !reference) {
      return res.status(400).json({ error: 'O versículo e a referência são necessários.' });
    }

    const ai = getGeminiClient();
    const prompt = `Analise o seguinte versículo e crie um roteiro completo de conteúdo devocional de vídeo contínuo com duração de 1 minuto e meio a 2 minutos e meio (de 90 a 150 segundos) de narração calma, sem ultrapassar o limite de 3 minutos (180 segundos).
  
Versículo: "${verse}"
Referência: "${reference}"

Gerencie as seguintes seções de resposta estruturadas:
1. Um título excelente, chamativo e cativante em português.
2. Uma reflexão devocional narrada em português profunda, consoladora e transformadora, perfeita para ser lida de forma calma e compassiva em voz alta. IMPORTANTÍSSIMO: Ela DEVE ter entre 180 e 300 palavras para alcançar confortavelmente a duração de 1m30s a 2m30s (nunca faça uma reflexão curta de 15 segundos ou que passe de 3 minutos).
3. Um prompt descritivo em inglês detalhado de alta qualidade artística (estilo pintura celestial, ambiente natural ou arte sacra simbólica) adequado para uma IA geradora de imagens criar um plano de fundo na proporção vertical 9:16.
4. Uma lista de 5 hashtags de alto alcance espiritual e cristão.
5. Uma legenda excelente de post para canais do YouTube Shorts / Reels / TikTok ou Instagram com chamada à ação espiritual.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Você é um redator de vídeo cristão profissional, especializado em mensagens cristãs de alto impacto espiritual, retenção e profundidade bíblica.',
        responseMimeType: 'application/json',
        temperature: 0.75,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Título inspiracional curto e forte (ex: "Calma na Tempestade")',
            },
            reflection: {
              type: Type.STRING,
              description: 'A reflexão profunda, encorajadora e consoladora em português brasileiro, contendo entre 180 e 300 palavras, ideal para uma narração de 1m30s a 2m30s.',
            },
            visualPrompt: {
              type: Type.STRING,
              description: 'A landscape or symbolic spiritual environment prompt in English for image AI generators. Portray high-quality art, heavenly golden rays, serenity, sacred concept, 9:16 portrait style, photorealistic or digital oil painting.',
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de 5 hashtags relevantes com a hashtag # no início.',
            },
            youtubeDescription: {
              type: Type.STRING,
              description: 'Texto de legenda pronto para as redes sociais com engajamento.',
            },
          },
          required: ['title', 'reflection', 'visualPrompt', 'hashtags', 'youtubeDescription'],
        },
      },
    });

    const schemaText = response.text || '{}';
    const parsed = JSON.parse(schemaText.trim());
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in generating short content:', error);
    return res.status(500).json({
      error: 'Erro ao gerar conteúdo do Shorts.',
      detail: error.message,
    });
  }
});

// 4. GENERATE PORTRAIT (9:16) CHRISTIAN THEME BACKGROUND
app.post('/api/gemini/generate-short-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'O prompt descritivo é obrigatório para gerar a imagem.' });
    }

    const ai = getGeminiClient();
    
    // We add portrait 9:16 requirements to the prompt to enforce vertical layout!
    const fullPrompt = `Portrait orientation 9:16 aspect ratio, christian inspired background scene. ${prompt}. Serene lighting, digital painting with depth, no text or watermarks in the image, peaceful ambient, majestic textures.`;
    
    console.log(`Generating vertical 9:16 background image for prompt: "${fullPrompt}"`);
    
    let base64Image = '';
    let lastErrorMsg = '';

    // Step 1: Try imagen-3.0-generate-002 (The standard Imagen 3 production model for generateImages)
    try {
      console.log('Trying standard image model "imagen-3.0-generate-002"...');
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '9:16',
        },
      });

      if (response.generatedImages?.[0]?.image?.imageBytes) {
        base64Image = response.generatedImages[0].image.imageBytes;
        console.log('Successfully generated image via "imagen-3.0-generate-002"');
      }
    } catch (err3: any) {
      console.warn('Standard model "imagen-3.0-generate-002" failed:', err3.message);
      lastErrorMsg = err3.message;
    }

    // Step 2: Fallback to gemini-2.5-flash-image (using generateContent as documented in the skill)
    if (!base64Image) {
      try {
        console.log('Trying fallback model "gemini-2.5-flash-image" via generateContent()...');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: fullPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: '9:16',
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              base64Image = part.inlineData.data;
              break;
            }
          }
        }
        if (base64Image) {
          console.log('Successfully generated image via "gemini-2.5-flash-image"');
        }
      } catch (errFlash: any) {
        console.warn('Fallback model "gemini-2.5-flash-image" failed:', errFlash.message);
        lastErrorMsg = errFlash.message;
      }
    }

    // Step 3: Fallback to imagen-4.0-generate-001
    if (!base64Image) {
      try {
        console.log('Trying fallback model "imagen-4.0-generate-001"...');
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: fullPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '9:16',
          },
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
          base64Image = response.generatedImages[0].image.imageBytes;
          console.log('Successfully generated image via "imagen-4.0-generate-001"');
        }
      } catch (err4: any) {
        console.warn('Fallback model "imagen-4.0-generate-001" failed:', err4.message);
        lastErrorMsg = err4.message;
      }
    }

    if (!base64Image) {
      throw new Error(`As tentativas de criar a imagem com os modelos (imagen-3.0-generate-002, gemini-2.5-flash-image, imagen-4.0-generate-001) falharam ou não estão habilitadas na sua chave de API atual. Mensagem interna do servidor: ${lastErrorMsg}`);
    }

    return res.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
    });
  } catch (error: any) {
    console.error('Error generating image via Gemini:', error);
    return res.status(500).json({
      error: 'Erro de comunicação ao criar plano de fundo IA.',
      detail: error.message,
    });
  }
});

// 5. GENERATE SPEECH VOICE TRACK OF THE SCRIPT
app.post('/api/gemini/generate-narration', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'O texto de narração é fundamental.' });
    }

    const activeVoice = voice || 'Zephyr'; // Zephyr, Kore, Puck etc.
    const ai = getGeminiClient();

    // Use gemini-3.1-flash-tts-preview
    console.log(`Generating voice track with actor "${activeVoice}" for text: "${text}"`);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{
        parts: [
          { text: `Fale de modo inspirador, calmo e reflexivo em português esta mensagem bíblica: ${text}` }
        ]
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: activeVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('Nenhum áudio foi gerado pelo modelo Text-to-Speech.');
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/pcm',
    });
  } catch (error: any) {
    console.error('Error generating audio track:', error);
    return res.status(500).json({
      error: 'Fracasso ao gerar narração por voz de IA.',
      detail: error.message,
    });
  }
});

// -------------------------------------------------------------
// Dev & Build server serving
// -------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`--- [CRIADOR DE SHORTS CRISTÃOS ACTIVATED] ---`);
    console.log(`Port binding: http://localhost:${PORT}`);
    console.log(`Env: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap();
