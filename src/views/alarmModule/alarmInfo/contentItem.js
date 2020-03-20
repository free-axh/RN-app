// 报警信息时间轴内容组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as timeFormat from 'd3-time-format';// 时间格式转换

// import { Actions } from 'react-native-router-flux';
import { go, isAlreadyExist } from '../../../utils/routeCondition';
import { getLocale } from '../../../utils/locales';
import histroy from '../../../static/image/histroy.png';
import timeIco from '../../../static/image/time.png';
import weiIco from '../../../static/image/wei.png';
import valueIco from '../../../static/image/value.png';

// const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
const shortFormator = timeFormat.timeFormat('%H:%M:%S');

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 50,
    paddingRight: 10,
  },
  // 时间轴左侧小圆
  circle: {
    position: 'absolute',
    width: 7,
    height: 7,
    left: 27,
    // left:-23,
    top: 30,
    zIndex: 1,
    borderRadius: 11,
    backgroundColor: 'rgb(255,131,131)',
  },
  // 时间轴左侧线条
  leftLine: {
    position: 'absolute',
    width: 1,
    left: 30,
    top: 0,
    bottom: 0,
    // height: '100%',
    backgroundColor: 'rgb(160,160,160)',
  },
  itemStyle: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  statusBox: {
    position: 'absolute',
    // width: 40,
    height: 20,
    top: 10,
    right: 20,
    zIndex: 1,
  },
  statusYes: {
    fontSize: 12,
    textAlign: 'right',
    color: 'rgb(193,193,193)',
  },
  statusNo: {
    fontSize: 12,
    textAlign: 'right',
    color: 'rgb(255,131,131)',
  },
  itemHeader: {
    color: 'rgb(51,51,51)',
    fontSize: 16,
  },
  textBox: {
    flex: 1,
    marginLeft: 5,
    fontSize: 14,
    color: 'rgb(86,86,86)',
  },
  rowBox: {
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  useIcon: {
    width: 16,
    height: 16,
  },
  valueBox: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  histroyBox: {
    // flex: 1,
    // width: 100,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  histroyInfo: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderStyle: 'solid',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  histroyIcon: {
    width: 12,
    height: 12,
    marginTop: 1,
    marginRight: 5,
  },
});

class ContentItem extends Component {
  static propTypes = {
    item: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      alarmStarTime: PropTypes.string,
      alarmEndTime: PropTypes.string,
      address: PropTypes.string,
      alarmValue: PropTypes.string,
    })).isRequired,
    curAlarmObj: PropTypes.object.isRequired,
    addMonitor: PropTypes.func.isRequired,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 跳转至历史数据界面
  goHistroy=(endTime) => {
    const { curAlarmObj, addMonitor } = this.props;
    const num = 1000 * 60 * 10;
    let sTime;
    let eTime = endTime;
    const nowTime = (new Date()).getTime();
    if (nowTime - eTime < num) {
      sTime = nowTime - 2 * num;
      eTime = nowTime;
    } else {
      sTime = eTime - num;
      eTime += num;
    }

    const { id, name } = curAlarmObj;
    const isExist = isAlreadyExist(id);
    console.log('isExist:',isExist)
    if (isExist) {
      go('historyData', {
        activeMonitor: {
          markerId: id,
          title: name,
        },
        startTime: new Date(sTime),
        endTime: new Date(eTime),
      });
      return;
    }
    addMonitor(id, () => {
      setTimeout(() => {
        go('historyData', {
          activeMonitor: {
            markerId: id,
            title: name,
          },
          startTime: new Date(sTime),
          endTime: new Date(eTime),
        });
      }, 800);
    });
  }

  render() {
    const { item } = this.props;
    return (
      <View style={styles.wrapper}>
        <View style={styles.circle} />
        <View style={styles.leftLine} />
        <View style={styles.statusBox}>
          {
          item.status === 0
            ? <Text style={styles.statusNo}>{getLocale('noDealWith')}</Text>
            : <Text style={styles.statusYes}>{getLocale('alreadyDealWith')}</Text>
          }
        </View>
        <View style={styles.itemStyle}>
          <Text numberOfLines={2} style={styles.itemHeader}>
            {item.name}
          </Text>
          <View style={styles.rowBox}>
            <Image
              source={timeIco}
              resizeMode="contain"
              style={styles.useIcon}
            />
            {item.alarmStarTime === item.alarmEndTime
              ? (
                <Text numberOfLines={2} style={styles.textBox}>
                  {shortFormator(item.alarmStarTime)}
                </Text>
              ) : (
                <Text numberOfLines={2} style={styles.textBox}>
                  {shortFormator(item.alarmStarTime)}
                  ~
                  {shortFormator(item.alarmEndTime)}
                </Text>
              )
            }
          </View>
          <View style={styles.rowBox}>
            <Image
              source={weiIco}
              resizeMode="contain"
              style={styles.useIcon}
            />
            {/* <Text numberOfLines={1} style={styles.textBox}>
              {item.address}
            </Text> */}
            <ScrollView horizontal>
              <View>
                <Text style={styles.textBox}>
                  {item.address}
                </Text>

              </View>
            </ScrollView>
          </View>
          <View style={[styles.rowBox, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              {(item.alarmValue !== '' && item.alarmValue !== null)
                ? (
                  <View style={styles.valueBox}>
                    <Image
                      source={valueIco}
                      resizeMode="contain"
                      style={styles.useIcon}
                    />
                    <Text numberOfLines={1} style={styles.textBox}>
                      {item.alarmValue ? item.alarmValue : ''}
                    </Text>
                  </View>
                ) : null
            }
            </View>
            <View style={styles.histroyBox}>
              <TouchableOpacity
                style={styles.histroyInfo}
                onPress={() => {
                  this.goHistroy(item.alarmEndTime);
                }}
              >
                <Image
                  source={histroy}
                  resizeMode="contain"
                  style={styles.histroyIcon}
                />
                <Text style={{ fontSize: 12 }}>
                  {getLocale('historyTitle')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export default ContentItem;