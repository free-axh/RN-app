import {
  NetInfo, AppState, Platform, BackAndroid,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import WebsocketUtil from './websocket';
import { toastShow } from './toastUtils';
import { getLocale } from './locales';
import { reset, setMonitor } from './routeCondition';
import { onConnectionChange, removeConnectionChange } from './network';
import { validateClientId, getClientId } from '../server/getData';
import { getLoginAccont, getLoginState, getStorageClientId } from '../server/getStorageData';
import storage from './storage';

let singleSocket = null;
let userToken = null;
let userName = null;
let clientId = null;
let requestFailedState = true;
let userValidateState = false;

/**
 * 手动关闭socket，清空事件
 */
export function closeSingleSocket() {
  // removeConnectionChange();
  NetInfo.removeEventListener(
    'connectionChange',
    handleFirstConnectivityChange,
  );
  AppState.removeEventListener(
    'change',
    handleAppStateChange,
  );
  if (Platform.OS === 'android') {
    BackAndroid.removeEventListener('hardwareBackPress', onBackPressed);
  }
  if (singleSocket !== null) {
    singleSocket.close();
  }
  singleSocket = null;
  userToken = null;
  userName = null;
  clientId = null;
  storage.remove({ key: 'clientId' });
}

function onBackPressed() {
  closeSingleSocket();
}

/**
 * 服务异常
 */
export function serviceError() {
  console.warn('requestFailedState', requestFailedState);

  if (!requestFailedState) {
    requestFailedState = true;
    closeSingleSocket();
    toastShow(getLocale('requestFailed'), { duration: 2000 });
    if (Actions.currentScene !== 'login') {
      setTimeout(() => {
        storage.remove({
          key: 'loginState',
        }).then(() => {
          setMonitor(null);
          reset('login');
        });
      }, 2000);
    }
  }
}

/**
 * 服务器异常导致的服务异常情况
 */
export function serviceConnectError() {
  NetInfo.getConnectionInfo().then((connectionInfo) => {
    if (connectionInfo.type === 'wifi' || connectionInfo.type === 'cellular') {
      requestFailedState = false;
      serviceError();
    }
  });
}

/**
 * token过期处理
 */
export async function tokenOverdue() {
  clientId = await getStorageClientId();
  const userInfo = await getLoginAccont();
  userName = userInfo[0].accont;
  const params = {
    userName,
    clientId,
  };
  if (!userValidateState) {
    validateClientId(params).then((data) => {
      if (data === false) {
        // tokenOverdue();
        socketSuccessEvent();
      } else {
        toastShow(getLocale('longTimeNoOperation'), { duration: 2000 });
        setTimeout(() => {
          storage.remove({
            key: 'loginState',
          }).then(() => {
            setMonitor(null);
            reset('login');
          });
        }, 2000);
      }
    });
    closeSingleSocket();
  }
}

/**
 * socket关闭通知事件
 */
const socketCloseEvent = () => {
  singleSocket = null;
};

/**
 * socket连接成功事件
 */
export const socketSuccessEvent = () => {
  /**
   * 用户登录权限失去后，给出提示并退出到登录页
   */
  toastShow(getLocale('forcedExit'), { duration: 2000 });
  setTimeout(() => {
    storage.remove({
      key: 'loginState',
    }).then(() => {
      setMonitor(null);
      reset('login');
    });
  }, 2000);
  closeSingleSocket();
};

/**
 * 验证客户端id是否过期
 */
function validateClientIdEvent() {
  if (clientId !== null) {
    userValidateState = true;
    const params = {
      userName,
      clientId,
    };

    validateClientId(params).then((data) => {
      if (data === false) {
        // tokenOverdue();
        socketSuccessEvent();
        setTimeout(() => {
          userValidateState = false;
        }, 2000);
      } else {
        userValidateState = false;
      }
    });
  }
}

/**
 * socket初始连接成功
 */
function initSocketSuccess() {
  // validateClientIdEvent();
  getclientIdEvent();
  const headers = { access_token: userToken };
  const requestStrS = {
    desc: {
      MsgId: 40964,
      UserName: userName,
    },
  };
  singleSocket.subscribe(headers, '/user/topic/expire', socketSuccessEvent, '/app/expire', requestStrS);
}

/**
 * 获取客户端id
 */

function getclientIdEvent() {
  const params = {
    userName,
  };
  getClientId(params).then((info) => {
    if (info.success) {
      clientId = info.obj;
      storage.save({
        key: 'clientId',
        data: info.obj,
      });
    }
  });
}

/**
 * 网络监听处理事件
 */
function handleFirstConnectivityChange(connectionInfo) {
  if (connectionInfo.type !== 'none' || connectionInfo.type !== 'unknown') {
    if (singleSocket === null && userToken !== null && userName !== null) {
      // removeConnectionChange();
      NetInfo.removeEventListener(
        'connectionChange',
        handleFirstConnectivityChange,
      );
      AppState.removeEventListener(
        'change',
        handleAppStateChange,
      );
      if (Platform.OS === 'android') {
        BackAndroid.removeEventListener('hardwareBackPress', onBackPressed);
      }
      initSocket(userToken, userName);
    }
  }
}

function handleAppStateChange(nextAppState) {
  if (nextAppState === 'active') {
    setTimeout(() => {
      if (singleSocket === null && userToken !== null && userName !== null) {
        NetInfo.removeEventListener(
          'connectionChange',
          handleFirstConnectivityChange,
        );
        AppState.removeEventListener(
          'change',
          handleAppStateChange,
        );
        if (Platform.OS === 'android') {
          BackAndroid.removeEventListener('hardwareBackPress', onBackPressed);
        }
        initSocket(userToken, userName);
      }
    }, 30);
  }
}

/**
 * 创建单点登录监听socket连接
 */
export function initSocket(token, accont) {
  /**
   * 网络状态变化监听
   */
  requestFailedState = false;

  NetInfo.addEventListener(
    'connectionChange',
    handleFirstConnectivityChange,
  );

  /**
   * app前后台状态监听
   */
  AppState.addEventListener(
    'change',
    handleAppStateChange,
  );

  /**
   * android物理返回键监听
   */
  if (Platform.OS === 'android') {
    BackAndroid.addEventListener('hardwareBackPress', onBackPressed);
  }

  // onConnectionChange((connectionInfo) => {
  //   console.warn('connectionInfo.type', connectionInfo.type);
  //   if (type !== 'none' || type !== 'unknown') {
  //     if (singleSocket === null && userToken !== null && userName !== null) {
  //       removeConnectionChange();
  //       initSocket(userToken, userName);
  //     }
  //   }
  // });
  validateClientIdEvent();

  userToken = token;
  userName = accont;
  const headers = { access_token: token };
  singleSocket = new WebsocketUtil();
  singleSocket.init('/clbs/vehicle', headers, initSocketSuccess, socketCloseEvent);
  // getclientIdEvent();
}

/**
 * app结束进程后重新进入进行socket连接
 */
export async function isSingleSignOnConnected() {
  const state = await getLoginState();
  const userInfo = await getLoginAccont();
  const id = await getStorageClientId();

  userName = userInfo[0].accont;
  userToken = state.token;
  clientId = id;
  // console.warn('userToken', userToken);
  // console.warn('userName', userName);
  if (userToken !== null && userName !== null) {
    initSocket(userToken, userName);
  }
}
