import express from 'express';
import cors from 'cors';
import routes from './routes';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api', routes);

const port = process.env.PORT ? Number(process.env.PORT) : 5001;
app.listen(port, () => {
  console.log(`Local API server listening on http://127.0.0.1:${port}/api`);
});
