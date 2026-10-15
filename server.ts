import express from 'express';
import { createServer as createViteServer } from 'vite';
import { parseScheduleImagePayload, ScheduleImageError } from './server/parseScheduleImage';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Keep this API for local Express deployments; Netlify uses the same shared parser as a Function.
app.post('/api/ai/parse-schedule-image', async (req, res) => {
  try {
    const result = await parseScheduleImagePayload(req.body);
    return res.json(result);
  } catch (error) {
    console.error('Error en /api/ai/parse-schedule-image:', error);
    if (error instanceof ScheduleImageError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(502).json({ error: 'No se ha podido analizar la imagen. Vuelve a intentarlo.' });
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
