import { createSlice } from '@reduxjs/toolkit';

interface DownloadState {
  items: any[];
}

const initialState: DownloadState = {
  items: [],
};

const downloadSlice = createSlice({
  name: 'download',
  initialState,
  reducers: {},
});

export default downloadSlice.reducer;
