import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Vibration,
  ImageBackground,
  Platform,
  AppState,
  Alert,
  NativeModules,
  NetInfo,
  NativeEventEmitter,
} from 'react-native';
import { throttle } from 'lodash';
import Sound from 'react-native-sound';
import * as Animatable from 'react-native-animatable';
import SplashScreen from 'rn-splash-screen';
import {
  getAlarmSetting,
  setRollCallIssued,
  checkMonitorOnline,
  // checkMonitorBindRisk
} from '../../server/getData';
import {
  getLoginState, getLoginAccont, getCheckAlarmType, getUserSetting,
} from '../../server/getStorageData';
import { go, getMonitor } from '../../utils/routeCondition';
import { onConnectionChange, removeConnectionChange } from '../../utils/network';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import { convertSeconds } from '../../utils/convertSeconds';
import { monitorIcon } from '../../utils/monitorIcon';
import WebsocketUtil from '../../utils/websocket';
import storage from '../../utils/storage';
import MapView from '../../common/MapView';
import BaiduPano from '../../common/baiduPanoView';
import Header from './header';
import MapBtnView from './mapBtnView';
import SubInfoView from './subscribeInfoView';
import Footer from './footer';
import CompentToolSlider from '../../common/toolBar/componentToolSlider';
import SubOtherInfoView from './subOtherInfo';
import SubOtherInfoHead from './subOtherInfoHead';
import localtionPng from '../../static/image/localtion.png';
import waring from '../../static/image/warning.png';
import activeSafetyImg from '../../static/image/activeSafety.png';
import activeSafetyGif from '../../static/image/activesafetyGif.gif';
import alarmgif from '../../static/image/alarmgif.gif';
import warningBg from '../../static/image/warningBg.png';
import { isEmpty } from '../../utils/function';
import { getLocale } from '../../utils/locales';
import { toastShow } from '../../utils/toastUtils';
import warningaudio from '../../static/image/Beep.mp3';
import ScaleView from '../../common/scaleAndroid';
import ClusterMonitor from './clusterMonitor';

Sound.setCategory('Playback');

const { height, width } = Dimensions.get('window');

let emitterManager = null;
// if (Platform.OS === 'ios') {
emitterManager = new NativeEventEmitter(NativeModules.OCREmitterModule);
// }

const ocrEvent = {
  onEnterOCR: null,
  onExitOCR: null,
};

const styles = StyleSheet.create({
  homeMapView: {
    width,
    height,
  },
  objInoAreaView: {
    position: 'absolute',
    // paddingTop: 50,
    bottom: 0,
    left: 0,
    // zIndex: 2,
  },
  localtionView: {
    position: 'absolute',
    top: -50,
    left: 15,
    // zIndex: 3,
  },
  activeSafetyView: {
    position: 'absolute',
    top: -100,
    right: 15,
  },
  localtionImage: {
    width: 40,
    height: 40,
  },
  waringView: {
    position: 'absolute',
    top: -50,
    right: 15,
    // zIndex: 3,
  },
  warningImage: {
    width: 40,
    height: 40,
  },
  // 动画效果
  comUseClose: {
    height: 0,
  },
  comUseOpen: {
    height: 100,
  },
  otherInfoHide: {
    height: 0,
    backgroundColor: '#fff',
  },
  otherInfoShow: {
    // height: 100,
    height: 200,
  },
  mapBtnView: {
    position: 'absolute',
    top: 90,
    right: 15,
    zIndex: 1,
  },
  alarmIconShow: {
    height: 0,
    display: 'none',
  },
  hideModules: {
    height: 0,
    display: 'none',
  },
  searchCont: {
    position: 'absolute',
    width,
    height: 50,
    top: 30,
    left: 0,
    // zIndex: 1,
  },
  scaleAndroidStyle: {
    position: 'absolute',
    left: 65,
    zIndex: 99,
  },
  panoramaView: {
    width,
    height: Platform.OS === 'ios' ? height : height + 50,
    zIndex: -1,
    position: 'absolute',
    left: 0,
    top: 0,
    // backgroundColor: 'red',
  },
  clusterViewStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
  },
});

class Home extends Component {
  // static navigationOptions = () => ({
  //   header: null,
  // })

  static propTypes ={
    commonlyUseViewShow: PropTypes.bool,
    objDetShow: PropTypes.bool,
    mapTrafficEnabled: PropTypes.bool,
    bMapType: PropTypes.number,
    locationManager: PropTypes.bool,
    mapLocationChange: PropTypes.func,
    getMonitorIds: PropTypes.func,
    markers: PropTypes.object,
    basicLocationInfo: PropTypes.object,
    detailLocationInfo: PropTypes.object,
    subMonitorArr: PropTypes.array,
    socketTime: PropTypes.number,
    updateMonitorInfo: PropTypes.func,
    currentMonitorInfoId: PropTypes.string,
    updateMonitorAddressInfo: PropTypes.func,
    objDetChange: PropTypes.func, // 拖动动画
    comUseShow: PropTypes.func,
    routerIndex: PropTypes.number,
    mapAmplification: PropTypes.array,
    mapNarrow: PropTypes.array,
    clearData: PropTypes.func.isRequired,
    changeCurrentMonitorId: PropTypes.func.isRequired,
    monitors: PropTypes.array,
    activeMonitor: PropTypes.object, // 当前的监控对象
    ifgoSecurity: PropTypes.func.isRequired,
    randomNumber: PropTypes.number.isRequired,
    clearBasicInfoData: PropTypes.func.isRequired,
  };

  // 属性默认值
  static defaultProps ={
    commonlyUseViewShow: false,
    objDetShow: false,
    mapTrafficEnabled: false,
    bMapType: 1,
    locationManager: false,
    mapLocationChange: null,
    getMonitorIds: null,
    markers: [],
    basicLocationInfo: {},
    detailLocationInfo: {},
    subMonitorArr: [],
    socketTime: 0,
    updateMonitorInfo: null,
    currentMonitorInfoId: null,
    updateMonitorAddressInfo: null,
    objDetChange: null,
    comUseShow: null,
    routerIndex: null,
    mapAmplification: null,
    mapNarrow: null,
    monitors: null,
    activeMonitor: null,
  }

  constructor(props) {
    super(props);
    const { getMonitorIds, activeMonitor } = props;
    this.state = {
      socket: null,
      otherInfoShow: { // 当日里程数据栏的高度
        height: 80 + 100,
      },
      pageY: null, // 手指第一次触动屏幕的pageY
      initOtherInfoShowH: 0, //
      initdetailSensorsH: null, // 保存信息栏详情高度
      refSubInfoViewH: 0, // 数据详情头部那一块的高度 , 另顶部搜索框到屏幕顶部的距离为 80,底部为60
      alarmIconShow: true, // 报警和定位图标显示
      scrollEnabled: false, // 详情栏当日里程等的滚动
      canInfoContTopScroll: true, // 详情栏头部是否可以滑动
      otherInfoPosSign: 0, // 详情栏位置标志 0底部，1中间，2头部
      distinguishOtherInfoPosSign: 0, // 区分详情栏位置，因为 componentWillReceiveProps otherInfoPosSign会设置为1
      timestampStart: null, // 触摸开始时间戳
      param: null,
      token: null,
      accont: null,
      ifHideModules: false, // 地图点击空白切换隐藏其他模块
      ifWarnInfoScoket: false, // 是否有报警信息推上来
      ifZhonghuanWarnScoket: false, // 是否有主动安全报警信息推上来
      warnSocketTiming: true, // 报警推送需要间隔时间
      voiceSetting: true, // 系统声音设置
      shakeSetting: true, // 系统震动设置
      msgRemind: false, // 免打扰开关
      msgRemindStart: '20:00', // 免打扰开始时间
      msgRemindEnd: '08:00', // 免打扰结束时间
      activeMonitorInState: null,
      waringSwitchArr: [], // 缓存中的报警开关
      curUser: '', // 当前用户名
      oldAlarmType: [], // 旧的报警类型数据
      monitorFocus: [
        {
          monitorId: '',
          index: 0,
        },
      ], // 定位监控对象，进行居中显示
      aggrNum: null,
      alarmTypeData: [], // 川儿的报警数据
      isHome: true,
      rollCallDate: null,
      focusMonitorId: activeMonitor,
      callTheRollArr: [],
      mapRendered: false, // 地图加载完成
      centerPointState: false,
      // ifzIndex: true,
      appStateBackground: false, // app是否进入了后台
      adasFlag: -1, // 主动安全报警是否打开
      monitorFocusId: null,
      monitorFocusState: false,
      monitorIsFocus: false,
      scaleAndroidValue: null,
      // isBackground: false,
      socketConnected: false,
      panoramaState: false,
      customPanoView: null,
      activeLatestPoint: undefined,
      panoramaLoadSuccess: false,
      clustersData: null,
      isClustersViewShow: false,
      isSoundFlag: true,
    };
    this.createpanResponder();
    // const { getMonitorIds, activeMonitor } = props;

    getMonitorIds(activeMonitor);

    this.getStroageSetting(); // 获取缓存中的用户系统设置

    this.debouncetoAlarmCenter = throttle(this.toAlarmCenter, 5000, {
      trailing: false,
    });

    this.activeSafetyBtnEvent = throttle(this.toActiveSafety, 5000, {
      trailing: false,
    });

    this.getAlarmType(); // 获取报警数据
  }


  // 组件第一次渲染后调用
  componentDidMount() {
    setTimeout(() => {
      if (SplashScreen) {
        SplashScreen.hide();
      }
      const { activeLatestPoint } = this.state;
      if (activeLatestPoint === undefined) {
        this.setState({ activeLatestPoint: null });
      }
    }, 2000);
    onConnectionChange((type, effectiveType) => { this.netWorkonChange(type, effectiveType); });
    // // 初始化websocket对象
    // this.socketConnect();
    this.createSocketConnect();
    // 前后台状态监听绑定
    AppState.addEventListener('change', this.handleAppStateChange);

    // if (Platform.OS === 'ios') {
    ocrEvent.onEnterOCR = emitterManager.addListener('onEnterOCR',
      () => {
        this.setState({ isSoundFlag: false });
      });
    ocrEvent.onExitOCR = emitterManager.addListener('onExitOCR',
      () => {
        this.setState({ isSoundFlag: true });
      });
    // }
  }

  // 待markers不为null时进行socket连接
  createSocketConnect() {
    setTimeout(() => {
      const { markers } = this.props;
      if (markers !== null) {
        // 初始化websocket对象
        this.socketConnect();
      } else {
        this.createSocketConnect();
      }
    }, 1000);
  }

  // state更新后触发事件
  componentWillReceiveProps(nextProps) {
    const {
      objDetShow, monitors, activeMonitor, ifGoSecurity, randomNumber,
    } = nextProps;
    const { randomNumber: randomNumberprev } = this.props;
    const { initdetailSensorsH } = this.state;
    let { activeMonitorInState } = this.state;

    if (isEmpty(activeMonitorInState) && !isEmpty(monitors)) {
      if (!isEmpty(activeMonitor)) {
        // console.warn('activeMonitor111', activeMonitor);
        activeMonitorInState = activeMonitor;
      } else {
        // activeMonitorInState = [...monitors.values()][0];
        // console.warn('activeMonitor', monitors.get(0));
        activeMonitorInState = monitors.get(0);
      }
    }

    if (ifGoSecurity && randomNumber !== randomNumberprev) {
      go('security');
      // checkMonitorBindRisk({
      //   vehicleId: activeMonitorInState.markerId,
      // }).then((data) => {
      //   if (data.statusCode === 200) {
      //     if (data.obj === true) {
      //       go('security');
      //     } else {
      //       toastShow(getLocale('vehicleUnbindRisk'), { duration: 2000 });
      //     }
      //   } else {
      //     toastShow(getLocale('requestFailed'), { duration: 2000 });
      //   }
      // });
    }

    if (!ifGoSecurity && randomNumber !== randomNumberprev) {
      toastShow('您没有主动安全监控对象\n请联系平台管理员', { duration: 2000 });
    }

    // 切换车辆更新基本信息数据

    const { updateMonitorAddressInfo } = this.props;
    if (nextProps.currentMonitorInfoId !== null
      && nextProps.currentMonitorInfoId !== this.props.currentMonitorInfoId) {
      updateMonitorAddressInfo(nextProps.currentMonitorInfoId);
    }

    if (!objDetShow) {
      this.setState({
        initOtherInfoShowH: 0,
        otherInfoShow: { // 当日里程数据栏的高度
          height: initdetailSensorsH + 100,
        },
        alarmIconShow: true,
        scrollEnabled: false,
        canInfoContTopScroll: true,
        otherInfoPosSign: 0, // 详情栏位置标志 0底部，1中间，2头部
        activeMonitorInState,
        distinguishOtherInfoPosSign: 0,
      });
    } else {
      this.setState({
        otherInfoPosSign: 1,
        // distinguishOtherInfoPosSign: -1,
        activeMonitorInState,
      });
    }


    /* eslint react/destructuring-assignment:off */
  }


  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 頁面銷毀
  componentWillUnmount() {
    if (Platform.OS === 'android') {
      NativeModules.BaiduMapModule.show(Math.random());
    }
    const { socket } = this.state;
    if (socket !== null) {
      socket.close();
    }
    const {
      clearData,
      changeCurrentMonitorId,
      locationManager,
      mapLocationChange,
    } = this.props;
    clearData();
    // 清空页面当前中心定位点
    changeCurrentMonitorId(null);
    removeConnectionChange();
    AppState.removeEventListener('change', this.handleAppStateChange);

    if (locationManager) {
      mapLocationChange();
    }
    if (Platform.OS === 'ios') {
      ocrEvent.onEnterOCR.remove();
      ocrEvent.onExitOCR.remove();
    }
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      // console.warn('background');
      // this.cancelSub();
      // const { socket } = this.state;
      // if (socket !== null) {
      //   socket.close();
      // }
      this.setState({
        appStateBackground: true,
        // isBackground: true,
      });
    } else if (nextAppState === 'active') {
      // console.warn('active');
      this.setState({
        appStateBackground: false,
        // isBackground: false,
      });
      const { socketConnected } = this.state;
      if (!socketConnected) {
        NetInfo.getConnectionInfo().then(() => {
          // if (connectionInfo.type !== 'wifi') {
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
          // }
        });
      }
    }
  }

  // 取消订阅
  cancelSub() {
    const {
      token,
      accont,
      param,
      socket,
    } = this.state;
    if (param !== null) {
      const { socketTime } = this.props;
      const headers = { access_token: token };
      const unRequset = {
        desc: {
          MsgId: 40964,
          UserName: accont + socketTime,
        },
        data: param,
      };
      if (param.length > 0) {
        // 取消位置信息订阅
        socket.unsubscribealarm(headers, '/app/vehicle/unsubscribelocation', unRequset);
      }
      // 取消报警信息订阅
      const cancelStrs = {
        desc: {
          MsgId: 40964,
          UserName: accont + socketTime,
        },
        data: [],
      };
      socket.unsubscribealarm(headers, '/app/alarm/unsubscribe', cancelStrs);
      // 取消主动安全报警订阅
      socket.unsubscribealarm(headers, '/app/risk/security/unsubscribeRisk', cancelStrs);
    }
  }

  // 重新订阅
  againSub() {
    const {
      token,
      accont,
      param,
      socket,
      adasFlag,
    } = this.state;
    if (param !== null) {
      const { socketTime } = this.props;
      const headers = { access_token: token };
      const request = {
        desc: {
          MsgId: 40964,
          UserName: accont + socketTime,
        },
        data: param,
      };
      socket.subscribe(headers, `/user/${accont + socketTime}/location`, this.subCallBack.bind(this), '/app/vehicle/location', request);
      // 报警信息订阅
      const $this = this;
      // setTimeout(() => {
      socket.subscribe(headers, `/user/${accont + socketTime}/alarm`, $this.subAlarmScribe.bind($this), '/app/vehicle/subscribeStatus', request);

      // 主动安全报警信息订阅
      if (adasFlag === 1) {
        socket.subscribe(headers, `/user/${accont}/securityRiskRingBell`, $this.subscribeRiskCallback.bind($this), '/app/risk/security/subscribeRisk', request);
      }
      // }, 2000);
    }
  }

  // 订阅指定id监控对象位置onMapInitFinish信息
  subSingleMonitor(monitorId) {
    const {
      token,
      accont,
      socket,
    } = this.state;
    // console.warn('socket', socket);
    // console.warn('token', token);
    if (socket !== null && token !== null) {
      const param = [{ vehicleId: monitorId }];
      const { socketTime } = this.props;
      const headers = { access_token: token };
      const request = {
        desc: {
          MsgId: 40964,
          UserName: accont + socketTime,
        },
        data: param,
      };
      // console.warn('开始订阅');
      socket.subscribe(headers, `/user/${accont + socketTime}/location`, this.subCallBack.bind(this), '/app/vehicle/location', request);
    }
  }

  // 地图初始化完成
  onMapInitFinish() {
    this.setState({
      mapRendered: true,
    });
    setTimeout(() => {
      this.setState({ centerPointState: true });
    }, 100);
  }

  // 点击地图上车辆
  onPointClickEvent(data) {
    // const { nativeEvent: { monitorId } } = data;
    const monitorId = data;
    const { changeCurrentMonitorId, monitors } = this.props;

    if (!isEmpty(monitors)) {
      let activeMonitorInStateJson;
      for (let i = 0, len = monitors.size; i < len; i += 1) {
        if (monitorId === monitors.get(i).markerId) {
          activeMonitorInStateJson = monitors.get(i);
          break;
        }
      }
      // console.warn('activeMonitorInStateJson', activeMonitorInStateJson);
      if (activeMonitorInStateJson) {
        this.setState({
          activeMonitorInState: activeMonitorInStateJson,
          activeLatestPoint: {
            latitude: activeMonitorInStateJson.latitude,
            longitude: activeMonitorInStateJson.longitude,
            title: activeMonitorInStateJson.title,
          },
        }, () => {
          changeCurrentMonitorId(null);
          setTimeout(() => {
            changeCurrentMonitorId(monitorId);
          }, 100);
        });
      }
    }
  }


  // 地图可视区域内的标注点
  onInAreaOptions(data) {
    // console.warn('地图可视区域触发');
    const optionValues = data;
    if (optionValues.length > 0) {
      const { subMonitorArr } = this.props;
      const { socket } = this.state;
      const info = {
        subMonitorArr, // 已经订阅的监控对象
        optionValues, // 可视区域范围内的点
        socket,
      };
      // this.subMonitorFunc(info);
      this.socketConFlagCallBack(info);
    }
  }

  // 获取存储数据
  async getStroageSetting() {
    let ret = null;
    ret = await getLoginAccont();
    if (ret === null) {
      this.setState({
        storagrAccont: [],
      });
    }
    // try {
    //   ret = await storage.load({
    //     key: 'loginAccont',
    //     autoSync: true,
    //     syncInBackground: true,
    //     syncParams: {
    //       extraFetchOptions: {

    //       },
    //       someFlag: true,
    //     },
    //   });
    // } catch (e) {
    //   this.setState({
    //     storagrAccont: [],
    //   });
    // }

    if (ret && ret.length > 0) {
      // console.log('ret', ret);
      // 获取缓存系统设置
      let ret2 = null;
      try {
        ret2 = await storage.load({
          key: ret[0].accont,
          autoSync: true,
          syncInBackground: true,
          syncParams: {
            extraFetchOptions: {
            // 各种参数
            },
            someFlag: true,
          },
        });
      } catch (err) {
        // console.log('err', err);
      }

      if (ret2) {
        // console.log('ret2', ret2);
        this.setState({
          voiceSetting: ret2.voice, // 声音开关
          shakeSetting: ret2.shake, // 震动开关
          msgRemind: ret2.time, // 免打扰开关
          msgRemindStart: ret2.timeStart, // 免打扰开始时间
          msgRemindEnd: ret2.timeEnd, // 免打扰结束时间
        });
      }

      // 获取缓存报警开关设置
      let ret3 = null;
      ret3 = await getCheckAlarmType();
      // try {
      //   ret3 = await storage.load({
      //     key: 'checkSwitch',
      //     autoSync: true,
      //     syncInBackground: true,
      //     syncParams: {
      //       extraFetchOptions: {
      //       // 各种参数
      //       },
      //       someFlag: true,
      //     },
      //   });
      // } catch (err) {
      //   // console.log('err', err);
      // }

      if (ret3) {
        const user = ret[0].accont;
        const resust = JSON.parse(JSON.stringify(ret3));

        if (resust[user]) {
          // console.log('resust[user].checkArr', resust[user].checkArr);

          const arr = resust[user].checkArr || [];
          const oldAlarmType = resust[user].allType || [];

          this.setState({
            curUser: user, // 当前用户名
            waringSwitchArr: arr, // 声音开关
            oldAlarmType, // 旧的报警类型
          });
        } else {
          // 没有在报警开关设置缓存
          this.setState({
            waringSwitchArr: ['all'], // 声音开关
          });
        }
      }
    }
  }


  /**
   * 触发监控对象改变的action
   */
  handleMonitorChange=(activeMonitor) => {
    // console.warn('activeMonitor222', activeMonitor);
    // console.log('handleMonitorChange activeMonitor:', activeMonitor);

    this.setState({
      activeMonitorInState: activeMonitor,
      // monitorFocusId: activeMonitor.markerId,
      monitorFocusState: false,
      monitorIsFocus: false,
    });
    const {
      changeCurrentMonitorId,
      locationManager,
      mapLocationChange,
    } = this.props;
    changeCurrentMonitorId(activeMonitor.markerId);
    if (locationManager) {
      mapLocationChange();
    }
    this.subSingleMonitor(activeMonitor.markerId);
  }

  handleMonitorClick=(activeMonitor) => {
    // const { changeCurrentMonitorId } = this.props;
    // changeCurrentMonitorId(activeMonitor.markerId);
    const { monitorFocus } = this.state;
    this.setState({
      monitorFocus: [{
        monitorId: activeMonitor.markerId,
        index: monitorFocus[0].index + 1,
      }],
      // monitorFocusId: activeMonitor.markerId,
      monitorFocusState: false,
      monitorIsFocus: false,
    });
    const { locationManager, mapLocationChange } = this.props;
    if (locationManager) {
      mapLocationChange();
    }
    this.subSingleMonitor(activeMonitor.markerId);
  }

  handleMonitorDbClick=(activeMonitor) => {
    const monitorId = activeMonitor.markerId;
    this.setState({
      monitorFocusId: monitorId,
      monitorFocusState: true,
      monitorIsFocus: true,
    });
  }

  // 详情栏当日里程数据高度变化后改变父组件高度
  detailSensorsHChangeFun=(H) => {
    if (Platform.OS === 'android') {
      this.setState({
        otherInfoShow: {
          height: H + 100,
        },
        initdetailSensorsH: H,
        // refSubInfoViewH: 96,
      });
    } else {
      this.refSubInfoView.measure((fx, fy, w, h) => {
        this.setState({
          otherInfoShow: {
            height: H + 100,
          },
          initdetailSensorsH: H,
          refSubInfoViewH: h,
        });
      });
    }
  }

  componentOnlayOut=(H) => {
    this.setState({
      refSubInfoViewH: H,
    });
  }

  // 手势触摸操作
  createpanResponder=() => {
    this.panResponderObj = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        this.startTouch(evt);
      },
      onPanResponderMove: (evt) => {
        this.gestureMove(evt);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.gestureHandleFun(evt, gestureState);
      },
      onPanResponderTerminate: () => {
        // 另一个组件已经成为了新的响应者，所以当前手势将被取消。
        // console.log('另一个组件已经成为了新的响应者，所以当前手势将被取消');
      },
      onShouldBlockNativeResponder: () => true
      ,
    });
    this.otherInfoHeadpanResponderObj = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        this.startTouch(evt);
      },
      onPanResponderMove: (evt) => {
        this.gestureMove(evt);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.gestureHandleFun(evt, gestureState);
      },
      onPanResponderTerminate: () => {
        // 另一个组件已经成为了新的响应者，所以当前手势将被取消。
        // console.log('另一个组件已经成为了新的响应者，所以当前手势将被取消');
      },
      onShouldBlockNativeResponder: () => true
      ,
    });
  }

  // 开始触摸
  startTouch=(evt) => {
    const {
      otherInfoPosSign,
      refSubInfoViewH,
      otherInfoShow: { height: H },
    } = this.state;

    const pageY = evt.nativeEvent.pageY; // 刚开始触摸时的坐标
    // console.log('开始时间戳', evt.nativeEvent.timestamp);
    const componentH = height - refSubInfoViewH - 140 - 10;


    const singNum = componentH === H ? 2 : otherInfoPosSign;

    this.setState({
      pageY,
      timestampStart: evt.nativeEvent.timestamp,
      distinguishOtherInfoPosSign: singNum,
      // ifzIndex: false,
    });

    const { otherInfoShow: { height: h } } = this.state;
    const { objDetShow } = this.props;
    if (objDetShow) {
      this.setState({
        initOtherInfoShowH: h,
      });
    }
  }

  // 手指滑动
  gestureMove=(evt) => {
    const {
      pageY: pageYState,
      initOtherInfoShowH,
    } = this.state;
    const { objDetShow, objDetChange } = this.props;
    const pageY = evt.nativeEvent.pageY;
    const differenceVal = pageY - pageYState;

    // console.log('initOtherInfoShowH - differenceVal', initOtherInfoShowH - differenceVal);
    if (initOtherInfoShowH - differenceVal < 0) {
      // console.warn('initOtherInfoShowH - differenceVal',initOtherInfoShowH - differenceVal);

    }

    this.setState({
      otherInfoShow: {
        height: initOtherInfoShowH - differenceVal > 0 ? initOtherInfoShowH - differenceVal : 0,
      },
    });
    if (!objDetShow && differenceVal < 0) { // 第一种，显示里程信息等
      objDetChange();
    }
  }

  // 手势拖动结束方法
  gestureHandleFun=(evt) => {
    const {
      pageY: pageYState,
      initdetailSensorsH,
      // otherInfoShow,
      refSubInfoViewH,
      timestampStart,
      distinguishOtherInfoPosSign,
    } = this.state;
    const pageY = evt.nativeEvent.pageY;
    const timestamp = evt.nativeEvent.timestamp;
    const touchTime = timestamp - timestampStart;
    // console.log('结束时间戳', touchTime);

    // const { height: H } = otherInfoShow;
    const differenceVal = pageYState - pageY;
    const { objDetChange, objDetShow } = this.props;

    const componentH = height - refSubInfoViewH - 140 - 10;
    if (differenceVal > 0) { // 向上拉
      // const componentH = height - refSubInfoViewH - 140 - 100 - 10;

      if ((touchTime > 500) && (differenceVal > (initdetailSensorsH + 100))) { // 慢慢画上顶部
        this.setState({
          otherInfoShow: {
            height: componentH,
          },
          initOtherInfoShowH: componentH,
          alarmIconShow: false,
          scrollEnabled: true,
          canInfoContTopScroll: false,
          otherInfoPosSign: 2,
          distinguishOtherInfoPosSign: 2,
        });
      } else if (distinguishOtherInfoPosSign === 0) {
        this.setState({
          otherInfoShow: {
            height: initdetailSensorsH + 100,
          },
          initOtherInfoShowH: initdetailSensorsH + 100,
          alarmIconShow: true,
          scrollEnabled: false,
          otherInfoPosSign: 1,
          distinguishOtherInfoPosSign: 1,
        });
      } else {
        // const componentH = height - refSubInfoViewH - 140 - 100 - 10;

        this.setState({
          otherInfoShow: {
            height: componentH,
          },
          initOtherInfoShowH: componentH + 100,
          alarmIconShow: false,
          scrollEnabled: true,
          canInfoContTopScroll: false,
          otherInfoPosSign: 2,
          distinguishOtherInfoPosSign: 2,
        });
      }
    } else if (differenceVal < 0) { // 向下拉
      if (objDetShow) {
        if (touchTime > 500 && -differenceVal > initdetailSensorsH + 100 + 100) {
          objDetChange();
        } else if (distinguishOtherInfoPosSign === 2) {
          this.setState({
            otherInfoShow: {
              height: initdetailSensorsH + 100,
            },
            initOtherInfoShowH: initdetailSensorsH + 100,
            alarmIconShow: true,
            scrollEnabled: false,
            otherInfoPosSign: 1,
            distinguishOtherInfoPosSign: 1,
          });
        } else {
          objDetChange();
        }
      } else { // 这种情况用户在详情栏位于最底部时在向下拉，结束后还原高度
        this.setState({
          otherInfoShow: {
            height: 180,
          },
        });
      }
    }
    // setTimeout(() => {
    //   this.setState({
    //     ifzIndex: true,
    //   });
    // }, 300);
  }

  scrollToToporBtm=(data) => {
    const {
      otherInfoPosSign, refSubInfoViewH, initdetailSensorsH, distinguishOtherInfoPosSign,
    } = this.state;
    const { objDetShow, objDetChange } = this.props;

    if (data === 'top') {
      // (distinguishOtherInfoPosSign === 0 && otherInfoPosSign === 1)
      // 这种情况是因为点击底部左下角图标再拉动csrollview向下时内容向上拉的问题

      if (((distinguishOtherInfoPosSign === 1) && objDetShow)
      || (distinguishOtherInfoPosSign === 0 && otherInfoPosSign === 1)) {
        objDetChange();
      } else if (distinguishOtherInfoPosSign === 2) {
        this.setState({
          otherInfoShow: {
            height: initdetailSensorsH + 100,
          },
          initOtherInfoShowH: initdetailSensorsH + 100,
          alarmIconShow: true,
          scrollEnabled: false,
          otherInfoPosSign: 1,
          distinguishOtherInfoPosSign: 1,
        });
      }
    } else if (data === 'btm') {
      if (otherInfoPosSign === 1) {
        // const componentH = height - refSubInfoViewH - 140 - 100 - 10;
        const componentH = height - refSubInfoViewH - 140 - 10;
        this.setState({
          otherInfoShow: {
            height: componentH,
          },
          initOtherInfoShowH: componentH + 100,
          alarmIconShow: false,
          scrollEnabled: true,
          canInfoContTopScroll: false,
          otherInfoPosSign: 2,
          distinguishOtherInfoPosSign: 2,
        });
      }
    }
  }

  // 地图点击
  mapClick=() => {
    // this.refSubInfoView.measure((fx, fy, w, h) => {
    const { ifHideModules } = this.state;
    const { objDetChange, objDetShow } = this.props;
    if ((objDetShow && !ifHideModules)) {
      objDetChange();
    }
    this.setState({
      ifHideModules: !ifHideModules,
      // refSubInfoViewH: h,
    });
    // });
  }

  toAlarmCenter() {
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }
    go('alarmCenter');
  }

  // socket建立连接
  async socketConnect() {
    const appSettings = await getUserSetting();

    const state = await getLoginState();
    // const appSettings = await storage.load({
    //   key: 'appSettings',
    // });
    // const state = await storage.load({
    //   key: 'loginState',
    // });
    const headers = { access_token: state.token };
    const socket = new WebsocketUtil();
    socket.init('/clbs/vehicle', headers, this.subFocusMonitorId, this.socketCloseEvent);
    this.setState({
      socket,
      aggrNum: appSettings.app.aggrNum,
      adasFlag: appSettings.adasFlag,
      token: state.token,
    });

    // this.subFocusMonitorId();
  }

  // socket关闭监听事件
  socketCloseEvent = () => {
    // console.warn('关闭了socket');
    this.setState({ socketConnected: false });
  }

  // 订阅聚焦监控对象
  subFocusMonitorId = () => {
    const { focusMonitorId } = this.state;
    // setTimeout(() => {
    // if (socket.conFlag) {
    this.setState({ socketConnected: true });
    if (focusMonitorId !== null) {
      this.subSingleMonitor(focusMonitorId.markerId);
    }
    // } else {
    //   this.subFocusMonitorId();
    // }
    // }, 500);
  }

  // 判断socket是否连接成功
  socketConFlagCallBack(info) {
    const { focusMonitorId, socketConnected } = this.state;

    setTimeout(() => {
      if (socketConnected) {
        if (focusMonitorId !== null) {
          this.subSingleMonitor(focusMonitorId.markerId);
        }
        this.subMonitorFunc(info);
      } else {
        this.socketConFlagCallBack(info);
      }
    }, 1000);
  }

  // 取消订阅和订阅监控对象位置信息
  async subMonitorFunc(info) {
    const state = await getLoginState();
    const userInfo = await getLoginAccont();
    // const state = await storage.load({
    //   key: 'loginState',
    // });
    // const userInfo = await storage.load({
    //   key: 'loginAccont',
    // });
    const subAffterInfo = info.subMonitorArr; // 已经订阅过的监控对象
    const subInfo = info.optionValues; // 区域范围内的监控对象
    const msg = this.screenMonitor(subAffterInfo, subInfo);
    // console.log(msg);
    // 取消订阅之前订阅的监控对象

    this.unSubAddressFunc(
      info.socket,
      // subAffterInfo,
      msg[0],
      state.token,
      userInfo[0].accont,
    );
    // 订阅监控对象
    // const subInfo = info.optionValues; // 区域范围内的监控对象
    this.subAddressFunc(
      info.socket,
      // subInfo,
      msg[1],
      state.token,
      userInfo[0].accont,
    );
    const { saveSubInfo } = this.props;
    saveSubInfo(subInfo);
  }

  // 筛选出区域内未订阅和区域外未取消订阅的监控对象
  screenMonitor(subMonitorArr, optionValues) {
    // 筛选出区域内未订阅监控对象
    const subArr = [];
    for (let i = 0; i < optionValues.length; i += 1) {
      const id = optionValues[i]; // [0].markerId;
      let flag = false;
      for (let j = 0; j < subMonitorArr.length; j += 1) {
        const oid = subMonitorArr[j]; // [0].markerId;
        if (id === oid) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        subArr.push({
          vehicleId: id,
        });
      }
    }
    // 筛选出区域外未取消订阅监控对象
    const unSubArr = [];
    for (let i = 0; i < subMonitorArr.length; i += 1) {
      const id = subMonitorArr[i]; // [0].markerId;
      let flag = false;
      for (let j = 0; j < optionValues.length; j += 1) {
        const oid = optionValues[j]; // [0].markerId;
        if (id === oid) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        unSubArr.push({
          vehicleId: id,
        });
      }
    }
    return [unSubArr, subArr];
  }

  // 取消订阅位置信息
  unSubAddressFunc(socket, info, token, accont) {
    if (info.length > 0) {
      const { socketTime } = this.props;
      const headers = { access_token: token };
      const unParam = info;
      // for (let i = 0; i < info.length; i += 1) {
      //   unParam.push({
      //     vehicleId: info[i].vehicleId,
      //   });
      // }
      const unRequset = {
        desc: {
          MsgId: 40964,
          UserName: accont + socketTime,
        },
        data: unParam,
      };
      //  if (unParam.length > 0) {
      socket.unsubscribealarm(headers, '/app/vehicle/unsubscribelocation', unRequset);
      // }
    }
  }

  // 开始订阅位置信息
  subAddressFunc(socket, info, token, accont) {
    const { socketTime } = this.props;
    const { adasFlag } = this.state;
    const headers = { access_token: token };
    const param = info;

    const request = {
      desc: {
        MsgId: 40964,
        UserName: accont + socketTime,
      },
      data: param,
    };
    this.setState({
      // param,
      token,
      accont,
    });
    // 位置信息订阅
    if (param.length > 0) {
      this.setState({ param });
      // console.log('订阅1', headers);
      socket.subscribe(headers, `/user/${accont + socketTime}/location`,
        this.subCallBack.bind(this), '/app/vehicle/location', request);
    }

    // 报警信息订阅
    socket.subscribe(headers, `/user/${accont + socketTime}/alarm`,
      this.subAlarmScribe.bind(this), '/app/vehicle/subscribeStatus', request);

    // 主动安全报警信息订阅
    if (adasFlag === 1) {
      socket.subscribe(headers, `/user/${accont}/securityRiskRingBell`,
        this.subscribeRiskCallback.bind(this), '/app/risk/security/subscribeRisk', request);
    }

    // return param;
  }

  // 位置信息订阅成功
  subCallBack(msg) {
    /* eslint prefer-destructuring:off */
    const data = JSON.parse(msg.body);
    if (data.desc !== 'neverOnline') {
      const { activeMonitorInState, panoramaState } = this.state;
      const msgHead = data.data.msgHead;
      const msgBody = data.data.msgBody;
      // console.warn(msgBody.monitorInfo.monitorName, msgBody);
      if (msgHead.msgID === 513) { // 点名数据
        // console.log('点名数据', msgBody);
        const { callTheRollArr } = this.state;
        const mid = msgBody.monitorInfo.monitorId;
        const arr = callTheRollArr;
        const index = arr.indexOf(mid);
        arr.splice(index, 1);
        if (index !== -1) {
          this.setState({ callTheRollArr: arr });
          toastShow(getLocale('locationUpdateSuccess'), { duration: 2000 });

          // rollCallDate
          const coordinates = bdEncrypt(msgBody.longitude, msgBody.latitude);
          const time = convertSeconds(msgBody.gpsTime);
          const i = Math.floor(Number(msgBody.direction) / 360);
          const angle = Number(msgBody.direction) - 360 * i + 270;
          const value = {
            markerId: msgBody.monitorInfo.monitorId,
            latitude: coordinates.bdLat,
            longitude: coordinates.bdLng,
            status: msgBody.stateInfo,
            angle,
            random: Math.random(),
            time,
          };
          if (activeMonitorInState && activeMonitorInState.markerId === value.markerId) {
            this.setState({
              activeLatestPoint: {
                latitude: coordinates.bdLat,
                longitude: coordinates.bdLng,
                title: msgBody.monitorInfo.monitorName,
              },
            });
          }
          this.setState({ rollCallDate: value });
        }
        // const { currentMonitorInfoId } = this.props;
        // console.log(currentMonitorInfoId === msgBody.monitorInfo.monitorId);
      } else if (msgHead.msgID === 512) {
        // 组装监控对象地图更新数据
        // 组装图片地址  车、人和物
        const monitorType = msgBody.monitorInfo.monitorType;
        const objIcon = monitorIcon(monitorType, msgBody.monitorInfo.monitorIcon);
        const coordinates = bdEncrypt(msgBody.longitude, msgBody.latitude);
        const time = convertSeconds(msgBody.gpsTime);
        const i = Math.floor((Number(msgBody.direction) + 270) / 360);
        const angle = (Number(msgBody.direction) + 270) - 360 * i;
        const value = {
          markerId: msgBody.monitorInfo.monitorId,
          latitude: coordinates.bdLat,
          longitude: coordinates.bdLng,
          title: msgBody.monitorInfo.monitorName,
          ico: objIcon,
          speed: 10,
          status: msgBody.stateInfo,
          angle,
          random: Math.random(),
          time,
          monitorType: msgBody.monitorInfo.monitorType,
        };

        if (activeMonitorInState && activeMonitorInState.markerId === value.markerId) {
          this.setState({
            activeLatestPoint: {
              latitude: coordinates.bdLat,
              longitude: coordinates.bdLng,
              title: msgBody.monitorInfo.monitorName,
            },
          });
        }

        const monitorMap = new Map();
        monitorMap.set(msgBody.monitorInfo.monitorId, value);

        const {
          updateMonitorInfo,
        } = this.props;
        updateMonitorInfo(monitorMap);
      }
      const { focusMonitorId } = this.state;
      if (focusMonitorId !== null) {
        if (focusMonitorId.markerId === msgBody.monitorInfo.monitorId) {
          const { changeCurrentMonitorId } = this.props;
          changeCurrentMonitorId(null);
          setTimeout(() => {
            changeCurrentMonitorId(focusMonitorId.markerId);
            this.setState({ focusMonitorId: null });
          }, 300);
        }
      }

      // 更新基础位置信息和详细位置信息
      const { currentMonitorInfoId } = this.props;
      if (currentMonitorInfoId === msgBody.monitorInfo.monitorId) {
        const { updateMonitorAddressInfo } = this.props;

        updateMonitorAddressInfo(currentMonitorInfoId);
      }
    }
  }

  // 获取报警数据类型
  getAlarmType=() => {
    const newAlarmType = [];
    let alarmTypeData = {};
    getAlarmSetting().then((res) => {
      alarmTypeData = res;
      if (alarmTypeData.obj.settings.length === 0) {
        getUserSetting().then((settingResult) => {
          alarmTypeData.obj.settings = settingResult.alarmTypes;
        });
      }
      if (alarmTypeData.statusCode === 200) {
        const typeArr = alarmTypeData.obj.settings;
        const typeLen = typeArr.length;
        for (let i = 0; i < typeLen; i += 1) {
          newAlarmType.push(`switch${typeArr[i].type}`);
        }
      }
      // return newAlarmType;
      this.setState({
        alarmTypeData: newAlarmType,
      });
    });
  }

  // 数组合并去重
   mergeArray=(arr1, arr2) => {
     const arr = arr1;
     for (let i = 0; i < arr2.length; i += 1) {
       if (arr.indexOf(arr2[i]) === -1) {
         arr.push(arr2[i]);
       }
     }
     return arr;
   }

   // 主动安全报警订阅回调函数
   subscribeRiskCallback=() => {
     const {
       warnSocketTiming, appStateBackground, ifZhonghuanWarnScoket,
       msgRemind, msgRemindStart, msgRemindEnd, shakeSetting, voiceSetting, isSoundFlag,
     } = this.state;
     if (warnSocketTiming && !appStateBackground) {
       this.setState({
         warnSocketTiming: false,
       }, () => {
         if (!ifZhonghuanWarnScoket) {
           this.setState({
             ifZhonghuanWarnScoket: true,
           }, () => {
             let ifRemind = false;
             if (msgRemind) { // 是否免打扰
               // const dayStart = new Date('2018/01/01 08:00');
               const datStart = new Date(`2018/01/01 ${msgRemindStart}`);
               let datEnd = new Date(`2018/01/01 ${msgRemindEnd}`);
               if (datStart.getTime() > datEnd.getTime()) {
                 datEnd = new Date(`2018/01/02 ${msgRemindEnd}`);
               }
               const nowDay = new Date();
               const nowH = nowDay.getHours();
               const nowM = nowDay.getMinutes();
               const nowtime = new Date(`2018/01/01 ${nowH}:${nowM}`);

               if (!(nowtime.getTime() > datStart.getTime()
              && nowtime.getTime() < datEnd.getTime())) {
                 ifRemind = true;
               }
             } else {
               ifRemind = true;
             }

             if (shakeSetting && ifRemind && isSoundFlag) { // 震动
               Vibration.vibrate();
             }

             if (voiceSetting && ifRemind && isSoundFlag) { // 声音提醒
               const s = new Sound(warningaudio, (e) => {
                 if (e) {
                   return;
                 }

                 s.play(() => {
                   s.release();
                 });
               });
             }
             setTimeout(() => {
               this.setState({
                 ifZhonghuanWarnScoket: false,
               });
             }, 1000);
           });
         }

         setTimeout(() => {
           this.setState({
             warnSocketTiming: true,
           });
         }, 5000);
       });
     }
   }

  // 报警订阅回调函数
  subAlarmScribe=(data) => {
    const {
      ifWarnInfoScoket,
      shakeSetting,
      voiceSetting,
      msgRemind, // 免打扰开关
      msgRemindStart, // 免打扰开始时间
      msgRemindEnd, // 免打扰结束时间
      waringSwitchArr,
      oldAlarmType,
      curUser,
      warnSocketTiming,
      alarmTypeData,
      appStateBackground,
      isSoundFlag,
    } = this.state;
    // 筛选出最新的报警数据类型

    const newAlarmType = [];
    const checkLen = waringSwitchArr.length;
    for (let i = 0; i < checkLen; i += 1) {
      if (alarmTypeData.indexOf(waringSwitchArr[i]) !== -1) {
        newAlarmType.push(waringSwitchArr[i]);
      }
    }

    if (alarmTypeData !== undefined) {
      const len = alarmTypeData.length;
      for (let i = 0; i < len; i += 1) {
        if (oldAlarmType.indexOf(alarmTypeData[i]) === -1) {
          newAlarmType.push(alarmTypeData[i]);
        }
      }
      // 保存新的报警类型到缓存中
      const alarmObj = {};
      alarmObj[curUser] = {
        checkArr: newAlarmType,
        allType: alarmTypeData,
      };
      storage.save({
        key: 'checkSwitch',
        data: alarmObj,
      });
    }

    const dataBody = JSON.parse(data.body);
    const { data: { msgBody: { pushAlarmSet, globalAlarmSet } } } = dataBody;
    // return;

    let pushAlarmSetArr = [];
    if (pushAlarmSet !== '' && pushAlarmSet !== undefined && pushAlarmSet !== null) {
      if (pushAlarmSet.indexOf(',') === -1) {
        pushAlarmSetArr = [pushAlarmSet];
      } else {
        pushAlarmSetArr = pushAlarmSet.split(',');
      }
    } else {
      pushAlarmSetArr = [];
    }
    // const pushAlarmSetArr = pushAlarmSet !== '' ? pushAlarmSet.split(',') : [];// 局部报警

    let globalAlarmSetArr = [];
    if (globalAlarmSet !== '' && globalAlarmSet !== undefined) {
      if (globalAlarmSet.indexOf(',') === -1) {
        globalAlarmSetArr = [globalAlarmSet];
      } else {
        globalAlarmSetArr = globalAlarmSet.split(',');
      }
    } else {
      globalAlarmSetArr = [];
    }

    // const globalAlarmSetArr = globalAlarmSet !== '' ? globalAlarmSet.split(',') : [];// 全局报警

    const alarmSetArr = this.mergeArray(pushAlarmSetArr, globalAlarmSetArr);

    if (alarmSetArr.length && !appStateBackground) {
      // this.setState({
      //   warnSocketTiming: false,
      // }, () => {
      // 判断推送的报警是否存在于缓存的报警开关
      let ifSwitch = false;


      if (newAlarmType.length && newAlarmType.length > 0) {
        // const dataBody = JSON.parse(data.body);
        // const { data: { msgBody: { pushAlarmSet } } } = dataBody;
        // const pushAlarmSetArr = pushAlarmSet.split(',');

        for (let i = 0; i < alarmSetArr.length; i += 1) {
          for (let j = 0; j < newAlarmType.length; j += 1) {
            const num = Number(newAlarmType[j].replace('switch', ''));
            if (parseInt(alarmSetArr[i], 10) === num) {
              ifSwitch = true;
            }
          }
        }
      }
      //  else {
      //   ifSwitch = true;
      // }


      if (!ifWarnInfoScoket && ifSwitch && warnSocketTiming) {
        this.setState({
          ifWarnInfoScoket: true,
          warnSocketTiming: false,
        }, () => {
          let ifRemind = false;
          if (msgRemind) { // 是否免打扰
            // const dayStart = new Date('2018/01/01 08:00');
            const datStart = new Date(`2018/01/01 ${msgRemindStart}`);
            let datEnd = new Date(`2018/01/01 ${msgRemindEnd}`);
            if (datStart.getTime() > datEnd.getTime()) {
              datEnd = new Date(`2018/01/02 ${msgRemindEnd}`);
            }
            const nowDay = new Date();
            const nowH = nowDay.getHours();
            const nowM = nowDay.getMinutes();
            const nowtime = new Date(`2018/01/01 ${nowH}:${nowM}`);

            if (!(nowtime.getTime() > datStart.getTime()
              && nowtime.getTime() < datEnd.getTime())) {
              ifRemind = true;
            }
          } else {
            ifRemind = true;
          }

          if (shakeSetting && ifRemind && isSoundFlag) { // 震动
            Vibration.vibrate();
          }

          if (voiceSetting && ifRemind && isSoundFlag) { // 声音提醒
            const s = new Sound(warningaudio, (e) => {
              if (e) {
                return;
              }

              s.play(() => {
                s.release();
              });
            });
          }


          setTimeout(() => {
            this.setState({
              ifWarnInfoScoket: false,
            });
          }, 1000);
          setTimeout(() => {
            this.setState({
              warnSocketTiming: true,
            });
          }, 5000);
        });
      }
    // });
    }
  }

  // 点名下发
  rollCallIssued = (monitorId) => {
    checkMonitorOnline({
      monitorId,
    }).then((res) => {
      if (res.statusCode === 200) {
        if (res.obj === 1) { // 校验通过
          this.rollCallEvent(monitorId);
        } else if (res.obj === 2) {
          toastShow(getLocale('monitorOffLine'), { duration: 2000 });
        } else if (res.obj === 4) {
          toastShow(getLocale('monitorNeverOnLine'), { duration: 2000 });
        } else if (res.obj === 3) {
          toastShow(getLocale('monitor808CancelIssued'), { duration: 2000 });
        }
      }
    });
  }

  async rollCallEvent(monitorId) {
    const state = await getLoginState();
    const userInfo = await getLoginAccont();
    // const state = await storage.load({
    //   key: 'loginState',
    // });
    // const userInfo = await storage.load({
    //   key: 'loginAccont',
    // });
    const accont = userInfo[0].accont;
    const token = state.token;
    const issuedState = await setRollCallIssued({ monitorId });
    if (issuedState.statusCode === 200) {
      toastShow(getLocale('getUpdateLocation'), { duration: 2000 });
      const { callTheRollArr } = this.state;
      const arr = callTheRollArr;
      arr.push(monitorId);
      this.setState({ callTheRollArr: arr });
      // 下发成功
      const {
        // token,
        socket,
        // accont,
      } = this.state;
      const { socketTime } = this.props;
      const headers = { access_token: token };
      const request = {
        desc: {
          MsgId: 40964,
          UserName: accont + socketTime,
          cmsgSN: issuedState.obj.msgSN,
        },
        data: [{ vehicleId: monitorId }],
      };
      socket.subscribe(headers, `/user/${accont + socketTime}/realLocation`,
        this.subCallBack.bind(this), '/app/vehicle/realLocation', request);
    } else {
      toastShow(getLocale('locationUpdateFailed'), { duration: 2000 });
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

  getBtmHeight = () => {
    const { ifHideModules, otherInfoShow: { height: h }, refSubInfoViewH } = this.state;
    const { objDetShow, commonlyUseViewShow } = this.props;
    let btmHeight = 0;
    if (!ifHideModules) {
      if (!objDetShow) {
        if (!commonlyUseViewShow) {
          btmHeight = refSubInfoViewH + 60;
        } else {
          btmHeight = refSubInfoViewH + 60 + 100;
        }
      } else {
        btmHeight = refSubInfoViewH + 60 + h;
      }
    }
    return Math.ceil(btmHeight + 32);
  }

  locationBtnEvent = () => {
    const { locationManager, mapLocationChange } = this.props;
    if (!locationManager) {
      mapLocationChange();
    } else {
      mapLocationChange();
      setTimeout(() => {
        mapLocationChange();
      }, 500);
    }
  }

  toActiveSafety = () => {
    const { ifgoSecurity } = this.props;
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }

    ifgoSecurity();
    // go('security');
  }

  // 网络变化
  netWorkonChange = (type) => {
    if (type !== 'none' || type !== 'unknown') {
      const { socketConnected } = this.state;

      if (!socketConnected) {
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
    }
  }

  onMonitorLoseFocus() {
    this.setState({ monitorIsFocus: false, monitorFocusState: false });
  }

  // 避免socket重复建立连接，轮询判断reconnectionState是否为true
  againSubJdge() {
    // setTimeout(() => {
    // const { socketConnected } = this.state;
    // console.warn('socketConnected', socketConnected);
    // if (socketConnected) {
    //   console.warn('againsub');
    // if (socket.socket !== null) {
    this.againSub();
    // }
    // } else {
    //   this.againSubJdge();
    // }
    // }, 1000);
  }

  onMyScale(data) {
    if (Platform.OS === 'android') {
      const arr = data.split(',');
      this.setState({ scaleAndroidValue: arr[0] });
    }
  }

  // 开启地图全景
  openPanorama = () => {
    const { activeMonitorInState, customPanoView, activeLatestPoint } = this.state;
    // console.warn('activeLatestPoint', activeLatestPoint);
    // console.warn('customPanoView', customPanoView);
    // if (customPanoView === null && activeLatestPoint === null) {
    //   console.warn('activeMonitorInState', activeMonitorInState);
    //   if (activeMonitorInState !== null
    //     && activeMonitorInState.latitude
    //     && activeMonitorInState.longitude) {
    //     console.warn('activeMonitorInState', activeMonitorInState);
    //     this.setState({
    //       panoramaState: true,
    //       customPanoView: {
    //         latitude: activeLatestPoint.latitude,
    //         longitude: activeLatestPoint.longitude,
    //         title: activeMonitorInState.title,
    //       },
    //     });
    //   }
    // } else if (activeLatestPoint !== null) {
    //   console.warn('activeLatestPoint', activeLatestPoint);
    if (activeLatestPoint !== null && activeLatestPoint !== undefined) {
      if (this.isDomesticLocation(activeLatestPoint.latitude, activeLatestPoint.longitude)) {
        this.setState({
          panoramaState: true,
          customPanoView: activeLatestPoint,
        });
      } else {
        toastShow(getLocale('locationBeyondScope'), { duration: 2000 });
      }
    } else if (activeLatestPoint !== undefined) {
      toastShow(getLocale('neverOnlinePanorama'), { duration: 2000 });
    } else {
      toastShow(getLocale('dataInitialization'), { duration: 2000 });
    }
  }

  // 关闭地图全景通知事件
  onPanoramaClose = () => {
    this.setState({
      panoramaState: false,
      panoramaLoadSuccess: false,
    });
  }

  // 地图全景加载失败通知事件
  onPanoramaFailed = () => {
    this.setState({
      panoramaState: false,
      panoramaLoadSuccess: false,
    });
    toastShow(getLocale('panoramaFailed'), { duration: 2000 });
  }

  // 地图全景加载成功通知事件
  onPanoramaSuccess = () => {
    this.setState({ panoramaLoadSuccess: true });
  }

  locationComplete = (data) => {
    if (data === 'false') { // 定位成功
      toastShow(getLocale('locationManagerFailed'), { duration: 2000 });
    }
  }

  /**
   * 监控对象从未上线
   */
  neveronlinemonitorchange = () => {
    this.setState({ activeLatestPoint: null });
    // const { clearBasicInfoData } = this.props;
    // clearBasicInfoData();
  }

  onClustersClickEvent = (data) => {
    if (Platform.OS === 'ios') {
      this.setState({ clustersData: data, isClustersViewShow: true });
    } else {
      this.setState({ clustersData: JSON.parse(data), isClustersViewShow: true });
    }
  }

  isDomesticLocation = (lat, lng) => (lat >= 3.86 && lat <= 53.55 && lng >= 73.66 && lng <= 135.05);

  /**
   * 数据聚合弹窗监控对象单击事件
   */
  clustersItemClick = (params) => {
    const { monitorId } = params;
    this.setState({ isClustersViewShow: false }, () => {
      this.onPointClickEvent(monitorId);
    });
  }

  /**
   * 数字聚合弹窗关闭事件
   */
  clustersClose = () => {
    this.setState({ isClustersViewShow: false });
  }

  render() {
    const {
      commonlyUseViewShow,
      objDetShow,
      mapTrafficEnabled,
      bMapType,
      locationManager,
      // mapLocationChange,
      markers,
      basicLocationInfo,
      detailLocationInfo,
      currentMonitorInfoId,
      mapAmplification,
      mapNarrow,
      monitors,
    } = this.props;


    const {
      otherInfoShow,
      // otherInfoShow: { height: otherInfoShowH },
      alarmIconShow,
      scrollEnabled,
      ifHideModules,
      ifWarnInfoScoket,
      activeMonitorInState,
      refSubInfoViewH,
      monitorFocus,
      aggrNum,
      isHome,
      rollCallDate,
      mapRendered,
      centerPointState,
      ifZhonghuanWarnScoket,
      adasFlag,
      monitorFocusId,
      monitorFocusState,
      monitorIsFocus,
      scaleAndroidValue,
      param,
      // isBackground,
      // ifzIndex,
      socketConnected,
      panoramaState,
      customPanoView,
      panoramaLoadSuccess,
      isClustersViewShow,
      clustersData,
    } = this.state;

    const comUseView = commonlyUseViewShow ? styles.comUseOpen : null;
    const otherInfoView = objDetShow ? otherInfoShow : null;


    const ifHide = ifHideModules ? styles.hideModules : null;
    const btmDistance = refSubInfoViewH + 60;
    const compassOpenState = true;
    const btmHeight = this.getBtmHeight();

    return (
      <View style={{ flex: 1 }}>
        {/* 地图区域begin */}
        <View
          style={styles.homeMapView}
        >
          <View style={[styles.mapBtnView, (commonlyUseViewShow || objDetShow) ? { height: 0, display: 'none' } : null, ifHide]}>
            <MapBtnView openPanorama={this.openPanorama} />
          </View>
          <MapView
            isHome={isHome}
            trafficEnabled={mapTrafficEnabled}
            bMapType={bMapType}
            locationManager={locationManager}
            markers={mapRendered ? [...markers.values()] : []}
            onInAreaOptions={data => this.onInAreaOptions(data)}
            // centerPoint={centerPointState ? currentMonitorInfoId : null}
            centerPoint={currentMonitorInfoId}
            onMapInitFinish={() => this.onMapInitFinish()}
            onMapClick={this.mapClick}
            mapAmplification={mapAmplification}
            mapNarrow={mapNarrow}
            onPointClickEvent={data => this.onPointClickEvent(data)}
            monitorFocus={monitorFocus}
            aggrNum={aggrNum}
            latestLocation={rollCallDate}
            onLocationStatusDenied={data => this.onLocationStatusDenied(data)}
            compassOpenState={compassOpenState}
            baiduMapScalePosition={mapRendered ? `65|${btmHeight}` : null}
            monitorFocusTrack={monitorFocusId === null ? null : `${monitorFocusId}|${monitorFocusState}`}
            onMonitorLoseFocus={() => this.onMonitorLoseFocus()}
            onMyScale={data => this.onMyScale(data)}
            goLatestPoin={!socketConnected ? param : null}
            onLocationSuccess={data => this.locationComplete(data)}
            onClustersClickEvent={data => this.onClustersClickEvent(data)}
          />
        </View>
        {/* 地图区域end */}

        <Animatable.View
          duration={300}
          transition="top"
          style={[styles.searchCont, ifHideModules ? { top: -50 } : null]}
        >
          <Header />
        </Animatable.View>

        {/* 监控对象数据详情begin */}
        <Animatable.View
          style={[styles.objInoAreaView, ifHideModules ? { bottom: -btmDistance } : null,
          ]}
          transition="bottom"

        >
          {/* 地图定位begin */}
          <TouchableOpacity
            style={[styles.localtionView, !alarmIconShow ? styles.alarmIconShow : null]}
            onPress={this.locationBtnEvent}
          >
            <Image
              style={[styles.localtionImage, !alarmIconShow ? styles.alarmIconShow : null]}
              source={localtionPng}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {/* 地图定位end */}
          {/* 主动安全begin */}
          {
            adasFlag === 1 ? (
              <TouchableOpacity
                style={[styles.activeSafetyView, !alarmIconShow ? styles.alarmIconShow : null]}
                onPress={this.activeSafetyBtnEvent}
              >
                <ImageBackground
                  source={warningBg}
                  style={[{ width: 40, height: 40 }, !alarmIconShow ? styles.alarmIconShow : null]}
                >
                  {
                !ifZhonghuanWarnScoket ? (
                  <Image
                    style={[styles.localtionImage, !alarmIconShow ? styles.alarmIconShow : null]}
                    source={activeSafetyImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    style={[{
                      width: 30, height: 30, top: 5, left: 5,
                    }, !alarmIconShow ? styles.alarmIconShow : null]}
                    source={activeSafetyGif}
                    resizeMode="contain"
                  />
                )
              }
                </ImageBackground>
              </TouchableOpacity>
            ) : null
          }
          {/* 主动安全end */}
          {/* 报警信息 begin */}
          <TouchableOpacity
            style={[styles.waringView, ifWarnInfoScoket ? { top: -52, right: 13 } : null,
              !alarmIconShow ? styles.alarmIconShow : null]}
            onPress={this.debouncetoAlarmCenter}
          >
            <ImageBackground
              source={warningBg}
              style={[{ width: 45, height: 45 }, !alarmIconShow ? styles.alarmIconShow : null, !ifWarnInfoScoket ? { height: 0, display: 'none' } : null]}
            >
              <Image
                style={[styles.warningImage, {
                  width: 45, height: 45,
                }, !alarmIconShow ? styles.alarmIconShow : null, !ifWarnInfoScoket ? { height: 0, display: 'none' } : null]}
                source={alarmgif}
                resizeMode="contain"
              />

            </ImageBackground>
            <Image
              style={[styles.warningImage, !alarmIconShow ? styles.alarmIconShow : null, ifWarnInfoScoket ? { height: 0, display: 'none' } : null]}
              source={waring}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {/* 报警信息end */}
          {/* 详情数据拖动块begin */}
          <View {...this.panResponderObj.panHandlers}>
            <View
              ref={(view) => { this.refSubInfoView = view; }}
            >
              <SubInfoView
                componentOnlayOut={this.componentOnlayOut}
                basicLocationInfo={basicLocationInfo}
              />
            </View>

          </View>
          <Animatable.View
            duration={300}
            transition="height"
            style={[styles.otherInfoHide, otherInfoView]}
          >
            {/* 详细信息头部 */}
            <View {...this.otherInfoHeadpanResponderObj.panHandlers}>
              {
                  activeMonitorInState && JSON.stringify(detailLocationInfo) !== '{}' && (
                  <SubOtherInfoHead
                    detailLocationInfo={detailLocationInfo.monitorConfigs}
                    activeMonitorInState={activeMonitorInState}
                  />
                  )
                }
            </View>
            <View>
              {
                 JSON.stringify(detailLocationInfo) !== '{}'
                 && (
                 <SubOtherInfoView
                   sensors={detailLocationInfo.sensors}
                   detailSensorsHChangeFun={this.detailSensorsHChangeFun}
                   scrollEnabled={scrollEnabled}
                   scrollToToporBtm={this.scrollToToporBtm}
                   otherInfoViewH={otherInfoShow.height}
                 />
                 )
              }

            </View>
          </Animatable.View>
          {/* 详情数据拖动块end */}
          <Animatable.View
            duration={500}
            transition="height"
            style={[styles.comUseClose, comUseView, ifHide]}
          >
            <View ref={(view) => { this.refToolSlider = view; }}>
              <CompentToolSlider showOrderSend onOrderSendClick={this.rollCallIssued} />
            </View>
          </Animatable.View>

          <Footer
            ref={(view) => { this.refFooter = view; }}
            // style={ifHide}
            onMonitorChange={this.handleMonitorChange}
            onMonitorClick={this.handleMonitorClick}
            onMonitorDbClick={this.handleMonitorDbClick}
            monitors={monitors}
            activeMonitor={activeMonitorInState}
            isFocus={monitorIsFocus}
            neveronlinemonitorchange={(item, index) => { this.neveronlinemonitorchange(item, index); }}
          />
        </Animatable.View>
        {/* 监控对象数据详情end */}
        {
          Platform.OS === 'android' ? (
            <View
              style={[styles.scaleAndroidStyle, { bottom: btmHeight - 20 }]}
            >
              <ScaleView scaleValue={scaleAndroidValue} />
            </View>
          ) : null
        }
        {
          panoramaState ? (
            <View style={[styles.panoramaView, panoramaLoadSuccess ? { zIndex: 999999999 } : null]}>
              <BaiduPano
                customPanoView={customPanoView}
                onPanoramaClose={this.onPanoramaClose}
                onPanoramaFailed={this.onPanoramaFailed}
                onPanoramaSuccess={this.onPanoramaSuccess}
              />
            </View>
          ) : null
        }
        <View style={styles.clusterViewStyle}>
          <ClusterMonitor
            clusters={clustersData}
            isClustersViewShow={isClustersViewShow}
            clustersItemClick={this.clustersItemClick}
            clustersClose={this.clustersClose}
          />
        </View>
      </View>
    );
  }
}

export default connect(
  state => ({
    commonlyUseViewShow: state.getIn(['homeReducers', 'commonlyUseViewShow']),
    objDetShow: state.getIn(['homeReducers', 'objDetShow']),
    mapTrafficEnabled: state.getIn(['homeReducers', 'mapTrafficEnabled']),
    bMapType: state.getIn(['homeReducers', 'bMapType']),
    locationManager: state.getIn(['homeReducers', 'locationManager']),
    markers: state.getIn(['homeReducers', 'monitorInfo']),
    basicLocationInfo: state.getIn(['homeReducers', 'basicLocationInfo']),
    detailLocationInfo: state.getIn(['homeReducers', 'detailLocationInfo']),
    subMonitorArr: state.getIn(['homeReducers', 'subMonitorArr']),
    socketTime: state.getIn(['homeReducers', 'socketTime']),
    mapZooml: state.getIn(['homeReducers', 'mapZooml']),
    currentMonitorInfoId: state.getIn(['homeReducers', 'currentMonitorInfoId']),
    routerIndex: state.getIn(['homeReducers', 'routerIndex']),
    mapAmplification: state.getIn(['homeReducers', 'mapAmplification']),
    mapNarrow: state.getIn(['homeReducers', 'mapNarrow']),
    monitors: state.getIn(['homeReducers', 'markers']),
    ifGoSecurity: state.getIn(['homeReducers', 'ifGoSecurity']),
    randomNumber: state.getIn(['homeReducers', 'randomNumber']),
  }),
  dispatch => ({
    mapLocationChange: () => {
      dispatch({ type: 'MAP_LOCATION' });
    },
    getMonitorIds: (activeMonitor) => {
      dispatch({ type: 'home/SAGA/GET_MONITOR_IDS', activeMonitor });
    },
    saveSubInfo: (subParam) => {
      dispatch({ type: 'SAVE_SUB_MONITOR', subParam });
    },
    updateMonitorInfo: (value) => {
      dispatch({ type: 'UPDATE_MARKER_INFO', value });
    },
    updateMonitorAddressInfo: (monitorId) => {
      dispatch({ type: 'home/SAGA/UPDATE_MONITOR_ADDRESS_INFO', monitorId });
    },
    objDetChange: () => {
      dispatch({ type: 'OBJ_DET_ACTION' });
    },
    comUseShow: () => {
      dispatch({ type: 'COM_USE_ACTION' });
    },
    increaseRouterIndex: () => {
      dispatch({ type: 'HOME/ROUTER_EXIT' });
    },
    reduceRouterIndex: () => {
      dispatch({ type: 'HOME/ROUTER_ENTER' });
    },
    clearData: () => {
      dispatch({ type: 'HOME/DELDATA' });
    },
    clearBasicInfoData: () => {
      dispatch({ type: 'HOME/CLEAR_BASIC' });
    },
    changeCurrentMonitorId: (monitorId) => {
      dispatch({ type: 'CURRENT_MONITOR_INFO_ID', monitorId });
    },
    ifgoSecurity: () => {
      dispatch({ type: 'HOME/SAGA/SECURITY' });
    },
  }),
)(Home);