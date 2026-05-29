import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AdjustmentDirection,
  AdjustmentMode,
  PriceOverride,
} from '../types';

export type WizardState = {
  name: string;
  description: string;
  selectedProductIds: string[];
  filters: {
    q: string;
    subCategory: string;
    segment: string;
    brand: string;
  };
  adjustment: {
    mode: AdjustmentMode;
    direction: AdjustmentDirection;
    value: number;
    useCustomPrice: boolean;
    customPrice: number;
  };
  selectedCustomerIds: string[];
};

const initialState: WizardState = {
  name: '',
  description: '',
  selectedProductIds: [],
  filters: { q: '', subCategory: '', segment: '', brand: '' },
  adjustment: {
    mode: 'DYNAMIC',
    direction: 'DECREASE',
    value: 0,
    useCustomPrice: false,
    customPrice: 0,
  },
  selectedCustomerIds: [],
};

const slice = createSlice({
  name: 'pricingWizard',
  initialState,
  reducers: {
    reset: () => initialState,
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setDescription(state, action: PayloadAction<string>) {
      state.description = action.payload;
    },
    setFilter(
      state,
      action: PayloadAction<{ key: keyof WizardState['filters']; value: string }>,
    ) {
      state.filters[action.payload.key] = action.payload.value;
    },
    toggleProduct(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.selectedProductIds.indexOf(id);
      if (idx >= 0) state.selectedProductIds.splice(idx, 1);
      else state.selectedProductIds.push(id);
    },
    selectAll(state, action: PayloadAction<string[]>) {
      const set = new Set(state.selectedProductIds);
      for (const id of action.payload) set.add(id);
      state.selectedProductIds = Array.from(set);
    },
    deselectAll(state, action: PayloadAction<string[]>) {
      const drop = new Set(action.payload);
      state.selectedProductIds = state.selectedProductIds.filter((id) => !drop.has(id));
    },
    setAdjustmentMode(state, action: PayloadAction<AdjustmentMode>) {
      state.adjustment.mode = action.payload;
    },
    setAdjustmentDirection(state, action: PayloadAction<AdjustmentDirection>) {
      state.adjustment.direction = action.payload;
    },
    setAdjustmentValue(state, action: PayloadAction<number>) {
      state.adjustment.value = action.payload;
    },
    setUseCustomPrice(state, action: PayloadAction<boolean>) {
      state.adjustment.useCustomPrice = action.payload;
    },
    setCustomPrice(state, action: PayloadAction<number>) {
      state.adjustment.customPrice = action.payload;
    },
    setSelectedCustomers(state, action: PayloadAction<string[]>) {
      state.selectedCustomerIds = action.payload;
    },
  },
});

export const {
  reset,
  setName,
  setDescription,
  setFilter,
  toggleProduct,
  selectAll,
  deselectAll,
  setAdjustmentMode,
  setAdjustmentDirection,
  setAdjustmentValue,
  setUseCustomPrice,
  setCustomPrice,
  setSelectedCustomers,
} = slice.actions;

export default slice.reducer;

export function buildPriceOverride(state: WizardState): PriceOverride {
  if (state.adjustment.useCustomPrice) {
    return { type: 'CUSTOM_PRICE', price: state.adjustment.customPrice };
  }
  return {
    type: 'ADJUSTMENT',
    adjustment: {
      mode: state.adjustment.mode,
      direction: state.adjustment.direction,
      value: state.adjustment.value,
    },
  };
}
