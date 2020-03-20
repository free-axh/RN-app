import {
  put as sagaPut, call as sagaCall, all, takeEvery, takeLatest, select,
} from 'redux-saga/effects';
import { Actions } from 'react-native-router-flux';
// import { reset } from '../utils/routeCondition';
import storage from '../utils/storage';
import { toastShow } from '../utils/toastUtils';
import { getLocale } from '../utils/locales';
import NetworkModal from '../utils/networkModal';
import { serviceError, tokenOverdue, serviceConnectError } from '../utils/singleSignOn';

export function put(...params) {
  return sagaPut(...params);
}

export function* call(...params) {
  let result = yield sagaCall(...params);

  if (result && result.error) {
    switch (result.error) {
      case 'server_error': // 服务器异常，fetch走到catch中
        // console.warn(1);
        serviceError();
        result = false;
        break;
      case 'request_timeout': // 超时
        if (Actions.currentScene === 'login') {
          toastShow(getLocale('loginTimeoutPrompt'), { duration: 2000 });
        } else if (Actions.currentScene === 'monitorSearch') {
          toastShow(getLocale('queryTimeoutPrompt'), { duration: 2000 });
        } else {
          NetworkModal.show({ type: 'timeout' });
        }
        result = false;
        break;
      case 'unauthorized':
      case 'invalid_token':
        yield storage.remove({
          key: 'loginState',
        });
        if (Actions.currentScene !== 'login') {
          tokenOverdue();
        }
        result = false;
        break;
      case 'network_lose_connected':
        serviceConnectError();
        break;
      default:
        break;
    }
  }
  return result;
}

export {
  takeEvery, takeLatest, all, select,
};