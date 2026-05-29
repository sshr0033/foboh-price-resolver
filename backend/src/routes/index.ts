import { Router } from 'express';
import {
  getProductsHandler,
  getProductHandler,
} from '../controllers/products.controller.js';
import { getCustomersHandler } from '../controllers/customers.controller.js';
import { getGroupsHandler } from '../controllers/customer-groups.controller.js';
import {
  createProfileHandler,
  deleteProfileHandler,
  getProfileHandler,
  listProfilesHandler,
  patchProfileHandler,
} from '../controllers/profiles.controller.js';
import { previewHandler, resolveHandler } from '../controllers/pricing.controller.js';

export const apiRouter: Router = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});

apiRouter.get('/products', getProductsHandler);
apiRouter.get('/products/:id', getProductHandler);

apiRouter.get('/customers', getCustomersHandler);
apiRouter.get('/customer-groups', getGroupsHandler);

apiRouter.get('/pricing-profiles', listProfilesHandler);
apiRouter.get('/pricing-profiles/:id', getProfileHandler);
apiRouter.post('/pricing-profiles', createProfileHandler);
apiRouter.patch('/pricing-profiles/:id', patchProfileHandler);
apiRouter.delete('/pricing-profiles/:id', deleteProfileHandler);

apiRouter.post('/pricing/preview', previewHandler);
apiRouter.get('/pricing/resolve', resolveHandler);
