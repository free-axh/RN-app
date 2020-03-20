import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Alert,
  AppState,
  Platform,
  NativeModules, NetInfo,
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import { convertSeconds } from '../../utils/convertSeconds';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { getLoginState, getLoginAccont } from '../../server/getStorageData';
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';// 底部公共组件
import MapView from './componentMap';// 地图
import SwiperVideo from './swiperVideo';// 视频通道轮播模块
import HandleTool from './handleTool';// 视频操作图标栏
import WebsocketUtil from '../../utils/websocket';
import { monitorIcon } from '../../utils/monitorIcon';
import { toastShow } from '../../utils/toastUtils';
import { onConnectionChange, removeConnectionChange } from '../../utils/network';
// import httpBaseConfig from '../../utils/env';
// import storage from '../../utils/storage';

// console.disableYellowBox = false;
// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,255)',
  },
});

class MonitorVideo extends Component {
  // 顶部导航
  static navigationOptions = ({ navigation }) => PublicNavBar(
    navigation,
    getLocale('monitorVideoTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object.isRequired,
    getVehicleChannels: PropTypes.func.isRequired, // 获取逻辑通道号接口
    channels: PropTypes.object, //  逻辑通道号数据
    subscribeDataProp: PropTypes.object, // 订阅数据
    sendParamByBatchAjax: PropTypes.func.isRequired, // 订阅接口
    resetReduxData: PropTypes.func.isRequired, // 重置redux数据
    closeVideoFun: PropTypes.func.isRequired, // 关闭视频
    ifCloseVideo: PropTypes.bool.isRequired, // 是否成功取消订阅
    vehicleChangeFun: PropTypes.func.isRequired, // 切换车辆
    activeMonitor: PropTypes.object.isRequired,
    userName: PropTypes.string.isRequired,
    // 地图模块
    socketTime: PropTypes.number,
    // updateMonitorInfo: PropTypes.func,
    // markers: PropTypes.object,
  }

  static defaultProps = {
    channels: null,
    subscribeDataProp: null,

    socketTime: 0,
    // updateMonitorInfo: null,
    // markers: [],
  }


  constructor(props) {
    super(props);
    const {
      monitors, activeMonitor, userName,
    } = this.props;
    const d = new Date();
    const randomNum = d.getTime();
    const currentUser = userName + randomNum;
    const monitorsValue = [...monitors.values()];

    // 初始化websocket对象
    // const socket = new WebsocketUtil();
    // socket.init('/clbs/vehicle');
    this.videoSocketConnect();

    this.state = {
      slideUp: false,
      vehicleId: activeMonitor.markerId || monitorsValue[0].markerId, // 当前所选监控对象的id
      brand: activeMonitor.title || monitorsValue[0].title, // 当前所选监控对象的车牌号
      channels: [], // 通道号
      subscribeData: [], // 订阅成功后返回数据
      currentChooseVideoNum: 0, // 当前选中的播放窗口
      swiperIndex: 0, // 视频滑动页面标识索引
      BtmplayFlag: false, // 底部播放按钮
      cameraFlag: false, // 底部拍照
      screenFlag: false, // 全屏
      audioFlag: true, // 音频开启

      isUp: null, // 底部公共组件展开状态
      mapShow: false, // 地图显示状态
      // socket,
      subMonitorVehicleId: null, // 存贮已订阅的车辆
      removeAnnotation: null, // 存贮删除的车点标注
      trackingId: null, // 车标注移动后把位置拉到地图中心点
      monitorSubInfo: [], // 监控对象订阅数据
      activeMonitor,
      accont: currentUser,
      accontVideo: userName,
      socketConnected: false,
    };

    // this.subMonitorFunc(monitorsValue[0].markerId);
    AppState.addEventListener('change', this.handleAppStateChange);

    onConnectionChange((type, effectiveType) => { this.netWorkonChange(type, effectiveType); });
  }

  componentDidMount() {
    const { monitors, activeMonitor } = this.props;
    const monitorsValue = [...monitors.values()];
    setTimeout(() => {
      this.getChannels(activeMonitor.markerId || monitorsValue[0].markerId);
    }, 1000);
  }

  componentWillReceiveProps(nextProps) {
    // const subscribeDataPre = this.props.subscribeData;
    const {
      channels, subscribeDataProp, ifCloseVideo,
    } = nextProps;

    const channelsObj = JSON.parse(JSON.stringify(channels));
    if (channelsObj === null && subscribeDataProp === null) { // 重置数据
      console.info('重置数据', ifCloseVideo);

      this.setState({
        channels: [],
        subscribeData: [],
        ifCloseVideo: false,
        currentChooseVideoNum: 0,
        BtmplayFlag: false,
      });
      return;
    }

    if (channelsObj !== null && subscribeDataProp === null) { // 通道号数据变化
      console.info('通道号数据变化');
      const channelsData = [];
      let ifVehicleOnline = true;
      let ifSupportDevice = true;
      channelsObj.forEach((element) => {
        if (element.status === 3) {
          ifVehicleOnline = false;
        } else if (element.deviceType !== '1' && element.deviceType !== '11' && element.deviceType !== '12' && element.deviceType !== '13') {
          ifSupportDevice = false;
        }

        if (element.channelType !== 1) {
          const ele = element;
          ele.socketUrl = '';
          ele.playFlag = false;
          ele.ifOpenSuccess = false;// 是否成功播放

          ele.audioSampling = null; // 音频采样率
          ele.ifOpenAudio = false; // 是否播放音频

          ele.ifCapture = false; // 是否拍照

          channelsData.push(ele);
        }
      });
      if (ifVehicleOnline && ifSupportDevice) {
        this.setState({
          channels: channelsData,
        }, () => {
          this.sendParamByBatch();
        });
      } else {
        if (!ifVehicleOnline) {
          toastShow(getLocale('vehicleNotOnline'), { duration: 2000 });
        }
        if (!ifSupportDevice) {
          toastShow(getLocale('vehicleNotSupportViedo'), { duration: 2000 });
        }
      }
    }

    if (channelsObj !== null && subscribeDataProp !== null && !ifCloseVideo) { // 订阅数据变化
      const subscribeDataPropobj = [...subscribeDataProp.values()];
      const len = subscribeDataPropobj.length;

      // subscribeData.length <= len &&
      if (len !== 1) { // 判断是否是单个通道号订阅
        this.openVideo(subscribeDataPropobj);
        this.setState({
          subscribeData: subscribeDataPropobj,
        });
      } else { // 重新播放单个视频
        console.info('重新播放单个视频');

        this.opensingleVideo(subscribeDataPropobj[0]);
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      NativeModules.BaiduMapModule.show(Math.random());
    }
    const { resetReduxData } = this.props;
    this.closeAllVideo();
    resetReduxData();
    removeConnectionChange();
  }

  // 网络变化
  netWorkonChange=(type, effectiveType) => {
    // console.info('type', type);
    console.info('effectiveType', effectiveType);
    if (type === 'none') {
      this.closeAllVideo();
    }
    if (type === 'cellular') {
      this.closeAllVideo();
      Alert.alert(
        getLocale('flowRemind'),
        getLocale('ifContinueVideo'),
        [
          { text: getLocale('personalAlertCancle'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
          {
            text: getLocale('personalAlertSure'),
            onPress: () => {
              // const { subscribeData } = this.state;
              this.sendParamByBatch();
            },
          },
        ],
      );
    }
    if (type !== 'none' || type !== 'unknown') {
      const { socketConnected } = this.state;
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
    }
  }

  toggleAudioFun=() => {
    const { audioFlag, channels, currentChooseVideoNum } = this.state;
    const copyChannels = cloneDeep(channels);
    copyChannels.forEach((ele, index) => {
      copyChannels[index].ifOpenAudio = false;
      if (!audioFlag && copyChannels[index].physicsChannel === currentChooseVideoNum) {
        copyChannels[index].ifOpenAudio = true;
      }
    });
    this.setState({
      audioFlag: !audioFlag,
      channels: copyChannels,
    });
  }

  // 音频采样率
  audioSamplingFun=(num) => {
    let resNum = 8000;
    if (num === 0) {
      resNum = 8000;
    }
    if (num === 1) {
      resNum = 22050;
    }
    if (num === 2) {
      resNum = 44100;
    }
    if (num === 3) {
      resNum = 48000;
    }
    return resNum;
  }

  handleAppStateChange=(nextAppState) => {
    if (nextAppState === 'background') {
      // console.info('nextAppState', nextAppState);
      this.closeAllVideo();
      // this.cancelSub();
    } else if (nextAppState === 'active') {
      const { socketConnected } = this.state;
      if (!socketConnected) {
        // NetInfo.getConnectionInfo().then((connectionInfo) => {
        //   if (connectionInfo.type === 'wifi' || connectionInfo.type === 'cellular') {
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
        //   }
        // });
      }
    }
  }

  // 获取当前监控对象信息
  getVehicleInfo=() => {

  }


  // 获取监控对象的逻辑通道号
  getChannels=(id) => {
    const { getVehicleChannels } = this.props;
    if (typeof getVehicleChannels === 'function') {
      getVehicleChannels({ id });
    }
  }

  // 切换地图显示状态
  toggleMap=(mapShow) => {
    const { slideUp, vehicleId, subMonitorVehicleId } = this.state;
    const ifIsup = mapShow ? null : false;
    // this.setState({ slideUp: !slideUp });
    this.setState({
      isUp: ifIsup,

      slideUp: !slideUp,
      mapShow: !mapShow,
    }, () => {
      if (!mapShow && vehicleId !== subMonitorVehicleId) {
        console.info('地图vehicleId', vehicleId);

        this.subMonitorFunc(vehicleId);
      }
    });
  }

  // 底部公共组件展开回调
  toolBarExpand=() => {
    this.setState({
      slideUp: false,
      mapShow: false,
      isUp: null,
    });
  }

  /**
   * 订阅实时视频
   */
  sendParamByBatch=() => {
    // console.info('订阅视频');

    const { channels, swiperIndex, accontVideo } = this.state;

    const newChannels = cloneDeep(channels);
    // 每次订阅四个视频
    const channelsLen = newChannels.length;
    const startLen = swiperIndex * 4;
    let endLen;
    if ((swiperIndex * 4 + 4) > channelsLen) {
      endLen = channelsLen;
    } else {
      endLen = swiperIndex * 4 + 4;
    }
    const jsonArr = []; // 组装传给接口的数据
    for (let index = startLen; index < endLen; index += 1) {
      const obj = {};
      if (newChannels[index].channelType !== 1) {
        obj.vehicleId = newChannels[index].id;
        obj.requestType = 0;
        obj.channelNum = newChannels[index].logicChannel;
        obj.mobile = newChannels[index].mobile;
        obj.orderType = 11;
        obj.streamType = newChannels[index].streamType;
        obj.channelType = newChannels[index].channelType;

        jsonArr.push(obj);
      }
    }

    if (jsonArr.length > 0) {
      const param = JSON.stringify(jsonArr);
      const { sendParamByBatchAjax } = this.props;
      if (typeof sendParamByBatchAjax === 'function') {
        sendParamByBatchAjax({ videoInfoListStr: param, userName: accontVideo });
      }
    }
  }

  // 播放全部视频
  openVideo=(subscribeDataObj) => {
    const { channels, swiperIndex, audioFlag } = this.state;
    const newChannels = cloneDeep(channels);


    // console.info('newChannels', newChannels);


    // 每次播放四个视频
    const channelsLen = newChannels.length;
    const startLen = swiperIndex * 4;
    let endLen;
    if ((swiperIndex * 4 + 4) > channelsLen) {
      endLen = channelsLen;
    } else {
      endLen = swiperIndex * 4 + 4;
    }


    for (let index = startLen; index < endLen; index += 1) {
      for (let ind = 0; ind < subscribeDataObj.length; ind += 1) {
        const valObj = JSON.parse(JSON.stringify(subscribeDataObj[ind]));
        if (parseInt(newChannels[index].logicChannel, 10)
          === parseInt(valObj.channelNumber, 10)) {
          newChannels[index].socketUrl = valObj.unique;
          newChannels[index].audioSampling = this.audioSamplingFun(valObj.audio.audioSampling);
          // console.info('valObj.audio.audioSampling', valObj.audio.audioSampling);
          newChannels[index].ifOpenAudio = false;
          newChannels[index].playFlag = true;
        }
      }
    }


    let num = 0;
    for (let index = 0; index < newChannels.length; index += 1) {
      if (newChannels[index].playFlag) {
        num = newChannels[index].physicsChannel;
        if (audioFlag) {
          newChannels[index].ifOpenAudio = true;
        }
        break;
      }
    }

    this.setState({
      channels: newChannels,
      currentChooseVideoNum: num,
    });
  }

  // 重新播放单个视频
  opensingleVideo=(data) => {
    const { channels } = this.state;
    const newChannels = channels;
    const valObj = JSON.parse(JSON.stringify(data));
    let num1;
    channels.forEach((ele, ind) => {
      // subscribeData.forEach((val) => {
      if (parseInt(ele.logicChannel, 10) === parseInt(valObj.channelNumber, 10)) {
        newChannels[ind].socketUrl = valObj.unique;
        newChannels[ind].audioSampling = this.audioSamplingFun(valObj.audio.audioSampling);
        newChannels[ind].playFlag = true;

        num1 = newChannels[ind].physicsChannel;
      }
      // });
    });


    const num2 = channels.length === 1 ? channels[0].physicsChannel : num1;
    this.setState({
      currentChooseVideoNum: num2,
      channels: newChannels,
    });
  }

  /**
   * 底部播放停止切换
   */
  playOrPauseFun=(playFlag) => {
    const { currentChooseVideoNum, channels, accontVideo } = this.state;
    const newChannels = cloneDeep(channels);

    if (playFlag) { // 取消订阅
      newChannels.forEach((val, index) => {
        if (val.physicsChannel === currentChooseVideoNum) {
          // 取消订阅
          const { closeVideoFun } = this.props;
          if (typeof closeVideoFun === 'function') {
            const { id, logicChannel, channelType } = val;
            const param = {
              vehicleId: id,
              userName: accontVideo,
              channelNum: logicChannel,
              orderType: 15,
              control: 0,
              closeVideoType: 0,
              changeStreamType: 0, // 固定为0
              channelType,
              requestType: 0,
            };
            closeVideoFun(param);
            newChannels[index].playFlag = false;
          }
        }
      });
      this.setState({
        channels: newChannels,
      });
    } else {
      newChannels.forEach((val) => {
        if (val.physicsChannel === currentChooseVideoNum) {
          // 重新订阅
          this.againSubscribe(val.logicChannel);
        }
      });
    }
  }

  /**
   * 取消订阅所有视频
   */
  closeAllVideo=() => {
    const { channels, subscribeData, accontVideo } = this.state;
    // console.info('channels', channels);
    if (channels && subscribeData) {
      const copyChannels = cloneDeep(channels);

      channels.forEach((val, index) => {
        if (val.playFlag) {
          const { closeVideoFun } = this.props;
          if (typeof closeVideoFun === 'function') {
            const { id, logicChannel, channelType } = val;
            const param = {
              vehicleId: id,
              userName: accontVideo,
              channelNum: logicChannel,
              orderType: 15,
              control: 0,
              closeVideoType: 0,
              changeStreamType: 0, // 固定为0
              channelType,
              requestType: 0,
            };


            closeVideoFun(param);
          }

          copyChannels[index].playFlag = false;
        }
      });

      this.setState({
        channels: copyChannels,
      });
    }
  }

  // 重新订阅单个视频
  againSubscribe=(currentNum) => {
    const { channels, accontVideo } = this.state;

    const setChannels = channels;

    const jsonArr = []; // 组装传给接口的数据
    channels.forEach((val, index) => {
      if (val.logicChannel === currentNum) {
        const obj = {};
        obj.vehicleId = val.id;
        obj.requestType = 0;
        obj.channelNum = val.logicChannel;
        obj.mobile = val.mobile;
        obj.orderType = 11;
        obj.streamType = val.streamType;
        obj.channelType = val.channelType;

        setChannels[index].playFlag = false;

        jsonArr.push(obj);
      }
    });

    this.setState({
      channels: setChannels,
    });

    if (jsonArr.length > 0) {
      const param = JSON.stringify(jsonArr);
      const { sendParamByBatchAjax } = this.props;
      if (typeof sendParamByBatchAjax === 'function') {
        sendParamByBatchAjax({ videoInfoListStr: param, userName: accontVideo });
      }
    }
  }

  /**
   * 视频滑动
   */
  onSwiperIndexChange=(index) => {
    // console.info('index', index);

    this.closeAllVideo();
    this.setState({
      swiperIndex: index,
    }, () => {
      // const { subscribeData } = this.state;
      // this.openVideo(subscribeData);
      this.sendParamByBatch();
    });
  }

  /**
   * 刷新视频
   */
  refreshVideoFun=(item) => {
    // const { currentChooseVideoNum } = this.state;

    this.setState({
      currentChooseVideoNum: item.physicsChannel,
    }, () => {
      // console.info('item.physicsChannel', item.physicsChannel);
      this.againSubscribe(item.logicChannel);
    });
  }

  /**
   * 将视频组建中当前选中的存到state中
   */
  currentVideoFun=(item) => {
    const { channels, audioFlag } = this.state;
    const newChannels = cloneDeep(channels);
    newChannels.forEach((ele, index) => {
      newChannels[index].ifOpenAudio = false;
      if (audioFlag && newChannels[index].physicsChannel === item.physicsChannel) {
        newChannels[index].ifOpenAudio = true;
      }
    });

    this.setState({
      currentChooseVideoNum: item.physicsChannel,
      // playFlag,
      BtmplayFlag: item.ifOpenSuccess,
      channels: newChannels,
    });
  }

  /**
 * 播放状态改变
 */
  videoStateChangeFun=(item, state) => {
    console.debug('state421', state);
    const { channels, currentChooseVideoNum, accontVideo } = this.state;
    const copyChannels = cloneDeep(channels);
    for (let index = 0; index < copyChannels.length; index += 1) {
      if (copyChannels[index].logicChannel === item.logicChannel) {
        if (state === 3) {
          copyChannels[index].ifOpenSuccess = true;
        } else {
          copyChannels[index].ifOpenSuccess = false;

          // 这一段当视频播放不成功或者关闭时再次取消订阅
          if (state === 1 || state === 2 || state === 4) {
            const { closeVideoFun } = this.props;
            if (typeof closeVideoFun === 'function') {
              const { id, logicChannel, channelType } = item;
              const param = {
                vehicleId: id,
                userName: accontVideo,
                channelNum: logicChannel,
                orderType: 15,
                control: 0,
                closeVideoType: 0,
                changeStreamType: 0, // 固定为0
                channelType,
                requestType: 0,
              };
              closeVideoFun(param);
              copyChannels[index].playFlag = false;
            }
          }
        }
      }
    }

    const iftrue = state === 3;

    if (item.physicsChannel === currentChooseVideoNum) {
      this.setState({
        channels: copyChannels,
        BtmplayFlag: iftrue,
      });
    } else {
      this.setState({
        channels: copyChannels,
      });
    }
  }

  /**
   * 底部拍照
   */
  refCaptureFun=(cameraFlag) => {
    if (!cameraFlag) {
      const { currentChooseVideoNum, channels } = this.state;
      const newChannels = cloneDeep(channels);

      let canCamera = true;

      newChannels.forEach((val, index) => {
        if (val.physicsChannel === currentChooseVideoNum) {
          if (val.ifOpenSuccess === false) {
            canCamera = false;
          } else {
            newChannels[index].ifCapture = true;
          }
        }
      });

      if (canCamera) {
        this.setState({
          channels: newChannels,
          cameraFlag: true,
        });
      }
    }
  }

  /**
   * 拍照回调
   */
  captureCallback=(item, success) => {
    const { channels } = this.state;
    const newChannels = cloneDeep(channels);

    newChannels.forEach((val, index) => {
      newChannels[index].ifCapture = false;
    });
    this.setState({
      channels: newChannels,
      cameraFlag: false,
    });

    const { physicsChannel } = item;
    if (success) {
      Alert.alert(`通道${physicsChannel}拍照成功\n请进入手机相册查看`);
    } else {
      Alert.alert(`通道${physicsChannel}拍照失败`);
    }
  }

  // 底部监控对象滑动触发事件 item 当前对象，index索引
  toolBarOnChange=(item) => {
    this.closeAllVideo();


    const { markerId, title } = item;
    console.info('markerId', markerId, 'title', title);


    const { channels, subscribeData, accontVideo } = this.state;
    const paramData = [];
    if (channels && subscribeData) {
      channels.forEach((val) => {
        if (val.playFlag) {
          const { closeVideoFun } = this.props;
          if (typeof closeVideoFun === 'function') {
            const { id, logicChannel, channelType } = val;
            const param = {
              vehicleId: id,
              userName: accontVideo,
              channelNum: logicChannel,
              orderType: 15,
              control: 0,
              closeVideoType: 0,
              changeStreamType: 0, // 固定为0
              channelType,
              requestType: 0,
            };

            paramData.push(param);
          }
        }
      });
    }

    const payloadData = {
      param: paramData,
      vehicleId: markerId,
      userName: accontVideo,
    };

    const { vehicleChangeFun } = this.props;
    if (typeof vehicleChangeFun === 'function') {
      vehicleChangeFun(payloadData);
    }

    this.setState({
      vehicleId: markerId,
      brand: title,
      screenFlag: false,
      activeMonitor: item,
      swiperIndex: 0,
    });
  }

  // 地图部分begin

   // 订阅监控对象信息
   subAddressFunc=(socket, vehicleId, token, accont) => {
     const { socketTime } = this.props;
     const headers = { access_token: token };
     const param = [];
     param.push({
       vehicleId,
     });

     const request = {
       desc: {
         MsgId: 40964,
         UserName: accont + socketTime,
       },
       data: param,
     };

     setTimeout(() => {
       // console.info('订阅车辆vehicleId', vehicleId);

       socket.subscribe(headers, `/user/${accont + socketTime}/location`,
         this.subCallBack, '/app/vehicle/location', request);
     }, 1000);
   }

   // 位置信息订阅成功
   subCallBack=(msg) => {
     // console.info('位置信息订阅成功2222222');
     const data = JSON.parse(msg.body);
     const { vehicleId } = this.state;
     /* eslint prefer-destructuring:off */
     if (data.desc !== 'neverOnline') {
       const msgBody = data.data.msgBody;
       // console.info('音视频', msgBody);
       // 组装监控对象地图更新数据
       if (vehicleId === msgBody.monitorInfo.monitorId) {
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

         this.setState({ monitorSubInfo: value });


         // const monitorMap = new Map();
         // monitorMap.set(msgBody.monitorInfo.monitorId, value);

         // const {
         //   updateMonitorInfo,
         // } = this.props;
         // updateMonitorInfo(monitorMap);
         console.info('订阅的车辆', msgBody.monitorInfo.monitorId);

         // 订阅完成后将订阅的车辆存在 subMonitorVehicleId中
         this.setState({
           subMonitorVehicleId: msgBody.monitorInfo.monitorId,
           trackingId: msgBody.monitorInfo.monitorId,
         });
       }
     }
   }

   toggleScreenFun=() => {
     const { screenFlag, currentChooseVideoNum } = this.state;
     console.info(currentChooseVideoNum, currentChooseVideoNum);
     if (currentChooseVideoNum !== 0) {
       this.setState({
         screenFlag: !screenFlag,
       });
     }
   }


   fullScreenFun=(bool) => {
     this.setState({
       screenFlag: bool,
     });
   }

   // socket建立连接
   async videoSocketConnect() {
     const state = await getLoginState();
     //  const state = await storage.load({
     //    key: 'loginState',
     //  });
     const headers = { access_token: state.token };
     const socket = new WebsocketUtil();
     socket.init('/clbs/vehicle', headers, () => {
       this.setState({ socketConnected: true });
     }, this.socketCloseEvent);
     this.setState({ socket });
   }

    socketCloseEvent = () => {
      this.setState({ socketConnected: false });
    }

    // 取消订阅位置信息
    unSubAddressFunc(socket, vehicleId, token, accont) {
      const { socketTime } = this.props;
      const headers = { access_token: token };
      const unParam = [];
      unParam.push({
        vehicleId,
      });
      const unRequset = {
        desc: {
          MsgId: 40964,
          UserName: accont + socketTime,
        },
        data: unParam,
      };
      if (unParam.length > 0) {
        console.info('取消订阅的车辆', vehicleId);

        socket.unsubscribealarm(headers, '/app/vehicle/unsubscribelocation', unRequset);

        this.setState({
          removeAnnotation: vehicleId,
        });
      }
    }

    //  订阅监控对象位置信息
    async subMonitorFunc(vehicleId) {
      const { socket, subMonitorVehicleId } = this.state;

      const state = await getLoginState();
      const userInfo = await getLoginAccont();
      //  const state = await storage.load({
      //    key: 'loginState',
      //  });
      //  const userInfo = await storage.load({
      //    key: 'loginAccont',
      //  });

      // 取消之前订阅的监控对象
      if (subMonitorVehicleId) {
        this.unSubAddressFunc(
          socket,
          subMonitorVehicleId,
          state.token,
          userInfo[0].accont,
        );
      }

      // 订阅监控对象
      this.subAddressFunc(
        socket,
        vehicleId,
        state.token,
        userInfo[0].accont,
      );
    }

    async againSub() {
      const state = await getLoginState();
      const userInfo = await getLoginAccont();
      const {
        vehicleId,
        socket,
      } = this.state;
      const token = state.token;
      const accont = userInfo[0].accont;
      const headers = { access_token: token };
      const { socketTime } = this.props;
      const param = [
        { vehicleId },
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

    // 取消订阅
    async cancelSub() {
      const state = await getLoginState();
      const userInfo = await getLoginAccont();
      const {
        vehicleId,
        socket,
      } = this.state;

      const { socketTime } = this.props;
      const token = state.token;
      const accont = userInfo[0].accont;
      const headers = { access_token: token };
      const unRequset = {
        desc: {
          MsgId: 40964,
          UserName: accont + socketTime,
        },
        data: [{ vehicleId }],
      };
      // 取消位置信息订阅
      socket.unsubscribealarm(headers, '/app/vehicle/unsubscribelocation', unRequset);
    }

    // 避免socket重复建立连接，轮询判断reconnectionState是否为true
    againSubJdge() {
      setTimeout(() => {
        const { socket } = this.state;
        //  console.warn('reconnectionState', socket.reconnectionState);
        if (!socket.reconnectionState) {
          if (socket.socket !== null) {
            this.againSub();
          }
        } else {
          this.againSubJdge();
        }
      }, 1000);
    }

    // 地图部分end


    render() {
      const {
        slideUp,
        channels,
        brand,
        currentChooseVideoNum,
        BtmplayFlag,
        cameraFlag,
        isUp,
        mapShow,
        removeAnnotation,
        trackingId,
        monitorSubInfo,
        screenFlag,
        activeMonitor,
        audioFlag,
        swiperIndex,
      } = this.state;
      const {
        monitors,
        //  activeMonitor,
        // markers,
      } = this.props;

      //  console.info('哈哈哈哈', channels);

      return (
        <View style={styles.container}>
          <MapView
            slideUp={slideUp}
            videoMarker={monitorSubInfo}
            removeAnnotation={removeAnnotation}
            trackingId={trackingId}
            mapShow={mapShow}
          />
          <SwiperVideo
            channels={channels}
            brand={brand}
            currentChooseVideoNum={currentChooseVideoNum}
            currentVideoFun={this.currentVideoFun}
            onSwiperIndexChange={this.onSwiperIndexChange}
            swiperIndex={swiperIndex}
            refreshVideoFun={this.refreshVideoFun}
            videoStateChangeFun={this.videoStateChangeFun}
            captureCallback={this.captureCallback}
            screenFlag={screenFlag}
            fullScreenFun={this.fullScreenFun}
          />
          <HandleTool
            toggleMap={this.toggleMap}
            playOrPauseFun={this.playOrPauseFun}
            playFlag={BtmplayFlag}
            cameraFlag={cameraFlag}
            refCaptureFun={this.refCaptureFun}
            mapShow={mapShow}
            screenFlag={screenFlag}
            toggleScreenFun={this.toggleScreenFun}
            currentChooseVideoNum={currentChooseVideoNum}
            audioFlag={audioFlag}
            toggleAudioFun={this.toggleAudioFun}
          />
          <ToolBar
            monitors={monitors}
            activeMonitor={activeMonitor}
            isUp={isUp}
            onChange={this.toolBarOnChange}
            onExpand={this.toolBarExpand}
          />
        </View>
      );
    }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    channels: state.getIn(['monitorVideoReducers', 'channels']),
    subscribeDataProp: state.getIn(['monitorVideoReducers', 'subscribeDataProp']),
    ifCloseVideo: state.getIn(['monitorVideoReducers', 'ifCloseVideo']),

    socketTime: state.getIn(['monitorVideoReducers', 'socketTime']),
    // markers: state.getIn(['monitorVideoReducers', 'monitorInfo']),
  }),
  dispatch => ({
    getVehicleChannels: (payload) => {
      dispatch({ type: 'video/SAGA/GETCHANNEL_ACTION', payload });
    },
    sendParamByBatchAjax: (payload) => {
      dispatch({ type: 'video/SAGA/SUBSCRIBE_ACTION', payload });
    },
    resetReduxData: () => {
      dispatch({ type: 'video/RESET_ACTION' });
    },
    closeVideoFun: (payload) => {
      dispatch({ type: 'video/SAGA/CLOSE_ACTION', payload });
    },
    vehicleChangeFun: (payload) => {
      dispatch({ type: 'video/SAGA/CHANGEVEHICLE_ACTION', payload });
    },
    // updateMonitorInfo: (value) => {
    //   dispatch({ type: 'video/UPDATE_MARKER_INFO', value });
    // },
  }),
)(MonitorVideo);
