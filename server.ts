import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint to parse schedule images (cuadrantes, horarios, apuntes)
app.post('/api/ai/parse-schedule-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', currentYear = new Date().getFullYear(), availableCategories = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Falta la imagen en base64' });
    }

    // Clean data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const catListStr = availableCategories.length > 0 
      ? availableCategories.join(', ')
      : 'Estudio, Parciales, Examen final, Trabajo, Citas salud, Autoescuela, Gimnasio, Pesca, Urgencia';

    const systemPrompt = `Eres un asistente experto en transcripción de horarios académicos, calendarios y cuadrantes universitarios o escolares.
Analiza la imagen que contiene un horario, cuadrante de clases, exámenes o citas (por ejemplo: "Derecho romano 14/12 aula 110 10:00-11:30").
Tu tarea es extraer de manera precisa todos los eventos y clases que aparezcan.
Reglas:
1. "date": Debe tener formato AAAA-MM-DD (ISO 8601, ej. "${currentYear}-12-14"). Si en la imagen pone "14/12", infiere el año actual (${currentYear}). Si aparece día de la semana (Lunes, Martes, etc.) o un rango de fechas, genera las fechas correspondientes del mes/año en curso.
2. "startTime": Formato HH:mm de 24 horas (ej. "10:00").
3. "endTime": Formato HH:mm de 24 horas (ej. "11:30"). Si no hay hora de fin indicada, suma 1 hora a startTime.
4. "title": Nombre de la asignatura o actividad (ej. "Derecho Romano", "Historia del Derecho", etc.).
5. "location": Aula, edificio, enlace o lugar (ej. "aula 110", "Aula Magna", etc.). Si no hay, dejar vacío "".
6. "category": Selecciona la categoría más afín de esta lista: [${catListStr}]. Para clases y materias universitarias suele ser "Estudio", para exámenes parciales "Parciales", para finales "Examen final".
7. "description": Información adicional útil como profesor, grupo, tema o apuntes detectados.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: 'Extrae todos los eventos, clases y horarios visibles en este cuadrante/imagen.',
          },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            notes: { type: Type.STRING },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  date: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  location: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['title', 'date', 'startTime', 'endTime'],
              },
            },
          },
          required: ['events'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No se obtuvo respuesta del modelo de IA' });
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error en /api/ai/parse-schedule-image:', error);
    return res.status(500).json({
      error: error?.message || 'Error al procesar la imagen del horario con IA',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Calendario listo en http://localhost:${PORT}`);
  });
}

startServer();
