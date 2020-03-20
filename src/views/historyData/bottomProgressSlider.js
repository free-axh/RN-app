import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Slider,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { isEmpty } from '../../utils/function';
import StopBar from './bottomProgressStopBar';

const styles = StyleSheet.create({
  line: {
    flex: 1,
  },
  slider: {
    padding: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'ios' ? -7 : 3,
    zIndex: 111,
  },
  stopBar: {
    marginTop: -5,
  },
});


export default class BottomProgressSlider extends Component {
    static propTypes = {
      changeEventSource: PropTypes.string,
      playIndex: PropTypes.number,
      size: PropTypes.number,
      stopData: PropTypes.object,
      onSliderChange: PropTypes.func.isRequired,
      onSliderComplete: PropTypes.func.isRequired,
    }

    static defaultProps = {
      changeEventSource: null,
      stopData: null,
      playIndex: 0,
      size: 0,
    }

    constructor(props) {
      super(props);
      this.throttleSliderChange = throttle(this.doSliderChange, 200);
    }

    shouldComponentUpdate(nextProps) {
      if (nextProps.changeEventSource === 'slider') {
        return false;
      }
      return true;
    }

    doSliderChange=(value) => {
      const { onSliderChange, size } = this.props;
      if (value > size - 1) {
        return;
      }
      onSliderChange(value);
    }

    handleSliderChange=(value) => {
      this.throttleSliderChange(value);
    }

    handleSlidingComplete=(value) => {
      const { onSliderComplete, size } = this.props;
      if (value > size - 1) {
        return;
      }
      onSliderComplete(value);
    }

    render() {
      const {
        playIndex, size, stopData,
      } = this.props;
      const max = size > 1 ? size - 1 : 0;
      // console.warn('playIndex:', playIndex, ' size:', size, ' max:', max);

      return (


        <View style={styles.line}>
          {
            // max > 0 ? (
            <Slider
              key={playIndex}
              disabled={size <= 1}
              style={styles.slider}
              maximumTrackTintColor={isEmpty(stopData) ? '#5c5c5c' : 'transparent'}
              minimumTrackTintColor={isEmpty(stopData) ? '#8e8e93' : 'transparent'}
              thumbTintColor="#2a8be9"
              minimumValue={0}
              value={playIndex}
              step={size > 1 ? 1 : 0}
              maximumValue={max}
              onValueChange={this.handleSliderChange}
              onSlidingComplete={this.handleSlidingComplete}
            />
            // ) : null
          }
          <StopBar
            style={styles.stopBar}
            stopData={stopData}
          />
        </View>

      );
    }
}