import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { openApiSpec } from './openapi/spec.js';

const PORT = 4000;
const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use('/api', apiRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  process.stdout.write(`FOBOH pricing API listening on http://localhost:${PORT}\n`);
  process.stdout.write(`Swagger UI: http://localhost:${PORT}/api/docs\n`);
});
