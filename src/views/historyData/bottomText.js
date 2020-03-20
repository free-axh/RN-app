import React, { Component } from 'react';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
} from 'react-native';
import * as timeFormat from 'd3-time-format';
import { getLocale } from '../../utils/locales';

const timeFormator = timeFormat.timeFormat('%m-%d %H:%M:%S');
const styles = StyleSheet.create({

  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer2: {
    flexDirection: 'row',
  },
  text: {
    color: '#333333',
    height: 22,
    fontSize: 12,
  },
  speedText: {
    fontSize: 14,
    color: '#2a8be9',
  },
  unit: {
    fontStyle: 'italic',
  },
});

class BottomText extends Component {
    static propTypes = {
      locationInfo: PropTypes.object,
      startMileage: PropTypes.number,
      endMileage: PropTypes.number,
      stopAddress: PropTypes.string.isRequired,
    }

    static defaultProps={
      locationInfo: {},
      startMileage: 0,
      endMileage: 0,
    }

    shouldComponentUpdate(nextProps, nextState) {
      return !is(this.props, nextProps) || !is(this.state, nextState);
    }

    render() {
      const {
        locationInfo,
        startMileage,
        endMileage,
        stopAddress,
      } = this.props;
      let time = '';
      let speed = 0;
      let address = '';

      if (locationInfo !== null) {
        const now = new Date();
        now.setTime(locationInfo.get('time') * 1000);
        time = timeFormator(now);
        speed = locationInfo.get('speed');
        address = stopAddress;
      }
      speed = `${speed}`;
      return (
        <View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              <Text>
                {time}
              </Text>
            </Text>
            <Text style={styles.text}>
              <Text style={styles.speedText}>
                {speed}
              </Text>
              <Text style={styles.unit}>
                {' km/h'}
              </Text>
            </Text>
            <Text style={styles.text}>
              <Text style={styles.speedText}>
                {startMileage}
              </Text>
              <Text>/</Text>
              <Text style={styles.speedText}>
                {endMileage}
              </Text>
              <Text style={styles.unit}>
                {' km'}
              </Text>
            </Text>
          </View>
          <View style={styles.textContainer2}>
            <Text
              // allowFontScaling={false}
              style={[styles.text, { width: 38 }]}
            >
              {getLocale('location')}：

            </Text>
            {/* <Text style={[styles.text, { flex: 1 }]}>
              {address}
            </Text> */}
            <ScrollView horizontal>
              <View>
                <Text
                  // allowFontScaling={false}
                  style={styles.text}
                >
                  {address}
                </Text>

              </View>
            </ScrollView>
          </View>

        </View>
      );
    }
}

export default BottomText;