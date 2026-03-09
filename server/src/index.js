import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stationsRouter from './routes/stanice.js';
import linesRouter from './routes/linije.js';
import authRouter from './routes/auth.js';
import vozacRouter from './routes/vozac.js';
import { osigurajPreddefinisaneVozace } from './repositories/authRepo.js';
import { buildOpenApiSpec, buildSwaggerUiHtml } from './openapi.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/openapi.json', (req, res) => {
  const spec = buildOpenApiSpec(`${req.protocol}://${req.get('host')}`);
  res.json(spec);
});

app.get('/docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(buildSwaggerUiHtml('/openapi.json'));
});

app.use('/stanice', stationsRouter);
app.use('/linije', linesRouter);
app.use('/auth', authRouter);
app.use('/vozac', vozacRouter);

const port = Number(process.env.PORT || 4000);
osigurajPreddefinisaneVozace()
  .catch((err) => {
    console.error('Neuspesna inicijalizacija vozaca', err);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`API running on :${port}`);
    });
  });
