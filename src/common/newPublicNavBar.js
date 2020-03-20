// 顶部导航公共组件
import React from 'react';
import {
  Image, View,
  StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { back } from '../utils/routeCondition';
import goBackIco from '../static/image/goBack.png';

const styles = StyleSheet.create({
  leftTouch: {
    padding: 15,
  },
  leftIcon: {
    width: 10,
    height: 20,
  },
});

const StackOptions = (navigation, title, rightView) => {
  const headerTitle = title;
  const headerStyle = {
    elevation: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: 'black',
    shadowOpacity: 0, // 透明度
    shadowRadius: 0,
    borderWidth: 0,
    borderBottomColor: '#339eff',
    backgroundColor: '#339eff',
  };

  if (Platform.OS !== 'ios') {
    headerStyle.height = 75;
    headerStyle.paddingTop = 20;
  }

  const headerTitleStyle = {
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  };
  const headerBackTitle = false;
  const { isShowLeft } = navigation.state.params;
  const headerLeft = isShowLeft ? <View /> : (
    <TouchableOpacity
      style={styles.leftTouch}
      onPress={() => {
        back();
      }}
    >
      <Image
        style={styles.leftIcon}
        source={goBackIco}
      />
    </TouchableOpacity>
  );
  let headerRight = null;
  if (rightView !== null) {
    headerRight = rightView || <View />;
  }
  const { isShowHeader } = navigation.state.params;// 用于控制是否显示标题
  if (isShowHeader !== undefined && !isShowHeader) {
    return {
      header: null,
    };
  }
  return {
    headerStyle, headerTitle, headerTitleStyle, headerBackTitle, headerLeft, headerRight,
  };
};

export default StackOptions;