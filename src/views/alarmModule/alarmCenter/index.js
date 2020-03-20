/* eslint react/sort-comp :off */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  TouchableHighlight,
  Image, Text, Alert,
  TouchableOpacity,
  Keyboard,
  Platform, PanResponder,
  FlatList, RefreshControl,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as timeFormat from 'd3-time-format';
import { getCurAccont, getClearAlarmTime } from '../../../server/getStorageData';
import { go } from '../../../utils/routeCondition';
import storage from '../../../utils/storage';
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';

import { toastShow } from '../../../utils/toastUtils';// 导入toast

// import storage from '../../../utils/storage';

import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航

import AlarmObjNum from './alarmObjNum';// 顶部显示报警数量组件
import MonitorSearch from './monitorObjSearch';// 监控对象搜索组件
import AlarmItem from './alarmItem';// 报警对象信息列表组件

import { getLocale } from '../../../utils/locales';
import setting from '../../../static/image/setting.png';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigator: {
    backgroundColor: 'rgb(55,152,249)',
  },
  header: {
    color: '#fff',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  leftTouch: {
    padding: 15,
  },
  leftIcon: {
    width: 10,
    height: 20,
  },
  rightTouch: {
    paddingHorizontal: 20,
  },
  rightIcon: {
    width: 20,
    height: 20,
  },
  wrapper: {
    flex: 1,
    backgroundColor: 'rgb(244,247,250)',
  },
  menuBox: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    height: 30,
    zIndex: 999,
  },
  rightMenu: {
    position: 'absolute',
    right: 5,
    top: 2,
    zIndex: 9999,
    // width: 98,
    paddingTop: 3,
  },
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: -6,
    right: 20,
    borderWidth: 6,
    borderColor: 'transparent',
    borderBottomColor: '#fff',
  },
  menuItem: {
    height: 30,
    padding: 5,
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 0,
    color: 'rgb(53,155,255)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  menuItemBottom: {
    marginTop: -1,
  },
  hide: {
    position: 'absolute',
    right: -500,
  },
  alignCenter: {
    color: '#999',
    textAlign: 'center',
  },
  refreshBox: { backgroundColor: '#339eff', margin: 0, padding: 0 },
  noData: {
    marginTop: 30,
    textAlign: 'center',
  },
  headerBg: {
    position: 'absolute',
    top: -200,
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#339eff',
  },
});

// loading样式
const loadingStyle = (
  <View style={{ alignItems: 'center' }}>
    <Loading type="inline" color="rgb(54,176,255)" />
  </View>
);
class AlarmCenter extends Component {
 // 顶部导航
 static navigationOptions = ({ navigation }) => PublicNavBar(
   navigation,
   getLocale('alarmCenterTitle'),
   <View
     style={Platform.OS === 'android' ? null : styles.menuBox}
   >
     <TouchableHighlight
       underlayColor
       style={styles.rightTouch}
       onPress={() => {
         navigation.state.params.showMenu();
       }}
     >
       <Image
         style={styles.rightIcon}
         source={setting}
       />
     </TouchableHighlight>
   </View>,
 );

  static propTypes = {
    navigation: PropTypes.objectOf.isRequired,
    getAlarmData: PropTypes.func.isRequired,
    alarmData: PropTypes.objectOf({
      count: 0,
      data: [],
    }).isRequired,
    initStatus: PropTypes.string.isRequired,
    monitors: PropTypes.object.isRequired,
    activeMonitor: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      getDataState: false,
      alarmNum: 0, // 报警对象数量
      dataArr: [], // 报警数据
      oldDataArr: [],
      pageCount: 1, // 当前页
      oldPageCount: 1, // 存储未模糊搜索时的页码
      pageSize: 10, // 每页显示数量
      showFooter: 0, // 控制列表底部显示文本
      menuState: false, // 顶部导航设置图标是否可点击
      searchText: '', // 模糊查询条件
      isSearch: false, // 是否模糊查询
      isPullTop: false, // 是否可上拉加载
      queryStartTime: null, // 报警查询开始时间
      queryAlarmType: null, // 报警类型
      clearAlarmTime: null, // 清除报警数据时间
      queryEndTime: null, // 上拉加载时的查询结束时间
      loadingType: true, // 加载动画样式
      showState: false, // 显示导航栏右侧菜单
      isLoading: false, // 显示下拉刷新加载动画
    };
    this.createpanResponder();
    this.getData();
  }

  // 组件加载完毕执行
  componentDidMount=() => {
    const { navigation } = this.props;
    navigation.setParams({
      showMenu: this.showMenu,
    });
  }


  // props改变时触发
  componentWillReceiveProps(nextProps) {
    const { alarmData, initStatus } = nextProps;
    const {
      getDataState, pageCount, pageSize,
      dataArr, alarmNum, searchText, oldPageCount,
    } = this.state;
    if (getDataState) {
      if (alarmData.size > 0) {
        let newData = [];
        if (pageCount === 1) { // 下拉刷新
          newData = [...alarmData.get('data')];
          if (alarmData.get('setting') !== null) { // 保存缓存中的配置信息
            const settingInfo = alarmData.get('setting');
            this.setState({
              queryAlarmType: settingInfo.get('alarmType'),
              queryStartTime: settingInfo.get('newStartTime'),
              clearAlarmTime: settingInfo.get('clearAlarmTime'),
            });
          }
        } else { // 上拉加载
          newData = dataArr.concat([...alarmData.get('data')]);
        }
        const newCount = alarmData.get('count');
        this.setState({
          alarmNum: newCount === null ? alarmNum : newCount,
          dataArr: newData,
          showFooter: 1,
          isLoading: false,
          isPullTop: false,
          menuState: true,
        });
        if (searchText === '') {
          this.setState({
            oldDataArr: newData,
          });
        }
        if (alarmData.get('data').size >= pageSize) {
          this.setState({
            isPullTop: true,
            showFooter: 0,
            pageCount: pageCount + 1,
          });
          if (searchText === '') {
            this.setState({
              oldPageCount: oldPageCount + 1,
            });
          }
        }
      } else if (initStatus === 'end') { // 已到最后一页
        if (pageCount === 1) {
          this.setState({
            alarmNum: 0,
            dataArr: [],
          });
          if (searchText === '') {
            this.setState({
              oldDataArr: [],
            });
          }
        }
        this.setState({
          showFooter: 1,
          isLoading: false,
          isPullTop: false,
          menuState: true,
        });
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 监听搜索条件变化
  onChanegeTextKeyword=(text) => {
    this.setState({
      searchText: text,
    });
  }

  // 上拉加载
  onEndReached=() => {
    const { showFooter, isPullTop } = this.state;
    // 如果是正在加载中或没有更多数据了，则返回
    if (showFooter !== 0 || !isPullTop) {
      return;
    }
    this.setState({
      showFooter: 2,
      loadingType: false,
    });
    this.getData(null);
  }

  // 点击搜索框清空图标时恢复数据
  resetData=() => {
    const { oldDataArr, pageSize, oldPageCount } = this.state;
    const len = oldDataArr.length;
    if (len !== 0 && len % pageSize === 0) {
      this.setState({
        isPullTop: true,
        showFooter: 0,
        pageCount: oldPageCount,
      });
    }
    this.setState({
      dataArr: oldDataArr,
    });
    // Keyboard.dismiss();
  }

  // 生成设备唯一标识
  // getOnlyId() {
  //   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  //     /* eslint no-bitwise:off */
  //     const r = Math.random() * 16 | 0;
  //     /* eslint no-mixed-operators:off */
  //     const v = (c === 'x' ? r : (r & 0x3 | 0x8));
  //     return v.toString(16);
  //   }).toUpperCase();
  // }

  // 获取报警对象信息
  getData=(indexCount) => {
    // 获取设备唯一标识
    // storage.load({
    //   key: 'uniquenessFlag',
    // }).then((res) => {
    //   const uniquenessFlag = res;
    //   this.getDataBack(uniquenessFlag, indexCount);
    // }).catch(() => {
    //   const uniquenessFlag = this.getOnlyId();
    //   // 保存唯一标识到缓存中
    //   storage.save({
    //     key: 'uniquenessFlag',
    //     data: uniquenessFlag,
    //   }).then(() => {
    //     this.getDataBack(uniquenessFlag, indexCount);
    //   });
    // });

    this.state.getDataState = true;
    const nowTime = timeFormator(new Date());// 当前时间
    if (indexCount && indexCount !== null) {
      this.state.pageCount = indexCount;
      this.state.loadingType = false;
    }
    if (indexCount !== null) {
      this.state.queryEndTime = nowTime;
    }

    const { getAlarmData } = this.props;
    const {
      pageCount, pageSize, isSearch, searchText,
      queryStartTime, queryAlarmType, queryEndTime,
    } = this.state;

    const fuzzyParam = isSearch ? searchText : '';
    const param = {
      alarmType: queryAlarmType,
      startTime: queryStartTime,
      endTime: indexCount === null ? queryEndTime : nowTime,
      page: indexCount || pageCount,
      pageSize,
      fuzzyParam,
    };
    getAlarmData(param);
  }

  // getDataBack=(uniquenessFlag, indexCount) => {
  //   this.state.getDataState = true;
  //   const nowTime = timeFormator(new Date());// 当前时间
  //   if (indexCount && indexCount !== null) {
  //     this.state.pageCount = indexCount;
  //     this.state.loadingType = false;
  //   }
  //   if (indexCount !== null) {
  //     this.state.queryEndTime = nowTime;
  //   }

  //   const { getAlarmData } = this.props;
  //   const {
  //     pageCount, pageSize, isSearch, searchText,
  //     queryStartTime, queryAlarmType, queryEndTime,
  //   } = this.state;

  //   const fuzzyParam = isSearch ? searchText : '';
  //   const param = {
  //     alarmType: queryAlarmType,
  //     startTime: queryStartTime,
  //     endTime: indexCount === null ? queryEndTime : nowTime,
  //     page: indexCount || pageCount,
  //     pageSize,
  //     fuzzyParam,
  //     uniquenessFlag,
  //   };
  //   getAlarmData(param);
  // }

  // 清空报警数据
  clearAlarmData= () => {
    Alert.alert(getLocale('clearAlarm'), getLocale('isClearAlarm'), [
      {
        text: getLocale('personalCAlert3'),
        onPress: async () => {
          this.setState({
            alarmNum: 0,
            isPullTop: false,
            dataArr: [],
          });
          getClearAlarmTime().then((res) => {
            const dataObj = res || {};
            getCurAccont().then((userName) => {
              dataObj[userName] = { time: timeFormator(new Date()) };
              storage.save({
                key: 'clearAlarmTime',
                data: dataObj,
              });
              toastShow(getLocale('clearAlarmSuccess'), { duration: 2000 });
            });
          });
        },
      },
      {
        text: getLocale('personalCAlert4'),
        onPress: () => {},
      },
    ]);
  }

  // 控制导航右侧设置菜单显示隐藏
  showMenu=() => {
    const { menuState, showState } = this.state;
    if (menuState) {
      this.setState({
        getDataState: !showState,
        showState: !showState,
      });
    }
  }

  // 隐藏导航右侧设置菜单
  hideMenu=() => {
    this.setState({
      // getDataState: false,
      showState: false,
    }, () => {
      Keyboard.dismiss();
    });
  }

  // 下拉刷新
  pullDownRefresh=() => {
    const { searchText } = this.state;
    this.setState({
      showFooter: 2,
      isLoading: true,
    });
    if (searchText === '') {
      this.setState({
        oldPageCount: 1,
      });
    }
    this.getData(1);
  }

  // 点击搜索按钮进行模糊查询操作
  searchAlarm=() => {
    const { searchText } = this.state;
    if (searchText !== '') {
      this.setState({
        dataArr: [],
        isSearch: true,
        pageCount: 1,
        showFooter: 1,
        loadingType: true,
      }, () => {
        const reg = /^[0-9a-zA-Z\u4e00-\u9fa5-]{0,20}$/;// 输入框输入限制
        if (!reg.test(searchText)) {
          this.setState({
            dataArr: [],
          });
          return;
        }
        this.getData(null);
      });
    } else {
      this.resetData();
    }
    Keyboard.dismiss();
  }

  // 手势触摸操作
  createpanResponder=() => {
    this.panResponder = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: () => {
        this.hideMenu();
      },
    });
  }

  // 列表顶部
  renderHeader=() => {
    const { alarmNum } = this.state;
    return (
      <View>
        <View style={styles.headerBg} />
        <View {...this.panResponder.panHandlers}>
          <AlarmObjNum num={alarmNum} />
        </View>
        <MonitorSearch
          onChanegeTextKeyword={this.onChanegeTextKeyword}
          searchFun={this.searchAlarm}
          resetData={this.resetData}
        />
      </View>
    );
  }

   // 底部显示样式
   renderFooter=() => {
     const { showFooter, isPullTop } = this.state;
     if (showFooter === 2 && isPullTop) {
       return loadingStyle;
     }
     return null;
   }

   // 列表item样式
   renderRow=(item) => {
     const { queryAlarmType, queryStartTime, clearAlarmTime } = this.state;
     const settingInfo = {
       queryAlarmType, queryStartTime, clearAlarmTime,
     };
     return (
       <AlarmItem
         item={item.item}
         settingInfo={settingInfo}
         hideMenu={this.hideMenu}
       />
     );
   }

   render() {
     const { monitors, initStatus, activeMonitor } = this.props;
     const {
       dataArr, showState, searchText, loadingType, isLoading,
     } = this.state;

     return (
       <View style={styles.container}>
         {/* 导航栏右侧菜单 */}
         <Animatable.View
           animation={showState ? 'flipInY' : ''}
           style={showState ? styles.rightMenu : styles.hide}
         >
           <View style={styles.triangle} />
           <Text
             style={styles.menuItem}
             onPress={() => {
               go('alarmSwitch', {
                 searchText,
                 getData: this.getData,
               });
               this.hideMenu();
             }}
           >
             {getLocale('alarmSwitchTitle')}
           </Text>
           <Text
             style={[styles.menuItem, styles.menuItemBottom]}
             onPress={() => {
               this.clearAlarmData();
               this.hideMenu();
             }}
           >
             {getLocale('clearAlarmData')}
           </Text>
         </Animatable.View>
         {/* 页面主体 */}
         <TouchableOpacity
           style={styles.container}
           activeOpacity={1}
           onPress={this.hideMenu}
         >
           <View style={styles.wrapper}>
             <FlatList
               data={dataArr}
               style={{ flex: 1 }}
               keyExtractor={item => item.id}
               initialNumToRender={dataArr.length}
               renderItem={item => this.renderRow(item)}
               ListHeaderComponent={this.renderHeader}
               ListFooterComponent={this.renderFooter}
               keyboardShouldPersistTaps
               ListEmptyComponent={() => (
                 (dataArr.length === 0 && initStatus === 'end')
                   ? <Text style={styles.noData}>{getLocale('noAlarmData')}</Text>
                   : null)
               }
               refreshControl={(
                 <RefreshControl
                   style={[
                     styles.refreshBox, isLoading ? { zIndex: 10 } : { zIndex: -1 },
                   ]}
                   colors={['#339eff']}
                   tintColor={['#fff']}
                   refreshing={isLoading}
                   progressViewOffset={0}
                   onRefresh={this.pullDownRefresh}
                 />
              )}
               onEndReachedThreshold={0.001}
               onEndReached={this.onEndReached}
             />
             {
              (initStatus === 'start' && loadingType) ? <Loading type="page" /> : null
             }
           </View>
           <ToolBar
             monitors={monitors}
             activeMonitor={activeMonitor}
           />
         </TouchableOpacity>
       </View>
     );
   }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    alarmData: state.getIn(['alarmCenterReducers', 'alarmData']),
    initStatus: state.getIn(['alarmCenterReducers', 'initStatus']),
  }),
  dispatch => ({
    getAlarmData: (payload) => {
      dispatch({ type: 'alarmCenter/SAGA/GETDATA_ACTION', payload });
    },
  }),
)(AlarmCenter);