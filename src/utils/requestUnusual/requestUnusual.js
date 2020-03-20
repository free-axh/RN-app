import { NetInfo } from 'react-native';

let isNetworkConnected = null;

const connectionChangeEvent = (connectionInfo) => {
  const { type, effectiveType } = connectionInfo;
  if (type === 'none' || type === 'unknown' || effectiveType === 'unknown') {
    // 网络异常弹窗提示
    isNetworkConnected = false;
  } else {
    // 执行刚才中断的action
    if (isNetworkConnected === false) {
      isNetworkConnected = true;
    }
  }
};

/**
 * 监听网络变化情况
 */
NetInfo.addEventListener(
  'connectionChange',
  (connectionInfo) => {
    connectionChangeEvent(connectionInfo);
  },
);

/**
 * 获取当前网络状况
 */
export const getConnectionInfo = () => new Promise((resolve) => {
  NetInfo.getConnectionInfo().then((connectionInfo) => {
    const { type, effectiveType } = connectionInfo;
    if (type === 'none' || type === 'unknown' || effectiveType === 'unknown') {
      resolve(true);
    } else {
      resolve(true);
    }
  });
});

/**
 *  判断当前设备是否联网
 */
export const isConnected = () => NetInfo.isConnected.fetch();