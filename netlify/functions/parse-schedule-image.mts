import { GoogleGenAI, Type } from '@google/genai';
import firebaseConfig from '../../firebase-applet-config.json';

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export const config = {
  path: '/api/ai/parse-schedule-image',
};

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { error: 'Método no permitido.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(503, { error: 'Falta configurar GEMINI_API_KEY en Netlify.' });

  const allowedEmails = (process.env.AI_ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (allowedEmails.length === 0) {
    return json(503, { error: 'Falta configurar AI_ALLOWED_EMAILS en Netlify.' });
  }

  const authorization = request.headers.get('authorization') || '';
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!idToken) return json(401, { error: 'Inicia sesión para analizar una imagen.' });

  try {
    const identityResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!identityResponse.ok) return json(401, { error: 'La sesión ha caducado. Vuelve a iniciar sesión.' });

    const identity = await identityResponse.json();
    const email = identity.users?.[0]?.email?.toLowerCase();
    if (!email || !allowedEmails.includes(email)) {
      return json(403, { error: 'Este correo no está autorizado para usar el análisis con IA.' });
    }

    const payload = await request.json();
    const imageBase64 = typeof payload.imageBase64 === 'string' ? payload.imageBase64 : '';
    if (!imageBase64) return json(400, { error: 'Falta la imagen.' });
    if (imageBase64.length > 5_500_000) {
      return json(413, { error: 'La imagen es demasiado grande. Prueba con una captura más pequeña.' });
    }

    let cleanBase64 = imageBase64;
    let mimeType = typeof payload.mimeType === 'string' ? payload.mimeType : 'image/jpeg';
    const dataUrl = imageBase64.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/i);
    if (dataUrl) {
      mimeType = dataUrl[1];
      cleanBase64 = dataUrl[2];
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) {
      return json(400, { error: 'Formato de imagen no compatible. Usa JPG o PNG.' });
    }

    const currentYear = Number.isInteger(payload.currentYear)
      ? payload.currentYear
      : new Date().getFullYear();
    const availableCategories = Array.isArray(payload.availableCategories)
      ? payload.availableCategories.filter((item: unknown) => typeof item === 'string').slice(0, 30)
      : [];
    const categories = availableCategories.length
      ? availableCategories.join(', ')
      : 'Estudio, Parciales, Examen final, Trabajo, Citas salud, Autoescuela, Gimnasio, Urgencia';

    const prompt = `Eres un asistente experto en leer horarios, calendarios y cuadrantes académicos. Extrae todos los eventos visibles.
Reglas:
1. date en formato YYYY-MM-DD. Si aparece día/mes sin año, usa ${currentYear}. En cuadrículas semanales, usa la fecha futura más cercana que corresponda al día de la semana.
2. startTime y endTime en formato HH:mm de 24 horas. Si no hay hora final, estima una duración razonable.
3. title debe ser el nombre claro de la asignatura o actividad.
4. location es el aula o lugar, o una cadena vacía si no aparece.
5. category debe ser una de estas categorías: ${categories}.
6. description incluye notas adicionales visibles. No inventes datos que no aparezcan.`;

    const ai = new GoogleGenAI({ apiKey });
    let responseText: string | undefined;
    let lastError: unknown;
    for (const model of ['gemini-3.1-flash-lite', 'gemini-2.5-flash']) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              { inlineData: { mimeType, data: cleanBase64 } },
              { text: 'Lee el horario de la imagen y devuelve los eventos en el formato solicitado.' },
            ],
          },
          config: {
            systemInstruction: prompt,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
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
      } catch (error) {
        lastError = error;
        console.error(`Falló el análisis con ${model}:`, error);
      }
    }
    if (!responseText) throw lastError || new Error('La IA no devolvió resultados.');
    return json(200, JSON.parse(responseText));
  } catch (error) {
    console.error('Error en la función de análisis del horario:', error);
    return json(500, { error: 'No se pudo analizar la imagen. Comprueba la clave de Gemini e inténtalo de nuevo.' });
  }
};
