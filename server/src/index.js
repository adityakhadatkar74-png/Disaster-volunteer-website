import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import disastersRouter from './routes/disasters.js';
import resourcesRouter from './routes/resources.js';
import tasksRouter from './routes/tasks.js';
import usersRouter from './routes/users.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'disaster-platform-api' });
});

app.use('/api/users', usersRouter);
app.use('/api/disasters', disastersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/resources', resourcesRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Disaster platform API running on http://localhost:${port}`);
});

