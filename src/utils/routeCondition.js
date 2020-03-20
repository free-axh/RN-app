import { Actions } from 'react-native-router-flux';

let conditions = []; // 存储路由页面的条件，下标跟路由页面一一对应
let activeMonitor = null;
let currentSceneCondition = null;
let monitors = null;

export function setMonitors(monitorArr) {
  monitors = monitorArr;
}

export function getMonitors() {
  return monitors;
}

export function isAlreadyExist(id) {
  return monitors.findIndex((item => item.markerId === id)) > -1;
}

export function setMonitor(monitor) {
  activeMonitor = monitor;
}

export function getMonitor() {
  return activeMonitor;
}

export function setCondition(name, condition) {
  conditions.push({
    name,
    condition,
  });
}

export function getCondition() {
  if (conditions.length > 0) {
    return conditions.pop();
  }
  return null;
}

export function go(name, condition, currentCondition) {
  if (name === Actions.currentScene) {
    return;
  }
  currentSceneCondition = { activeMonitor, ...condition };
  setCondition(Actions.currentScene, currentCondition);

  Actions.push(name, currentSceneCondition);
}

export function reset(name, condition) {
  conditions = [];
  currentSceneCondition = { activeMonitor, ...condition };
  Actions.push(name, currentSceneCondition);
}

export function back() {
  const condition = getCondition();

  if (condition !== null) {
    currentSceneCondition = { activeMonitor, ...condition };
    Actions.push(condition.name, { activeMonitor, direction: 'leftToRight', ...condition.condition });
    return true;
  }
  return false;
}

export function refresh() {
  if (currentSceneCondition !== null) {
    Actions.reset(Actions.currentScene, currentSceneCondition);
  } else {
    Actions.reset(Actions.currentScene);
  }
}