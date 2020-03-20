import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Switch,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import DatePicker from 'react-native-datepicker';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度


const styles = StyleSheet.create({
  textColor: {
    color: '#333',
    fontSize: 16,
  },
  timeText: {
    color: '#4287ff',
    fontSize: 16,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: windowWidth,
    backgroundColor: '#fff',
    // borderBottomWidth: 1,
    fontWeight: 'bold',
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  leftCont: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeStr: {
    marginLeft: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iosSwitch: {
    position: 'relative',
    top: Platform.OS === 'android' ? 0 : -5,
  },
});
class MsgRemindSwitch extends Component {
    static propTypes = {
      style: PropTypes.shape(styles.container), // 样式
      title: PropTypes.string.isRequired,
      switchChange: PropTypes.func.isRequired,
      value: PropTypes.bool.isRequired,
      msgRemindStart: PropTypes.string, // 开始时间
      msgRemindEnd: PropTypes.string, // 结束时间
      startDateChange: PropTypes.func.isRequired, // 开始时间改变
      endDateChange: PropTypes.func.isRequired, // 结束时间改变
    }

    static defaultProps = {
      style: null,
      msgRemindStart: '00:00',
      msgRemindEnd: '00:00',
    }

    switchChange=(val) => {
      const { switchChange } = this.props;
      switchChange(val);
    }

    startDateChange=(val) => { // 开始时间改变
      const { startDateChange } = this.props;
      startDateChange(val);
    }

    endDateChange=(val) => { // 结束时间改变
      const { endDateChange } = this.props;
      endDateChange(val);
    }

    render() {
      const {
        style, title, value, msgRemindStart, msgRemindEnd,
      } = this.props;
      return (
        <View style={[styles.container, style]}>
          <View style={styles.leftCont}>
            <Text style={styles.textColor}>
              {title}
            </Text>
            <View style={styles.timeStr}>
              <View style={{ position: 'relative' }}>
                <Text style={styles.timeText}>
                  {msgRemindStart}
                </Text>
                <DatePicker
                  style={{ position: 'absolute', width: 40, height: 20 }}
                  date={msgRemindStart}
                  mode="time"
                  placeholder="请选择开始时间"
                  format="HH:mm"
                  // minDate="2016-05-01"
                  // maxDate="2016-06-01"
                  confirmBtnText="确定"
                  cancelBtnText="取消"
                  showIcon={false}
                  is24Hour
                  hideText
                  customStyles={{
                    dateIcon: {
                      position: 'absolute',
                      left: 0,
                      top: 4,
                      marginLeft: 0,
                      display: 'none',
                    },
                    dateInput: {
                    // marginLeft: 36,
                      // borderWidth: 0,
                      color: '#4287ff',
                      fontSize: 20,
                    },
                  // ... You can check the source to find the other keys.
                  }}
                  onDateChange={this.startDateChange}
                />

              </View>

              <Text style={[styles.timeText, { marginHorizontal: 5 }]}>


~
              </Text>
              <View style={{ position: 'relative' }}>
                <Text style={styles.timeText}>
                  {msgRemindEnd}
                </Text>
                <DatePicker
                  style={{ position: 'absolute', width: 40, height: 20 }}
                  date={msgRemindEnd}
                  mode="time"
                  placeholder="请选择开始时间"
                  format="HH:mm"
                  // minDate="2016-05-01"
                  // maxDate="2016-06-01"
                  confirmBtnText="确定"
                  cancelBtnText="取消"
                  showIcon={false}
                  is24Hour
                  hideText
                  customStyles={{
                    dateIcon: {
                      position: 'absolute',
                      left: 0,
                      top: 4,
                      marginLeft: 0,
                      display: 'none',
                    },
                    dateInput: {
                    // marginLeft: 36,
                      // borderWidth: 0,
                      color: '#4287ff',
                      fontSize: 20,
                    },
                  // ... You can check the source to find the other keys.
                  }}
                  onDateChange={this.endDateChange}
                />
              </View>
            </View>
          </View>
          <View style={[{ height: 10 }, styles.iosSwitch]}>
            <Switch
              value={value}
              onTintColor="#3399ff"
              thumbTintColor={Platform.OS === 'android' ? '#fff' : ''}
              onValueChange={this.switchChange}
            />
          </View>
        </View>
      );
    }
}

export default MsgRemindSwitch;
