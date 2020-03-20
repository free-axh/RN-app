import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  AppState,
  Alert,
  Platform,
  NativeModules, NetInfo,
  NativeEventEmitter,
  Text,
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import WebsocketUtil from '../../utils/websocket';
// import storage from '../../utils/storage';
import { getLoginState, getLoginAccont } from '../../server/getStorageData';
import { monitorIcon } from '../../utils/monitorIcon';
// import httpBaseConfig from '../../utils/env';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { onConnectionChange, removeConnectionChange } from '../../utils/network';
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';
import ToolChildren from './componentToolChildren';
import Map from './componentMap';
import mapIcon6 from '../../static/image/target.png';
import mapIcon2 from '../../static/image/current.png';
import gpsNavi from '../../static/image/gpsNavi.png';
import { toastShow } from '../../utils/toastUtils';// 导入toast
// import Menu from './componentToolMenu';// 二期实现

const winHeight = Dimensions.get('window').height;

let emitterManager = null;
if (Platform.OS === 'ios') {
  emitterManager = new NativeEventEmitter(NativeModules.RNAMapNaviModule);
}

const openAMapNaviEvent = {
  unableGetCurrentLocation: null,
  unableGetTargetLocation: null,
  notEnadledLocationPermission: null,
};

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bottomCantainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
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
  ico: {
    width: 40,
    height: 40,
  },
  mapIcon_left: {
    left: 10,
  },
  mapIcon_right: {
    right: 10,
    zIndex: 99999,
  },
});

class Index extends Component {
  // 顶部导航
  static navigationOptions = ({ navigation }) => PublicNavBar(
    navigation,
    getLocale('monitorTrackTitle'),
  )
  // static navigationOptions = ({ navigation }) => ({
  //   header: (
  //     <PublicNavBar
  //       title={getLocale('monitorTrackTitle')}
  //       nav={navigation}
  //     />
  //   ),
  // })

  static propTypes = {
    monitors: PropTypes.object.isRequired,
    // currentMonitor: PropTypes.object.isRequired,
    activeMonitor: PropTypes.object,
    // token: PropTypes.string,
    socketTime: PropTypes.number,
    // accont: PropTypes.string,
    // monitorId: PropTypes.string,
    // socket: PropTypes.object,
  }

  // 属性默认值
  static defaultProps ={
    // token: null,
    socketTime: null,
    activeMonitor: null,
    // accont: null,
    // monitorId: null,
    // socket: null,
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
      socket: null,
      monitorId: null,
      locationManager: true,
      token: null,
      accont: null,
      routePlan: null,
      locationState: false,
      monitorInfo: {
        monitorName: null,
        state: null,
        continueTime: null,
        updateTime: null,
        targetAddress: null,
        monitorType: null,
      },
      distance: null,
      myAddress: null,
      mapHeight: winHeight,
      trackCurrentLocation: null,
      trackTargetLocation: null,
      currentMonitor,
      footerHeight: 250,
      socketConnected: false,
    };
  }

  // 组件第一次渲染后调用
  componentDidMount() {
    // 初始化websocket对象
    // const socket = new WebsocketUtil();
    // socket.init('/clbs/vehicle');
    onConnectionChange((type, effectiveType) => { this.netWorkonChange(type, effectiveType); });
    const { activeMonitor } = this.props;
    this.setState({
      // socket,
      monitorId: activeMonitor.markerId,
      bottomH: this.bottomH,
    });
    this.trackSocketConnect();
    AppState.addEventListener('change', this.handleAppStateChange);
    if (Platform.OS === 'ios') {
      openAMapNaviEvent.notEnadledLocationPermission = emitterManager.addListener('notEnadledLocationPermission',
        () => toastShow(getLocale('openLocationSwitchContent'), { duration: 2000 }));
      openAMapNaviEvent.unableGetCurrentLocation = emitterManager.addListener('unableGetCurrentLocation',
        () => toastShow(getLocale('unableGetCurrentLocation'), { duration: 2000 }));
      openAMapNaviEvent.unableGetTargetLocation = emitterManager.addListener('unableGetTargetLocation',
        () => toastShow(getLocale('unableGetTargetLocation'), { duration: 2000 }));
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      NativeModules.BaiduMapModule.show(Math.random());
    }
    removeConnectionChange();
    const { socket } = this.state;
    // console.warn('socket', socket);
    if (socket) {
      socket.close();
    }
    AppState.removeEventListener('change', this.handleAppStateChange);

    if (Platform.OS === 'ios') {
      openAMapNaviEvent.notEnadledLocationPermission.remove();
      openAMapNaviEvent.unableGetCurrentLocation.remove();
      openAMapNaviEvent.unableGetTargetLocation.remove();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  handleAppStateChange= (nextAppState) => {
    if (nextAppState === 'background') {
      // this.cancelSub();
    } else if (nextAppState === 'active') {
      const { socketConnected } = this.setState;
      if (!socketConnected) {
        NetInfo.getConnectionInfo().then((connectionInfo) => {
          if (connectionInfo.type === 'wifi' || connectionInfo.type === 'cellular') {
            const { token } = this.state;
            const headers = { access_token: token };
            const newSocket = new WebsocketUtil();
            newSocket.init('/clbs/vehicle', headers, () => {
              this.setState({
                socket: newSocket,
                socketConnected: true,
              });
              this.againSubJdge();
            }, this.socketCloseEvent);
          }
        });
      }
    }
  }

  // cancelSub() {
  //   const { socketTime } = this.props;
  //   const {
  //     token,
  //     accont,
  //     monitorId,
  //     socket,
  //   } = this.state;
  //   const headers = { access_token: token };
  //   const unParam = [{ vehicleId: monitorId }];
  //   const unRequset = {
  //     desc: {
  //       MsgId: 40964,
  //       UserName: accont + socketTime,
  //     },
  //     data: unParam,
  //   };
  //   socket.unsubscribealarm(headers, '/app/vehicle/unsubscribelocation', unRequset);
  // }

  againSub() {
    const {
      monitorId,
      socket,
      accont,
      token,
    } = this.state;
    const headers = { access_token: token };
    const { socketTime } = this.props;
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

  // 设置地图高度
  onLayout=() => {
    // const { nativeEvent: { layout: { y } } } = e;
    const H = winHeight;
    this.setState({
      mapHeight: H,
    });
  }

  // 路径规划距离返回
  getPlanDistance(data) {
    let allDistance = (data / 1000);
    const index = (allDistance.toString()).indexOf('.');
    if (index > 0) {
      allDistance = allDistance.toFixed(1);// 如果有小数,取一位小数
    }
    this.setState({ distance: allDistance });
  }


  // 获取当前用户位置信息
  getAddress(data) {
    const info = data;
    if (info !== undefined) {
      this.setState({ myAddress: info });
    }
  }

  // socket建立连接
  async trackSocketConnect() {
    const state = await getLoginState();
    // const state = await storage.load({
    //   key: 'loginState',
    // });
    const headers = { access_token: state.token };
    const socket = new WebsocketUtil();
    // console.warn('开始建立socket连接');
    socket.init('/clbs/vehicle', headers, () => {
      this.setState({ socketConnected: true });
    }, this.socketCloseEvent);
    this.setState({ socket });
  }

  socketCloseEvent = () => {
    this.setState({ socketConnected: false });
  }

  // 定位完成后回调函数
  async locationComplete(data) {
    // console.warn('定位成功');
    const $this = this;
    // console.warn(data);
    if (data === 'true') { // 定位成功
      const { locationState } = this.state;

      if (!locationState) {
        const state = await getLoginState();
        const headers = { access_token: state.token };
        const userInfo = await getLoginAccont();
        const { monitorId, socket } = $this.state;
        const { socketTime } = $this.props;
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
        setTimeout(() => {
          // console.warn(request);
          socket.subscribe(headers, `/user/${userInfo[userInfo.length - 1].accont + socketTime}/location`,
            $this.subCallBack.bind($this), '/app/vehicle/location', request);
        }, 2000);
        $this.setState({
          accont: userInfo[userInfo.length - 1].accont,
          token: state.token,
          locationState: true,
        });
      }
    } else {
      toastShow(getLocale('locationManagerFailed'), { duration: 2000 });
    }
  }

  onLocationStatusDenied() {
    Alert.alert(
      getLocale('openLocationSwitch'), // 提示标题
      getLocale('openLocationSwitchContent'), // 提示内容
      [
        {
          text: getLocale('know'),
          style: 'cancel',
        },
      ],
      { cancelable: false },
    );
  }

  // 订阅成功回调函数
  subCallBack(msg) {
    const { monitorId } = this.state;
    const data = JSON.parse(msg.body);
    /* eslint prefer-destructuring:off */
    // console.warn('推送socket数据');
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

          const i = Math.floor(Number(msgBody.direction) / 360);
          const angle = Number(msgBody.direction) - 360 * i + 270;

          const value = [{
            markerId: msgBody.monitorInfo.monitorId,
            latitude: coordinates.bdLat,
            longitude: coordinates.bdLng,
            title: msgBody.monitorInfo.monitorName,
            ico: objIcon,
            angle,
            speend: 10,
            status: msgBody.stateInfo,
            random: Math.random(),
          }];
          let speed = (msgBody.gpsSpeed === null || msgBody.gpsSpeed === undefined)
            ? null : msgBody.gpsSpeed;
          const index = speed === null ? 0 : (speed.toString()).indexOf('.');
          if (index > 0) {
            speed = speed.toFixed(1);// 如果有小数,取一位小数
          }
          this.setState({
            routePlan: value,
            monitorInfo: {
              monitorName: msgBody.monitorInfo.monitorName,
              state: this.monitorStateCallBack(msgBody.acc),
              continueTime: this.continueTime(msgBody.durationTime),
              updateTime: this.assemblyUpdateTime(msgBody.gpsTime),
              // distance: null,
              // myAddress: null,
              runSpeed: speed,
              targetAddress: msgBody.positionDescription,
              monitorType: msgBody.monitorInfo.monitorType,
            },
          });
        }
        // this.setState({ updateTime: this.assemblyUpdateTime(msgBody.gpsTime) });
      }
    }
  }

  // 返回行驶和停止
  monitorStateCallBack(acc) {
    let state;
    if (acc === 0) {
      state = getLocale('stop');
    } else if (acc === 1) {
      state = '行驶';
    }
    return state;
  }

  // 返回状态持续时长
  continueTime(time) {
    return (time / 1000 / 60 / 60).toFixed(2);
  }

  // 组装更新时间
  assemblyUpdateTime(time) {
    return `20${time.substring(0, 2)}-${time.substring(2, 4)}-${time.substring(4, 6)} ${time.substring(6, 8)}:${time.substring(8, 10)}:${time.substring(10, 12)}`;
  }

  // 监控对象切换
  monitorChange(item) {
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
    this.setState({ monitorId: mId, currentMonitor: item });
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
    const { trackTargetLocation } = this.state;
    this.setState({
      trackTargetLocation: trackTargetLocation === null ? true : !trackTargetLocation,
    });
  }

  // 当前定位切换
  currentLocation() {
    const { trackCurrentLocation } = this.state;
    this.setState({
      trackCurrentLocation: trackCurrentLocation === null ? true : !trackCurrentLocation,
    });
  }

  // 网络变化
  netWorkonChange=(type) => {
    if (type !== 'none' || type !== 'unknown') {
      const { socketConnected, token } = this.state;
      if (!socketConnected) {
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
      // this.againSubJdge();
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
      footerHeight: state ? 470 : 250,
    });
  }

  startNavi() {
    if (Platform.OS === 'ios') {
      NativeModules.RNAMapNaviModule.openAMapNavi('openAMapNavi');
    } else {
      NativeModules.NavigationModule.startNavigation(Math.random());
    }
  }

  render() {
    const {
      monitors,
    } = this.props;
    const {
      locationManager,
      routePlan,
      monitorInfo,
      myAddress,
      distance,
      mapHeight,
      currentMonitor,
      trackCurrentLocation,
      trackTargetLocation,
      footerHeight,
    } = this.state;

    // console.warn('routePlan', routePlan);

    return (
      <View style={styles.container}>
        <View
          style={{ height: mapHeight }}
        >
          <Map
            mapViewHeight={mapHeight}
            locationManager={locationManager}
            onLocationSuccess={data => this.locationComplete(data)}
            onLocationStatusDenied={data => this.onLocationStatusDenied(data)}
            routePlan={routePlan}
            onAddress={data => this.getAddress(data)}
            onPlanDistance={data => this.getPlanDistance(data)}
            trackCurrentLocation={trackCurrentLocation}
            trackTargetLocation={trackTargetLocation}
            trackPolyLineSpan={footerHeight}
            baiduMapScalePosition={`65|${footerHeight === 250 ? 233 : 393}`}
          />
        </View>

        <View
          style={styles.bottomCantainer}
        >
          {/* 二期实现导航 start */}
          {/* <Menu /> */}
          {/* 二期实现导航 end */}

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
          {/* 导航图标 */}
          <TouchableOpacity
            style={[styles.mapIcon, styles.mapIcon_right, {
              top: -20, backgroundColor: '#339eff', height: 40, width: 40,
            }]}
            onPress={() => this.startNavi()}
          >
            <Image
              source={gpsNavi}
              style={[styles.ico, { width: 13, height: 13 }]}
            />
            <Text style={{ color: '#ffffff' }}>导航</Text>
          </TouchableOpacity>

          <ToolBar
            activeMonitor={currentMonitor}
            monitors={monitors}
            onChange={item => this.monitorChange(item)}
            toggleSlideState={this.getToggleSlideState}
          >
            <View style={{ position: 'relative' }}>
              <ToolChildren msg={monitorInfo} myAddress={myAddress} distance={distance} />
              <View onLayout={(e) => { this.onLayout(e); }} />
            </View>
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
  }),
  null,
)(Index);