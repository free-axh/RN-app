import { getStorageHttpConfig } from '../server/getStorageData';

const defaultConfig = {
  baseUrl: '192.168.24.142',
  // baseUrl: '192.168.66.13',
  port: '8080',
  realTimeVideoIp: '112.126.64.32',
  videoRequestPort: '7971', // '7971',
  imageWebUrl: 'http://192.168.24.144:8798',
};

const optionConfig = {
  baseUrl: defaultConfig.baseUrl,
  port: defaultConfig.port,
  realTimeVideoIp: defaultConfig.realTimeVideoIp,
  videoRequestPort: defaultConfig.videoRequestPort,
  imageWebUrl: defaultConfig.imageWebUrl,
  ledBillboardState: false,
  version: 20102,
};

export const assemblyUrl = (
  url = defaultConfig.baseUrl,
  rPort = defaultConfig.port,
) => {
  const config = {
    baseUrl: url,
    port: rPort,
  };
  Object.assign(optionConfig, config);
};

export const assemblyVideoPort = (
  vIp = defaultConfig.videoRequestPort,
  vPort = defaultConfig.videoRequestPort,
  imageWebUrl = defaultConfig.imageWebUrl,
) => {
  const config = {
    realTimeVideoIp: vIp,
    videoRequestPort: vPort,
    imageWebUrl,
  };
  Object.assign(optionConfig, config);
};

export const requestConfig = () => optionConfig;

export async function resetHttpConfig() {
  const httpConfig = await getStorageHttpConfig();
  assemblyUrl(httpConfig.baseUrl, httpConfig.port);
  assemblyVideoPort(httpConfig.realTimeVideoIp, httpConfig.videoRequestPort, httpConfig.imageWebUrl);
}
