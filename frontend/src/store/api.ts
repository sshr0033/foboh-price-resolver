import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Customer,
  CustomerGroup,
  Listed,
  PreviewLine,
  PriceOverride,
  PricingProfile,
  Product,
  ProfileStatus,
  ResolveResult,
} from '../types';

export type ProductsQueryArgs = {
  q?: string;
  subCategory?: string;
  segment?: string;
  brand?: string;
};

export type ProfileCreateBody = Omit<PricingProfile, 'id' | 'createdAt' | 'updatedAt'>;
export type ProfileUpdateBody = Partial<ProfileCreateBody>;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:4000/api' }),
  tagTypes: ['Products', 'Profiles', 'Customers', 'Groups'],
  endpoints: (build) => ({
    listProducts: build.query<Listed<Product>, ProductsQueryArgs>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args.q) params.set('q', args.q);
        if (args.subCategory) params.set('subCategory', args.subCategory);
        if (args.segment) params.set('segment', args.segment);
        if (args.brand) params.set('brand', args.brand);
        const qs = params.toString();
        return `/products${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Products'],
    }),
    listCustomers: build.query<Listed<Customer>, void>({
      query: () => '/customers',
      providesTags: ['Customers'],
    }),
    listGroups: build.query<Listed<CustomerGroup>, void>({
      query: () => '/customer-groups',
      providesTags: ['Groups'],
    }),
    listProfiles: build.query<Listed<PricingProfile>, { status?: ProfileStatus } | void>({
      query: (args) => {
        const status = args?.status;
        return status ? `/pricing-profiles?status=${status}` : '/pricing-profiles';
      },
      providesTags: ['Profiles'],
    }),
    createProfile: build.mutation<PricingProfile, ProfileCreateBody>({
      query: (body) => ({ url: '/pricing-profiles', method: 'POST', body }),
      invalidatesTags: ['Profiles'],
    }),
    updateProfile: build.mutation<
      PricingProfile,
      { id: string; patch: ProfileUpdateBody }
    >({
      query: ({ id, patch }) => ({
        url: `/pricing-profiles/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Profiles'],
    }),
    deleteProfile: build.mutation<string, { id: string }>({
      // Backend returns 204 with no body; tell RTK Query to read it as text
      // (the default JSON handler would throw on an empty body).
      query: ({ id }) => ({
        url: `/pricing-profiles/${id}`,
        method: 'DELETE',
        responseHandler: 'text',
      }),
      invalidatesTags: ['Profiles'],
    }),
    previewPrices: build.query<
      Listed<PreviewLine>,
      { productIds: string[]; priceOverride: PriceOverride }
    >({
      query: (body) => ({ url: '/pricing/preview', method: 'POST', body }),
    }),
    resolvePrice: build.query<ResolveResult, { customerId: string; productId: string }>({
      query: ({ customerId, productId }) =>
        `/pricing/resolve?customerId=${encodeURIComponent(customerId)}&productId=${encodeURIComponent(productId)}`,
    }),
  }),
});

export const {
  useListProductsQuery,
  useListCustomersQuery,
  useListGroupsQuery,
  useListProfilesQuery,
  useCreateProfileMutation,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  usePreviewPricesQuery,
  useResolvePriceQuery,
  useLazyResolvePriceQuery,
} = api;
