import { AppRegistry, UIManager, YellowBox } from 'react-native';
import App from './App';

if (UIManager.setLayoutAnimationEnabledExperimental) { // 用于LayoutAnimation动画效果
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

YellowBox.ignoreWarnings(['Warning:']);
console.disableYellowBox = true;

AppRegistry.registerComponent('rnProject', () => App);
