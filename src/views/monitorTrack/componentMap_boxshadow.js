import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';

// import { BoxShadow } from 'react-native-shadow';
import MapView from '../../common/baiduAndroidMapView';
import mapIcon1 from '../../static/image/mapIcon1.png';
import mapIcon2 from '../../static/image/mapIcon2.png';
import mapIcon3 from '../../static/image/mapIcon3.png';
import mapIcon4 from '../../static/image/mapIcon4.png';
import mapIcon5 from '../../static/image/mapIcon5.png';
import mapIcon6 from '../../static/image/mapIcon6.png';
import mapIcon7 from '../../static/image/mapIcon7.png';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapIcon: {
    width: 40,
    height: 40,
    position: 'absolute',
    backgroundColor: '#fff',
    zIndex: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon_right: {
    right: 5,
  },
  mapIcon_left: {
    left: 5,
  },
});

class Map extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    // const shadowOpt = {
    //   width: 42,
    //   height: 42,
    //   color: '#EEEEEE',
    //   border: 1,
    //   radius: 21,
    //   opacity: 0.7,
    //   x: 0,
    //   y: 1,
    //   style: {
    //     position: 'absolute',
    //   },
    // };

    return (
      <View
        style={styles.container}
      >
        {/* 地图 start */}
        <MapView style={{ width: '100%', height: '100%' }} />
        {/* 地图 end */}

        {/* 工具图标 start */}
        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 20 }]}
        >
          <Image
            source={mapIcon5}
            style={{ width: 30, height: 30 }}
          />
        </TouchableOpacity>

        {/* <BoxShadow
          setting={shadowOpt}
          style={[styles.mapIcon_right, { top: 20 }]}
        >
          <TouchableOpacity
            style={styles.mapIcon}
          >
            <Image
              source={mapIcon5}
              style={{ width: 26, height: 11 }}
            />
          </TouchableOpacity>
        </BoxShadow> */}

        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 65 }]}
        >
          <Image
            source={mapIcon1}
            style={{ width: 21, height: 16 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 110 }]}
        >
          <Image
            source={mapIcon4}
            style={{ width: 20, height: 22 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 205 }]}
        >
          <Image
            source={mapIcon3}
            style={{ width: 19, height: 19 }}
          />
        </TouchableOpacity>

        {/* 放大缩小 */}
        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 250 }]}
        >
          <Image
            source={mapIcon7}
            style={{ width: 17, height: 2 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 205 }]}
        >
          <Image
            source={mapIcon3}
            style={{ width: 19, height: 19 }}
          />
        </TouchableOpacity>

        {/* 定位 */}
        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_left, { bottom: 65 }]}
        >
          <Image
            source={mapIcon6}
            style={{ width: 22, height: 26 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_left, { bottom: 20 }]}
        >
          <Image
            source={mapIcon2}
            style={{ width: 24, height: 24 }}
          />
        </TouchableOpacity>
        {/* 工具图标 end */}
      </View>
    );
  }
}

export default Map;