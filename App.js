import React from 'react';
import { Provider } from 'react-redux';
import store from './src/store';
import Navigator from './src/navigator';
import { } from './src/utils/network';
// import './src/utils/storage';

export default () => (
  <Provider store={store}>
    <Navigator />
  </Provider>
);
