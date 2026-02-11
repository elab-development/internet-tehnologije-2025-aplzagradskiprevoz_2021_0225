import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stationsRouter from './routes/stanice.js';
import linesRouter from './routes/linije.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/stanice', stationsRouter);
app.use('/linije', linesRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API running on :${port}`);
});
