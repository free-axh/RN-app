import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import Welcome1Png from '../../static/image/welcome1.png';
import Welcome2Png from '../../static/image/welcome2.png';
import Welcome3Png from '../../static/image/welcome3.png';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

const styles = StyleSheet.create({
  fullPage: {
    width: windowWidth,
    height: '100%',
  },
});

class Welcome extends Component {
    static propTypes = {
      onEnter: PropTypes.func.isRequired,
    }


    render() {
      const { onEnter } = this.props;

      return (
        <View style={[styles.fullPage, { backgroundColor: 'black' }]}>
          <ScrollView
            bounces={false}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            horizontal
            style={styles.fullPage}
          >
            <View style={styles.fullPage}>
              <Image source={Welcome1Png} resizeMode="stretch" style={styles.fullPage} />
            </View>
            <View style={styles.fullPage}>
              <Image source={Welcome3Png} resizeMode="stretch" style={styles.fullPage} />
            </View>
            <TouchableOpacity style={styles.fullPage} onPress={onEnter}>
              <Image source={Welcome2Png} resizeMode="stretch" style={styles.fullPage} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
}

export default Welcome;