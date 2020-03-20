import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, Platform, StyleSheet } from 'react-native';
import { is } from 'immutable';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import MapView from '../../common/MapView';
import { isEmpty } from '../../utils/function';
import ScaleView from '../../common/scaleAndroid';

const styles = StyleSheet.create({
  scaleAndroidStyle: {
    position: 'absolute',
    left: 15,
    zIndex: 99,
  },
});

export default class Map extends Component {
  static propTypes = {
    currentMonitor: PropTypes.object.isRequired,
    historyLocation: PropTypes.object.isRequired,
    playIndex: PropTypes.number.isRequired,
    playStatus: PropTypes.string.isRequired,
    speedInSecond: PropTypes.number.isRequired,
    stopLngLat: PropTypes.object,
    fitPolyLineSpan: PropTypes.number.isRequired,
    mapAmplification: PropTypes.array.isRequired,
    mapNarrow: PropTypes.array.isRequired,
    onAddress: PropTypes.func.isRequired,
    baiduMapScalePosition: PropTypes.string.isRequired,
    stopPoints: PropTypes.array.isRequired,
    stopIndex: PropTypes.number.isRequired,
    onStopPointDataEvent: PropTypes.func.isRequired,
    onStopPointIndexEvent: PropTypes.func.isRequired,
  }

  static defaultProps={
    stopLngLat: null,
  }

  constructor(props) {
    super(props);

    const {
      currentMonitor, historyLocation, playIndex, playStatus,
    } = props;
    const locations = this.getLocations(historyLocation, currentMonitor);

    this.state = {
      locations,
      index: playIndex,
      playing: playStatus !== 'paused',
      mapInit: false,
      scaleAndroidValue: null,
      filter: false,
    };
  }

  state={
    locations: null,
    index: 0,
    playing: false,

  }

  componentWillReceiveProps(nextProps) {
    const { currentMonitor, historyLocation } = this.props;
    const {
      currentMonitor: nextMonitor,
      historyLocation: nextHistory,
      playIndex,
      playStatus,

    } = nextProps;
    let { locations } = this.state;

    if (!is(currentMonitor, nextMonitor) || !is(historyLocation, nextHistory)) {
      locations = this.getLocations(nextHistory, nextMonitor);
    }
    this.setState({
      locations,
      index: playIndex,
      playing: playStatus !== 'paused',
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  getLocations(historyLocation, currentMonitor) {
    const locations = [];
    if (isEmpty(historyLocation) || isEmpty(currentMonitor)) {
      return locations;
    }
    const { size } = historyLocation;


    for (let i = 0; i < size; i += 1) {
      const x = historyLocation.get(i);
      const coordinates = bdEncrypt(x.get('longitude'), x.get('latitude'));
      locations.push({
        longitude: coordinates.bdLng,
        latitude: coordinates.bdLat,
        ico: currentMonitor.ico,
        title: currentMonitor.title,
      });
    }

    return locations;
  }

  handleOnAddress=(param) => {
    const { onAddress } = this.props;
    onAddress(param);
  }

  onMapInitFinish() {
    this.setState({ mapInit: true });
    setTimeout(() => {
      this.setState({ filter: true });
    }, 200);
  }

  onMyScale(data) {
    if (Platform.OS === 'android') {
      const arr = data.split(',');
      this.setState({ scaleAndroidValue: arr[0] });
    }
  }

  onStopPointDataEvent = (data) => {
    // console.warn('data', data);
    const { onStopPointDataEvent } = this.props;
    onStopPointDataEvent(data);
  }

  onStopPointIndexEvent = (data) => {
    const { onStopPointIndexEvent } = this.props;
    onStopPointIndexEvent(data);
  }

  render() {
    const {
      speedInSecond,
      stopLngLat,
      fitPolyLineSpan,
      mapAmplification,
      mapNarrow,
      baiduMapScalePosition,
      stopPoints,
      stopIndex,
    } = this.props;
    const {
      locations,
      index,
      playing,
      mapInit,
      scaleAndroidValue,
      filter,
    } = this.state;
    const lnglat = stopLngLat ? [{
      longitude: stopLngLat.bdLng,
      latitude: stopLngLat.bdLat,
    }] : [];

    const arr = baiduMapScalePosition.split('|');
    //  (arr[1]);

    return (
      <View style={{ flex: 1 }}>
        <MapView
          onMapInitFinish={() => { this.onMapInitFinish(); }}
          sportSpeed={speedInSecond}
          sportPath={mapInit ? locations : null}
          sportPathPlay={playing}
          sportIndex={[{ flag: playing.toString(), index: index.toString() }]}
          searchAddress={lnglat}
          fitPolyLineSpan={mapInit ? fitPolyLineSpan : null}
          mapAmplification={mapAmplification}
          mapNarrow={mapNarrow}
          onAddress={(data) => { this.handleOnAddress(data); }}
          baiduMapScalePosition={(mapInit && filter) ? baiduMapScalePosition : null}
          stopPoints={mapInit ? stopPoints : null}
          stopIndex={mapInit ? stopIndex : -1}
          onMyScale={data => this.onMyScale(data)}
          onStopPointDataEvent={(data) => { this.onStopPointDataEvent(data); }}
          onStopPointIndexEvent={(data) => { this.onStopPointIndexEvent(data); }}
        />
        {
          Platform.OS === 'android' ? (
            <View style={[styles.scaleAndroidStyle, { bottom: Math.ceil(arr[1]) - 20 }]}>
              <ScaleView scaleValue={scaleAndroidValue} />
            </View>
          ) : null
        }
      </View>
    );
  }
}