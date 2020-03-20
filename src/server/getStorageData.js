import getStorage from '../utils/getAsyncStorage';

/**
 * 获取所有登录用户信息
 */
export const getLoginAccont = () => getStorage({ key: 'loginAccont' });

/**
 * 当前登录用户名
 */
export const getCurAccont = () => getStorage({ key: 'curAccont' });

/**
 * 登录状态
 */
export const getLoginState = () => getStorage({ key: 'loginState' });

/**
 * 获取语言
 */
export const getAppLang = () => getStorage({ key: '_lang_' });

/**
 * 获取app自定义信息
 */
export const getUserSetting = () => getStorage({ key: 'appSettings' });

/**
 * 当前登录用户报警类型开关配置
 */
export const getCheckAlarmType = () => getStorage({ key: 'checkSwitch' });

/**
 * 当前登录用户清除报警数据时间
 */
export const getClearAlarmTime = () => getStorage({ key: 'clearAlarmTime' });

/**
 * 获取用户进入的最大版本号
 */
export const getMaxLoginVersion = () => getStorage({ key: 'maxLoginVersion' });

/**
 * 获取设备id号
 */
export const getStorageClientId = () => getStorage({ key: 'clientId' });

/**
 * 获取http缓存配置
 */
export const getStorageHttpConfig = () => getStorage({ key: 'httpConfig' });