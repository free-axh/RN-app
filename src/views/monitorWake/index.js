import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  AppState,
  Platform,
  NativeModules, NetInfo,
} from 'react-native';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import { convertSeconds } from '../../utils/convertSeconds';
import { getLoginAccont, getLoginState } from '../../server/getStorageData';
import { onConnectionChange, removeConnectionChange } from '../../utils/network';
import WebsocketUtil from '../../utils/websocket';
import { monitorIcon } from '../../utils/monitorIcon';
// import httpBaseConfig from '../../utils/env';
// import storage from '../../utils/storage';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';
import WakeInfo from './wakeInfo';// 尾迹信息
import MapView from './componentMap';// 地图

import mapIcon6 from '../../static/image/target.png';
import mapIcon2 from '../../static/image/current.png';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,255)',
  },
  map: {
    flex: 1,
  },
  bottomCantainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  ico: {
    width: 40,
    height: 40,
  },
  mapIcon: {
    position: 'absolute',
    zIndex: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon_left: {
    left: 10,
  },
});

class MonitorWake extends Component {
  // 顶部导航
  static navigationOptions = ({ navigation }) => PublicNavBar(
    navigation,
    getLocale('monitorWakeTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object.isRequired,
    socketTime: PropTypes.number,
    activeMonitor: PropTypes.object,
    // markers: PropTypes.object,
    // updateMonitorInfo: PropTypes.func,
    // subCallBack: PropTypes.func,
  }

  // 属性默认值
  static defaultProps ={
    socketTime: null,
    activeMonitor: null,
    // markers: new Map(),
    // updateMonitorInfo: null,
    // subCallBack: null,
  }

  constructor(props) {
    super(props);
    const {
      activeMonitor, monitors,
    } = this.props;

    const firstMonitor = monitors.get(0);
    let currentMonitor = null;
    if (activeMonitor === null) {
      currentMonitor = firstMonitor;
    } else {
      const monitor = monitors.find(x => x.markerId === activeMonitor.markerId);
      if (monitor === null) {
        currentMonitor = firstMonitor;
      } else {
        currentMonitor = monitor;
      }
    }

    this.state = {
      // subState: false,
      socket: null,
      monitorAddressInfo: null,
      curState: null,
      // time: null,
      updateTime: null,
      curAddr: null,
      runDistance: 0,
      runSpeed: 0,
      // beginEndTime: null,
      beginEndAddr: null,
      mileage: null,
      realTimeWake: true,
      wakeData: [],
      monitorId: null,
      latestPoints: null,
      token: null,
      accont: null,
      wakeTargetLocation: null,
      wakeCurrentLocation: null,
      currentMonitor,
      defaultFooterHeight: 168,
      mapInit: false,
      socketConnected: false,
    };
  }

  // 组件第一次渲染后调用
  componentDidMount() {
    // 初始化websocket对象
    // const socket = new WebsocketUtil();
    // socket.init('/clbs/vehicle');
    onConnectionChange((type, effectiveType) => { this.netWorkonChange(type, effectiveType); });
    this.wakeSocketConnect();
    const { activeMonitor } = this.props;
    this.setState({
      monitorId: activeMonitor.markerId,
      latestPoints: [
        { vehicleId: activeMonitor.markerId },
      ],
    });
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      NativeModules.BaiduMapModule.show(Math.random());
    }
    removeConnectionChange();
    const { socket } = this.state;
    socket.close();
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      this.cancelSub();
    } else if (nextAppState === 'active') {
      const { socketConnected } = this.setState;
      if (!socketConnected) {
        const { token } = this.state;
        const headers = { access_token: token };
        const socket = new WebsocketUtil();
        socket.init('/clbs/vehicle', headers, () => {
          this.setState({
            socketConnected: true,
            socket,
          });
          this.againSubJdge();
        }, this.socketCloseEvent);
      }
      // NetInfo.getConnectionInfo().then((connectionInfo) => {
      //   if (connectionInfo.type === 'wifi' || connectionInfo.type === 'cellular') {
      //   }
      // });
    }
  }

  // 取消訂閱
  cancelSub() {
    const {
      monitorId,
      socket,
      token,
      accont,
    } = this.state;
    const { socketTime } = this.props;
    const headers = { access_token: token };
    const param = [
      { vehicleId: monitorId },
    ];
    const unRequset = {
      desc: {
        MsgId: 40964,
        UserName: accont + socketTime,
      },
      data: param,
    };
    // 取消位置信息订阅
    socket.unsubscribealarm(headers, '/app/vehicle/unsubscribelocation', unRequset);
  }

  // 重新訂閱
  againSub() {
    const {
      monitorId,
      socket,
      token,
      accont,
    } = this.state;
    const { socketTime } = this.props;
    const headers = { access_token: token };
    // 订阅监控对象位置信息
    const param = [
      { vehicleId: monitorId },
    ];
    const request = {
      desc: {
        MsgId: 40964,
        UserName: accont + socketTime,
      },
      data: param,
    };
    socket.subscribe(headers, `/user/${accont + socketTime}/location`,
      this.subCallBack.bind(this), '/app/vehicle/location', request);
  }

  // 地图初始化完成事件
  onMapInitFinish() {
    this.socketConnectSuccess();
    this.setState({ mapInit: true });
  }

  // socket建立连接
  async wakeSocketConnect() {
    const state = await getLoginState();
    const headers = { access_token: state.token };
    const socket = new WebsocketUtil();
    socket.init('/clbs/vehicle', headers, () => {
      this.setState({ socketConnected: true });
    }, this.socketCloseEvent);
    this.setState({ socket });
  }

  socketCloseEvent = () => {
    // console.warn('wake socket关闭');
    this.setState({ socketConnected: false });
  }

  // socket连接成功后位置信息订阅
  socketConnectSuccess() {
    const { socketConnected } = this.state;
    setTimeout(() => {
      if (socketConnected) {
        this.subMonitorFunc();
      } else {
        this.socketConnectSuccess();
      }
    }, 1000);
  }

  // 组装更新时间
  assemblyUpdateTime(time) {
    return `20${time.substring(0, 2)}-${time.substring(2, 4)}-${time.substring(4, 6)} ${time.substring(6, 8)}:${time.substring(8, 10)}:${time.substring(10, 12)}`;
  }

  // 返回状态持续时长
  // continueTime(time) {
  //   return (time / 1000 / 60 / 60).toFixed(2);
  // }

  // 位置信息订阅成功回掉函数
  subCallBack(msg) {
    const {
      monitorId,
      curAddr,
      // subState,
      // mileage,
    } = this.state;
    const data = JSON.parse(msg.body);
    /* eslint prefer-destructuring:off */
    if (data.desc !== 'neverOnline') {
      const msgBody = data.data.msgBody;
      const mid = msgBody.monitorInfo.monitorId;
      if (mid === monitorId) {
        // 组装监控对象地图更新数据
        // 组装图片地址  车、人和物
        if (msgBody.longitude !== 0 && msgBody.latitude !== 0) {
          const monitorType = msgBody.monitorInfo.monitorType;
          const objIcon = monitorIcon(monitorType, msgBody.monitorInfo.monitorIcon);
          const coordinates = bdEncrypt(msgBody.longitude, msgBody.latitude);
          const time = convertSeconds(msgBody.gpsTime);

          const i = Math.floor((Number(msgBody.direction) + 270) / 360);
          const angle = (Number(msgBody.direction) + 270) - 360 * i;

          const value = [{
            markerId: msgBody.monitorInfo.monitorId,
            latitude: coordinates.bdLat,
            longitude: coordinates.bdLng,
            title: msgBody.monitorInfo.monitorName,
            ico: objIcon,
            speed: 10,
            status: msgBody.stateInfo,
            angle,
            time,
          }];
          this.setState({ wakeData: value });
          const {
            // subState,
            mileage,
          } = this.state;
          if (mileage != null) {
            this.setState({ runDistance: (msgBody.gpsMileage - mileage).toFixed(1) });
          } else {
            this.setState({ mileage: msgBody.gpsMileage });
          }
          if (curAddr === null) {
            this.setState({ curAddr: msgBody.positionDescription });
          }
          let speed = (msgBody.gpsSpeed === null || msgBody.gpsSpeed === undefined)
            ? null : msgBody.gpsSpeed;
          const index = speed === null ? 0 : (speed.toString()).indexOf('.');
          if (index > 0) {
            speed = speed.toFixed(1);// 如果有小数,取一位小数
          }
          // 更新起点时间和位置
          // if (!subState) {
          this.setState({
            runSpeed: speed,
            // beginEndTime: this.assemblyUpdateTime(msgBody.gpsTime),
            beginEndAddr: msgBody.positionDescription,
            curState: msgBody.monitorInfo.monitorType,
            // subState: true,
          });
          // }
          // }
        }
        // 更新底部位置信息
        this.setState({
          // time: this.continueTime(msgBody.durationTime),
          updateTime: this.assemblyUpdateTime(msgBody.gpsTime),
          // curAddr: msgBody.positionDescription,
          // runDistance: msgBody.gpsMileage,
        });
      }
    }
  }

  // 监控对象位置信息订阅
  async subMonitorFunc() {
    const state = await getLoginState();
    const headers = { access_token: state.token };
    const userInfo = await getLoginAccont();
    const { monitorId, socket } = this.state;
    const { socketTime } = this.props;
    // 订阅监控对象位置信息
    const param = [
      { vehicleId: monitorId },
    ];
    const request = {
      desc: {
        MsgId: 40964,
        UserName: userInfo[userInfo.length - 1].accont + socketTime,
      },
      data: param,
    };
    socket.subscribe(headers, `/user/${userInfo[userInfo.length - 1].accont + socketTime}/location`,
      this.subCallBack.bind(this), '/app/vehicle/location', request);
    this.setState({
      token: state.token,
      accont: userInfo[userInfo.length - 1].accont,
    });
  }

  // 监控对象切换
  monitorChange(item) {
    // 清空上一个监控对象的信息
    this.setState({
      curState: null,
      // time: null,
      updateTime: null,
      curAddr: null,
      runDistance: 0,
      // beginEndTime: null,
      beginEndAddr: null,
      mileage: null,
    });
    // const { runDistance } = this.state;
    // 取消订阅上一辆车辆
    const { socketTime } = this.props;
    const {
      token,
      accont,
      monitorId,
      socket,
    } = this.state;
    const headers = { access_token: token };
    const unParam = [{ vehicleId: monitorId }];
    const unRequset = {
      desc: {
        MsgId: 40964,
        UserName: accont + socketTime,
      },
      data: unParam,
    };
    if (unParam.length > 0) {
      socket.unsubscribealarm(headers, '/app/vehicle/unsubscribelocation', unRequset);
    }

    // 订阅切换后的监控对象
    const mId = item.markerId;
    this.setState({
      monitorId: mId,
      currentMonitor: item,
      latestPoints: [
        { vehicleId: mId },
      ],
    });
    const param = [{ vehicleId: mId }];
    const request = {
      desc: {
        MsgId: 40964,
        UserName: accont + socketTime,
      },
      data: param,
    };
    socket.subscribe(headers, `/user/${accont + socketTime}/location`,
      this.subCallBack.bind(this), '/app/vehicle/location', request);
  }

  // 目标定位切换
  targetLocation() {
    const { wakeTargetLocation } = this.state;
    this.setState({
      wakeTargetLocation: wakeTargetLocation === null ? true : !wakeTargetLocation,
    });
  }

  // 当前定位切换
  currentLocation() {
    const { wakeCurrentLocation } = this.state;
    this.setState({
      wakeCurrentLocation: wakeCurrentLocation === null ? true : !wakeCurrentLocation,
    });
  }

  // 网络变化
  netWorkonChange=(type) => {
    if (type !== 'none' || type !== 'unknown') {
      const { socketConnected } = this.setState;
      if (!socketConnected) {
        const { token } = this.state;
        const headers = { access_token: token };
        const socket = new WebsocketUtil();
        socket.init('/clbs/vehicle', headers, () => {
          this.setState({
            socketConnected: true,
            socket,
          });
          this.againSubJdge();
        }, this.socketCloseEvent);
      }
      // setTimeout(() => {
      //   const { socket } = this.state;
      //   if (socket.socket !== null) {
      //     this.againSub();
      //   }
      // }, 2000);
    }
  }

  // 避免socket重复建立连接，轮询判断reconnectionState是否为true
  againSubJdge() {
    // setTimeout(() => {
    //   const { socket } = this.state;
    //   // console.warn('reconnectionState', socket.reconnectionState);
    //   if (!socket.reconnectionState) {
    //     if (socket.socket !== null) {
    this.againSub();
    //     }
    //   } else {
    //     this.againSubJdge();
    //   }
    // }, 1000);
  }

  getToggleSlideState=(state) => {
    this.setState({
      defaultFooterHeight: state ? 328 : 168,
    });
  }

  render() {
    const {
      monitors,
      // markers,
    } = this.props;
    // const { wakeData } = this.state;
    const {
      curState,
      // time,
      updateTime,
      curAddr,
      runDistance,
      runSpeed,
      // beginEndTime,
      beginEndAddr,
      realTimeWake,
      wakeData,
      wakeTargetLocation,
      wakeCurrentLocation,
      currentMonitor,
      mapInit,
      defaultFooterHeight,
      socketConnected,
      latestPoints,
    } = this.state;
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          // markers={wakeData}
          wakeData={wakeData}
          realTimeWake={realTimeWake}
          onMapInitFinish={() => this.onMapInitFinish()}
          wakeCurrentLocation={wakeCurrentLocation}
          wakeTargetLocation={wakeTargetLocation}
          baiduMapScalePosition={mapInit ? `65|${defaultFooterHeight}` : null}
          goLatestPoin={!socketConnected ? latestPoints : null}
        />
        <View style={styles.bottomCantainer}>
          {/* 定位图标 start */}
          <TouchableOpacity
            style={[styles.mapIcon, styles.mapIcon_left, { top: -120 }]}
            onPress={() => this.currentLocation()}
          >
            <Image
              source={mapIcon2}
              style={styles.ico}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapIcon, styles.mapIcon_left, { top: -65 }]}
            onPress={() => this.targetLocation()}
          >
            <Image
              source={mapIcon6}
              style={styles.ico}
            />
          </TouchableOpacity>
          {/* 定位图标 end */}
          <ToolBar
            onChange={item => this.monitorChange(item)}
            activeMonitor={currentMonitor}
            monitors={monitors}
            toggleSlideState={this.getToggleSlideState}
          >
            <WakeInfo
              curState={curState}
              // time={time}
              updateTime={updateTime}
              curAddr={curAddr}
              runDistance={runDistance}
              runSpeed={runSpeed}
              // beginEndTime={beginEndTime}
              beginEndAddr={beginEndAddr}
            />
          </ToolBar>
        </View>
      </View>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    socketTime: state.getIn(['homeReducers', 'socketTime']),
    // markers: state.getIn(['homeReducers', 'monitorInfo']),
  }),
  // dispatch => ({
  //   updateMonitorInfo: (value) => {
  //     dispatch({ type: 'UPDATE_MARKER_INFO', value });
  //   },
  // }),
)(MonitorWake);