import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import ScaleView from '../../common/scaleAndroid';

import MapView from '../../common/MapView';// 地图

import mapIcon1 from '../../static/image/mapIcon1.png';
// import mapIcon2 from '../../static/image/mapIcon2.png';
import mapIcon3 from '../../static/image/mapIcon3.png';
// import mapIcon4 from '../../static/image/mapIcon4.png';
import mapIcon5 from '../../static/image/mapIcon5.png';
// import mapIcon6 from '../../static/image/mapIcon6.png';
import mapIcon7 from '../../static/image/mapIcon7.png';
import trafficEnabledDefaultImage from '../../static/image/trafficEnabled-default.png';
import mapTypeFocusImage from '../../static/image/mapType-focus.png';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapIcon: {
    position: 'absolute',
    zIndex: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ico: {
    width: 40,
    height: 40,
  },
  mapIcon_right: {
    right: 5,
  },
  mapIcon_left: {
    left: 5,
  },
  scaleAndroidStyle: {
    position: 'absolute',
    left: 65,
    zIndex: 99,
  },
});

class MapComponent extends Component {
  static propTypes = {
    // markers: PropTypes.object,
    realTimeWake: PropTypes.bool,
    onMapInitFinish: PropTypes.func,
    wakeData: PropTypes.array,
    wakeCurrentLocation: PropTypes.bool,
    wakeTargetLocation: PropTypes.bool,
    baiduMapScalePosition: PropTypes.string,
    goLatestPoin: PropTypes.array,
  }

  // 属性默认值
  static defaultProps ={
    // markers: new Map(),
    realTimeWake: true,
    onMapInitFinish: null,
    wakeData: null,
    wakeCurrentLocation: null,
    wakeTargetLocation: null,
    baiduMapScalePosition: null,
    goLatestPoin: null,
  }

  constructor() {
    super();
    this.state = {
      trafficEnabled: false,
      bMapType: 1,
      mapAmplification: null,
      mapNarrow: null,
      scaleAndroidValue: null,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 地图路况切换
  trafficEnabledChange() {
    const { trafficEnabled } = this.state;
    this.setState({
      trafficEnabled: !trafficEnabled,
    });
  }

  // 地图类型切换
  bMapTypeChange() {
    const { bMapType } = this.state;
    this.setState({
      bMapType: bMapType === 1 ? 2 : 1,
    });
  }

  // 地图放大按钮点击
  mapAmplificationClick() {
    const {
      mapAmplification,
    } = this.state;
    let value;
    if (mapAmplification === null) {
      value = [{
        type: 'big',
        index: 0,
      }];
    } else {
      value = [
        {
          type: 'big',
          index: mapAmplification[0].index + 1,
        },
      ];
    }
    // mapAmplificationChange(value);
    this.setState({ mapAmplification: value });
  }

  // 地图缩小按钮点击
  mapNarrowClick() {
    const {
      mapNarrow,
    } = this.state;
    let value;
    if (mapNarrow === null) {
      value = [{
        type: 'small',
        index: 0,
      }];
    } else {
      value = [
        {
          type: 'small',
          index: mapNarrow[0].index + 1,
        },
      ];
    }
    // mapNarrowChange(value);
    this.setState({ mapNarrow: value });
  }

  onMyScale(data) {
    const arr = data.split(',');
    this.setState({ scaleAndroidValue: arr[0] });
  }

  render() {
    const {
      // markers,
      wakeData,
      realTimeWake,
      onMapInitFinish,
      wakeCurrentLocation,
      wakeTargetLocation,
      baiduMapScalePosition,
      goLatestPoin,
    } = this.props;

    const {
      trafficEnabled,
      bMapType,
      mapAmplification,
      mapNarrow,
      scaleAndroidValue,
    } = this.state;

    const compassOpenState = true;

    // console.warn(baiduMapScalePosition);
    const scaleHeight = baiduMapScalePosition === null ? [0, 0] : baiduMapScalePosition.split('|');

    return (
      <View
        style={styles.container}
      >
        {/* 地图 start */}
        <MapView
          style={styles.container}
          // markers={markers}
          wakeData={wakeData}
          realTimeWake={realTimeWake}
          onMapInitFinish={() => onMapInitFinish()}
          trafficEnabled={trafficEnabled}
          bMapType={bMapType}
          mapAmplification={mapAmplification}
          mapNarrow={mapNarrow}
          wakeCurrentLocation={wakeCurrentLocation}
          wakeTargetLocation={wakeTargetLocation}
          compassOpenState={compassOpenState}
          baiduMapScalePosition={baiduMapScalePosition}
          onMyScale={data => this.onMyScale(data)}
          goLatestPoin={goLatestPoin}
        />
        {/* 地图 end */}

        {/* 工具图标 start */}
        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 20 }]}
          onPress={() => this.trafficEnabledChange()}
        >
          <Image
            source={trafficEnabled ? mapIcon5 : trafficEnabledDefaultImage}
            style={styles.ico}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 65 }]}
          onPress={() => this.bMapTypeChange()}
        >
          <Image
            source={bMapType === 1 ? mapIcon1 : mapTypeFocusImage}
            style={styles.ico}
          />
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 110 }]}
        >
          <Image
            source={mapIcon4}
            style={styles.ico}
          />
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 205 }]}
          onPress={() => this.mapAmplificationClick()}
        >
          <Image
            source={mapIcon3}
            style={styles.ico}
          />
        </TouchableOpacity>

        {/* 放大缩小 */}
        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 250 }]}
          onPress={() => this.mapNarrowClick()}
        >
          <Image
            source={mapIcon7}
            style={styles.ico}
          />
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 205 }]}
          onPress={() => { alert(1) }}
        >
          <Image
            source={mapIcon3}
            style={styles.ico}
          />
        </TouchableOpacity> */}
        {
          Platform.OS === 'android' ? (
            <View style={[styles.scaleAndroidStyle, { bottom: Math.ceil(scaleHeight[1]) - 20 }]}>
              <ScaleView scaleValue={scaleAndroidValue} />
            </View>
          ) : null
        }
      </View>
    );
  }
}

export default MapComponent;