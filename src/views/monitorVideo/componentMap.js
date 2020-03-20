import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  StyleSheet,
  View,
  Platform,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import MapView from '../../common/MapView';// 地图
import ScaleView from '../../common/scaleAndroid';

// style
const styles = StyleSheet.create({
  mapBox: {
    flex: 1,
    width: '100%',
    height: 180,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  coverView: {
    flex: 1,
    width: '100%',
    height: 180,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
    backgroundColor: '#fff',
  },
  slide: {
    height: 0,
  },
  slideUp: {
    height: 180,
  },
  map: {
    flex: 1,
  },
  scaleAndroidStyle: {
    position: 'absolute',
    left: 15,
    bottom: 15,
    zIndex: 99,
  },
});

class Map extends Component {
  static propTypes = {
    slideUp: PropTypes.bool.isRequired,
    videoMarker: PropTypes.object.isRequired,
    removeAnnotation: PropTypes.string.isRequired,
    trackingId: PropTypes.string.isRequired,
    mapShow: PropTypes.bool,
  }

  static defaultProps = {
    mapShow: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      pageDet: 'monitorVideo',
      ifMapShow: false,
      baiduMapScalePosition: '15|50',
      mapInit: false,
      loadScale: false,
      scaleAndroidValue: null,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillReceiveProps(nextProps) {
    const { mapShow } = nextProps;
    if (mapShow) {
      this.setState({
        ifMapShow: true,
      });
      setTimeout(() => {
        this.setState({
          loadScale: true,
        });
      }, 400);
    } else {
      setTimeout(() => {
        this.setState({
          ifMapShow: false,
        });
      }, 200);
    }
  }

  mapFinish() {
    this.setState({ mapInit: true });
  }

  onMyScale(data) {
    const arr = data.split(',');
    this.setState({ scaleAndroidValue: arr[0] });
  }

  render() {
    const {
      slideUp, removeAnnotation, trackingId, videoMarker, mapShow,
    } = this.props;
    const isSlideUp = slideUp ? styles.slideUp : null;

    const {
      pageDet,
      ifMapShow,
      baiduMapScalePosition,
      mapInit,
      loadScale,
      scaleAndroidValue,
    } = this.state;

    // console.warn('baiduMapScalePosition', baiduMapScalePosition);

    return (
      <Animatable.View
        duration={300}
        transition="height"
        style={[styles.slide, isSlideUp, !mapShow ? { display: 'none' } : null]}
      >
        <View style={styles.mapBox}>
          {
            Platform.OS === 'ios' || ifMapShow ? (

              <MapView
                style={[styles.map, { height: 0 }]}
                videoMarker={videoMarker}
                delId={removeAnnotation}
                trackingId={trackingId}
                pageDet={pageDet}
                onMapInitFinish={() => this.mapFinish()}
                baiduMapScalePosition={
                  (mapInit && ifMapShow && loadScale) ? baiduMapScalePosition : null
                }
                onMyScale={data => this.onMyScale(data)}
              />
            ) : null
          }
          {
            Platform.OS === 'android' ? (
              <View style={styles.scaleAndroidStyle}>
                <ScaleView scaleValue={scaleAndroidValue} />
              </View>
            ) : null
          }
        </View>
      </Animatable.View>
    );
  }
}

export default Map;