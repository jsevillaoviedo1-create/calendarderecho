import { GoogleGenAI, Type } from '@google/genai';

export interface ParsedEventItem {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  category?: string;
  description?: string;
}

export interface ParseScheduleResult {
  success: boolean;
  notes?: string;
  events: ParsedEventItem[];
}

export function getStoredGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('gemini_api_key') ||
    localStorage.getItem('VITE_GEMINI_API_KEY') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    null
  );
}

export function setStoredGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem('gemini_api_key');
  } else {
    localStorage.setItem('gemini_api_key', key.trim());
  }
}

export async function parseScheduleImageWithFallback(options: {
  imageBase64: string;
  mimeType?: string;
  currentYear?: number;
  availableCategories?: string[];
  customApiKey?: string;
}): Promise<ParseScheduleResult> {
  const {
    imageBase64,
    mimeType = 'image/jpeg',
    currentYear = new Date().getFullYear(),
    availableCategories = [],
    customApiKey,
  } = options;

  let cleanBase64 = imageBase64;
  let detectedMime = mimeType;
  const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    detectedMime = match[1];
    cleanBase64 = match[2];
  } else {
    cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
  }

  const effectiveClientKey = customApiKey || getStoredGeminiApiKey() || '';

  const payload = {
    imageBase64,
    mimeType: detectedMime,
    currentYear,
    availableCategories,
    apiKey: effectiveClientKey || undefined,
  };

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (effectiveClientKey) {
    reqHeaders['x-gemini-api-key'] = effectiveClientKey;
  }

  let serverErrorMessage = '';

  // 1. Try local/fullstack backend /api/ai/parse-schedule-image
  try {
    const res = await fetch('/api/ai/parse-schedule-image', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && Array.isArray(data.events)) {
        return data;
      }
    } else if (contentType.includes('application/json')) {
      const errData = await res.json();
      if (errData?.error) {
        serverErrorMessage = errData.error;
      }
    }
  } catch (e: any) {
    console.warn('Fallo en endpoint /api/ai/parse-schedule-image, probando alternativas...', e?.message || e);
  }

  // 2. Try Netlify Functions if deployed on Netlify
  try {
    const res = await fetch('/.netlify/functions/parse-schedule-image', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && Array.isArray(data.events)) {
        return data;
      }
    } else if (contentType.includes('application/json')) {
      const errData = await res.json();
      if (errData?.error) {
        serverErrorMessage = errData.error;
      }
    }
  } catch (e: any) {
    console.warn('Fallo en endpoint Netlify Functions...', e?.message || e);
  }

  // 3. Client-side execution with @google/genai if API key is provided
  if (effectiveClientKey && effectiveClientKey.length > 10) {
    try {
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

      const ai = new GoogleGenAI({ apiKey: effectiveClientKey });
      const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

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
            return JSON.parse(response.text);
          }
        } catch (mErr: any) {
          console.warn(`Error probando modelo ${model} en cliente:`, mErr?.message || mErr);
        }
      }
    } catch (e: any) {
      console.warn('Error en ejecución directa de Gemini en cliente', e?.message || e);
    }
  }

  if (serverErrorMessage) {
    // If error contains raw JSON error, extract a clean readable explanation
    try {
      const parsed = JSON.parse(serverErrorMessage);
      if (parsed?.error?.message) {
        throw new Error(`Error de IA: ${parsed.error.message}`);
      }
    } catch {}
    throw new Error(serverErrorMessage);
  }

  throw new Error(
    'No se pudo conectar con el servicio de IA de Gemini. Si estás usando la app en móvil o sin servidor local, puedes introducir tu clave personal de Gemini en la configuración del escáner.'
  );
}
