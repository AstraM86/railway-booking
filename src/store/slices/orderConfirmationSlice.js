import { createSlice } from '@reduxjs/toolkit';

import { postOrder } from '../thunks/asyncThunks';

const initialState = {
   response: null,
   loading: false,
   error: null,
};

const orderConfirmationSlice = createSlice({
   name: 'orderConfirmationSlice',
   initialState,
   reducers: {
      removeOrderConfirmationData() {
         return initialState;
      },
   },
   extraReducers: (builder) => {
   builder
      .addCase(postOrder.pending, (state) => {
         state.loading = true;
         state.error = null;
      })
      .addCase(postOrder.fulfilled, (state, action) => {
         state.loading = false;
         state.error = null;
         state.response = action.payload;
      })
      .addCase(postOrder.rejected, (state, action) => {
         state.loading = false;
         state.error = action.payload;
      });
   },
});

export const { removeOrderConfirmationData } = orderConfirmationSlice.actions;

export const selectResponse = (state) => state.orderConfirmation.response;
export const selectLoading = (state) => state.orderConfirmation.loading;
export const selectError = (state) => state.orderConfirmation.error;

export default orderConfirmationSlice;