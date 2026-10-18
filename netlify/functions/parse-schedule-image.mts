import { GoogleGenAI, Type } from '@google/genai';

export default async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  // Handle GET health check
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        service: 'Netlify Gemini Schedule Parser Function',
        recommendedModel: 'gemini-3.8-flash',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido. Utiliza POST.' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', currentYear = new Date().getFullYear(), availableCategories = [], apiKey: customBodyKey } = body;

    const apiKey =
      req.headers.get('x-gemini-api-key') ||
      customBodyKey ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Falta configurar la variable de entorno GEMINI_API_KEY en el servidor o Netlify, o introducir tu clave en los ajustes del escáner.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Falta la imagen en base64' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    let cleanBase64 = imageBase64;
    let detectedMime = mimeType;
    const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      detectedMime = match[1];
      cleanBase64 = match[2];
    } else {
      cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    }

    const catListStr = availableCategories.length > 0
      ? availableCategories.join(', ')
      : 'Estudio, Parciales, Examen final, Trabajo, Citas salud, Autoescuela, Gimnasio, Pesca, Urgencia';

    const systemPrompt = `Eres un asistente experto en transcripción y digitalización de horarios académicos, calendarios y cuadrantes universitarios o escolares.
Analiza la imagen que contiene un horario, cuadrante de clases, exámenes o citas (por ejemplo: "Derecho romano 14/12 aula 110 10:00-11:30").
Tu tarea es extraer de manera precisa todos los eventos y clases que aparezcan.
Reglas:
1. "date": Formato YYYY-MM-DD (ISO 8601, ej. "${currentYear}-12-14"). Si en la imagen pone "14/12", infiere el año actual (${currentYear}). Si aparece día de la semana (Lunes, Martes, etc.) en una cuadrícula semanal, asigna la fecha correspondiente a los días de la semana actual o más cercana.
2. "startTime": Formato HH:mm de 24 horas (ej. "10:00", "09:30").
3. "endTime": Formato HH:mm de 24 horas (ej. "11:30", "14:00"). Si no hay hora de fin indicada, suma 1 hora a startTime o 1 hora y media según corresponda.
4. "title": Nombre de la asignatura o actividad (ej. "Derecho Romano", "Historia del Derecho", "Derecho Constitucional I", etc.). Limpia códigos innecesarios si dificultan la lectura.
5. "location": Aula, edificio, enlace o lugar (ej. "aula 110", "Aula 2.3", "Seminario B", etc.). Si no hay, dejar en blanco "".
6. "category": Selecciona la categoría más afín de esta lista: [${catListStr}]. Para clases y asignaturas universitarias suele ser "Estudio", para exámenes parciales "Parciales", para exámenes finales "Examen final".
7. "description": Información adicional como aula, grupo, profesor o notas que aparezcan en el cuadrante.`;

    const ai = new GoogleGenAI({ apiKey });
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let responseText: string | null = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: detectedMime || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
                {
                  text: `${systemPrompt}\n\nExtrae todos los eventos, clases, exámenes o citas visibles en esta foto/horario y devuélvelos en formato JSON estructurado según el esquema.`,
                },
              ],
            },
          ],
          config: {
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

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error('No se pudo obtener respuesta del servicio de IA');
    }

    const parsed = JSON.parse(responseText);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Error en netlify function parse-schedule-image:', error);
    let errMsg = error?.message || 'Error al procesar la imagen del horario con IA';
    try {
      const parsedErr = JSON.parse(errMsg);
      if (parsedErr?.error?.message) {
        errMsg = parsedErr.error.message;
      }
    } catch {}
    return new Response(
      JSON.stringify({
        error: errMsg,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
