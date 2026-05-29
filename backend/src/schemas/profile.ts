import { z } from 'zod';

const money = z.number().finite().nonnegative();
const percent = z.number().finite().min(0).max(100);

export const adjustmentSchema = z
  .object({
    mode: z.enum(['FIXED', 'DYNAMIC']),
    direction: z.enum(['INCREASE', 'DECREASE']),
    value: z.number().finite().nonnegative(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.mode === 'DYNAMIC' && v.value > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'DYNAMIC value must be 0-100' });
    }
  });

export const customerScopeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CUSTOMER'), customerId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('GROUP'), groupId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('ALL') }).strict(),
]);

export const productScopeSchema = z.discriminatedUnion('type', [
  z
    .object({ type: z.literal('PRODUCT_LIST'), productIds: z.array(z.string().min(1)).min(1) })
    .strict(),
  z
    .object({
      type: z.literal('RULE'),
      filters: z
        .object({
          subCategory: z.string().min(1).optional(),
          brand: z.string().min(1).optional(),
          segment: z.string().min(1).optional(),
        })
        .strict()
        .refine((f) => Object.keys(f).length > 0, { message: 'RULE requires at least one filter' }),
    })
    .strict(),
  z.object({ type: z.literal('ALL') }).strict(),
]);

export const priceOverrideSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ADJUSTMENT'), adjustment: adjustmentSchema }).strict(),
  z.object({ type: z.literal('CUSTOM_PRICE'), price: money }).strict(),
]);

export const profileCreateSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    customerScope: customerScopeSchema,
    productScope: productScopeSchema,
    priceOverride: priceOverrideSchema,
    status: z.enum(['DRAFT', 'ACTIVE']),
  })
  .strict();

export const profilePatchSchema = profileCreateSchema.partial();

export const previewSchema = z
  .object({
    productIds: z.array(z.string().min(1)).min(1),
    priceOverride: priceOverrideSchema,
  })
  .strict();

export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfilePatchInput = z.infer<typeof profilePatchSchema>;
export type PreviewInput = z.infer<typeof previewSchema>;

// keep the percent helper exported so we can reuse it for tests
export { money, percent };
