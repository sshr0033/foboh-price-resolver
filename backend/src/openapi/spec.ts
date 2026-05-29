export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'FOBOH Pricing Profile API',
    version: '1.0.0',
    description:
      'Pricing-profile authoring + customer-specific price resolution for an F&B wholesale supplier.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local' }],
  tags: [
    { name: 'Products' },
    { name: 'Customers' },
    { name: 'Pricing Profiles' },
    { name: 'Pricing' },
    { name: 'System' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
              },
            },
          },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List products',
        parameters: [
          {
            name: 'q',
            in: 'query',
            schema: { type: 'string' },
            description: 'Case-insensitive match on title or SKU',
          },
          { name: 'subCategory', in: 'query', schema: { type: 'string' } },
          { name: 'segment', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          {
            name: 'includeDeleted',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Include soft-deleted products. Defaults to false.',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get a product',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Product' } },
            },
          },
          '404': { $ref: '#/components/responses/Error' },
          '410': { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/api/customers': {
      get: {
        tags: ['Customers'],
        summary: 'List customers',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/customer-groups': {
      get: {
        tags: ['Customers'],
        summary: 'List customer groups',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/CustomerGroup' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/pricing-profiles': {
      get: {
        tags: ['Pricing Profiles'],
        summary: 'List pricing profiles',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['DRAFT', 'ACTIVE'] },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PricingProfile' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Pricing Profiles'],
        summary: 'Create a pricing profile',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PricingProfileInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PricingProfile' } },
            },
          },
          '400': { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/api/pricing-profiles/{id}': {
      get: {
        tags: ['Pricing Profiles'],
        summary: 'Get a profile',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PricingProfile' } },
            },
          },
          '404': { $ref: '#/components/responses/Error' },
        },
      },
      patch: {
        tags: ['Pricing Profiles'],
        summary: 'Patch a profile',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PricingProfileInput' } },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PricingProfile' } },
            },
          },
          '400': { $ref: '#/components/responses/Error' },
          '404': { $ref: '#/components/responses/Error' },
        },
      },
      delete: {
        tags: ['Pricing Profiles'],
        summary: 'Delete a profile',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Deleted' },
          '404': { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/api/pricing/preview': {
      post: {
        tags: ['Pricing'],
        summary: 'Preview prices for a candidate override against a set of products',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productIds', 'priceOverride'],
                properties: {
                  productIds: { type: 'array', items: { type: 'string' } },
                  priceOverride: { $ref: '#/components/schemas/PriceOverride' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          productId: { type: 'string' },
                          basePrice: { type: 'number' },
                          newPrice: { type: 'number' },
                          clamped: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/api/pricing/resolve': {
      get: {
        tags: ['Pricing'],
        summary: 'Resolve the final price a customer pays for a product',
        parameters: [
          { name: 'customerId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'productId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ResolveResult' } },
            },
          },
          '404': { $ref: '#/components/responses/Error' },
          '410': { $ref: '#/components/responses/Error' },
        },
      },
    },
  },
  components: {
    responses: {
      Error: {
        description: 'Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['error'],
              properties: { error: { type: 'string' }, details: {} },
            },
          },
        },
      },
    },
    schemas: {
      Product: {
        type: 'object',
        required: [
          'id',
          'title',
          'sku',
          'brand',
          'subCategory',
          'segment',
          'basePrice',
          'uom',
          'isDeleted',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          sku: { type: 'string' },
          brand: { type: 'string' },
          subCategory: { type: 'string' },
          segment: { type: 'string' },
          basePrice: { type: 'number' },
          uom: { type: 'string' },
          isDeleted: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Customer: {
        type: 'object',
        required: ['id', 'name', 'groupIds'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          groupIds: { type: 'array', items: { type: 'string' } },
        },
      },
      CustomerGroup: {
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
      Adjustment: {
        type: 'object',
        required: ['mode', 'direction', 'value'],
        properties: {
          mode: { type: 'string', enum: ['FIXED', 'DYNAMIC'] },
          direction: { type: 'string', enum: ['INCREASE', 'DECREASE'] },
          value: { type: 'number', minimum: 0 },
        },
      },
      CustomerScope: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'customerId'],
            properties: { type: { const: 'CUSTOMER' }, customerId: { type: 'string' } },
          },
          {
            type: 'object',
            required: ['type', 'groupId'],
            properties: { type: { const: 'GROUP' }, groupId: { type: 'string' } },
          },
          {
            type: 'object',
            required: ['type'],
            properties: { type: { const: 'ALL' } },
          },
        ],
      },
      ProductScope: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'productIds'],
            properties: {
              type: { const: 'PRODUCT_LIST' },
              productIds: { type: 'array', items: { type: 'string' } },
            },
          },
          {
            type: 'object',
            required: ['type', 'filters'],
            properties: {
              type: { const: 'RULE' },
              filters: {
                type: 'object',
                properties: {
                  subCategory: { type: 'string' },
                  brand: { type: 'string' },
                  segment: { type: 'string' },
                },
              },
            },
          },
          {
            type: 'object',
            required: ['type'],
            properties: { type: { const: 'ALL' } },
          },
        ],
      },
      PriceOverride: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'adjustment'],
            properties: {
              type: { const: 'ADJUSTMENT' },
              adjustment: { $ref: '#/components/schemas/Adjustment' },
            },
          },
          {
            type: 'object',
            required: ['type', 'price'],
            properties: {
              type: { const: 'CUSTOM_PRICE' },
              price: { type: 'number', minimum: 0 },
            },
          },
        ],
      },
      PricingProfileInput: {
        type: 'object',
        required: ['name', 'customerScope', 'productScope', 'priceOverride', 'status'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          customerScope: { $ref: '#/components/schemas/CustomerScope' },
          productScope: { $ref: '#/components/schemas/ProductScope' },
          priceOverride: { $ref: '#/components/schemas/PriceOverride' },
          status: { type: 'string', enum: ['DRAFT', 'ACTIVE'] },
        },
      },
      PricingProfile: {
        allOf: [
          { $ref: '#/components/schemas/PricingProfileInput' },
          {
            type: 'object',
            required: ['id', 'createdAt', 'updatedAt'],
            properties: {
              id: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      ResolveResult: {
        type: 'object',
        required: [
          'customerId',
          'productId',
          'basePrice',
          'finalPrice',
          'source',
          'explanation',
          'consideredProfiles',
        ],
        properties: {
          customerId: { type: 'string' },
          productId: { type: 'string' },
          basePrice: { type: 'number' },
          finalPrice: { type: 'number' },
          source: {
            oneOf: [
              { type: 'object', properties: { kind: { const: 'BASE_PRICE' } } },
              {
                type: 'object',
                properties: {
                  kind: { const: 'PROFILE' },
                  profileId: { type: 'string' },
                  profileName: { type: 'string' },
                },
              },
            ],
          },
          explanation: { type: 'string' },
          consideredProfiles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                profileId: { type: 'string' },
                profileName: { type: 'string' },
                customerScore: { type: 'integer' },
                productScore: { type: 'integer' },
                matched: { const: true },
              },
            },
          },
        },
      },
    },
  },
} as const;
