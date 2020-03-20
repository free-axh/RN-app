import React, { Component } from 'react';
import { is } from 'immutable';
import {
  StyleSheet, Image, TouchableOpacity, View, Platform,
} from 'react-native';
import { ifIphoneX } from 'react-native-iphone-x-helper';
import { back } from '../../utils/routeCondition';
// import LinearGradient from 'react-native-linear-gradient';
import SearchInput from './componentSearchInput';
import goBack from '../../static/image/goBack.png';

const ifAndroid = (obj) => {
  if (Platform.OS !== 'ios') {
    return obj;
  }
  return {};
};

// style
const styles = StyleSheet.create({
  container: {
    paddingRight: 15,
    paddingVertical: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#339eff',
    ...ifIphoneX(
      {
        paddingTop: 54,
      },
    ),
    ...ifAndroid({
      height: 75,
      paddingTop: 40,
    }),
  },
  back: {
    paddingHorizontal: 15,
  },
  backIcon: {
    width: 10,
    height: 20,
  },
});

class NavBar extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    return (
    // <LinearGradient
    //   colors={['#33BBFF', '#33aeff', '#339eff', '#3399ff']}
    //   start={{ x: 0, y: 0 }}
    //   end={{ x: 1, y: 1 }}
    //   style={styles.container}
    // >

      <View
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.back}
          onPress={() => back()}
        >
          <Image
            style={styles.backIcon}
            source={goBack}
          />
        </TouchableOpacity>

        <SearchInput />
      </View>

    // </LinearGradient>
    );
  }
}

export default NavBar;