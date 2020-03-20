import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Alert,
  NativeModules, Platform,
} from 'react-native';
import { throttle } from 'lodash';
import PropTypes from 'prop-types';
import { requestConfig } from '../../utils/env';
import { getCurAccont, getLoginState, getUserSetting } from '../../server/getStorageData';
import { checkMonitorOnline, checkMonitorBindRisk, checkMonitorBindObd } from '../../server/getData';
import { go, getMonitor } from '../../utils/routeCondition';
import { getLocale } from '../../utils/locales';
import { isEmpty } from '../../utils/function';
import { toastShow } from '../../utils/toastUtils';
import { isCellular, errHandle } from '../../utils/network';
// import storage from '../../utils/storage';
import toolIcon1 from '../../static/image/toolIcon1.png';
import toolIcon2 from '../../static/image/toolIcon2.png';
import toolIcon3 from '../../static/image/toolIcon3.png';
import toolIcon4 from '../../static/image/toolIcon4.png';
import toolIcon5 from '../../static/image/toolIcon5.png';
import toolIcon6 from '../../static/image/toolIcon6.png';
import toolIcon7 from '../../static/image/toolIcon7.png';
import safeInfo from '../../static/image/safeInfo.png';
import certificatesForEntryIcon from '../../static/image/certificatesForEntryIcon.png';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
const httpBaseConfig = requestConfig();

// style
const styles = StyleSheet.create({
  container: {
    height: 100,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    backgroundColor: 'white',
  },
  swiper_item: {
    // flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 5,
    width: windowWidth,
  },
  item: {
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingBottom: 15,
  },

  swiper_icon: {
    width: 35,
    height: 35,
  },
  swiper_txt: {
    marginTop: 5,
    fontSize: 14,
    color: '#333',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: 'green',
    height: 20,
    paddingBottom: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D4D8',
    marginHorizontal: 5,
  },
  dot_activeDot: {
    backgroundColor: '#A7A9AB',
  },
});

class ToolSlider extends Component {
   // 属性声明
   static propTypes ={
     showOrderSend: PropTypes.bool, // 控制点名下发显示隐藏
     onOrderSendClick: PropTypes.func, // 点名下发回调函数
   };

  // 属性默认值
  static defaultProps ={
    showOrderSend: false,
    onOrderSendClick: null,
  }

  viewabilityConfig={
    itemVisiblePercentThreshold: 80,
  }

  // state={
  // currentDotindex: 0,
  // indexArray: [0, 1],
  // }

  constructor(props) {
    super(props);
    this.state = {
      currentDotindex: 0,
      indexArray: [0, 1, 2],
      adasFlag: -1,
    };

    this.ifsafeInfoJudge();

    this.throttleCertificatesForEntry = throttle(this.certificatesForEntryHandle, 2000, {
      trailing: false,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { currentDotindex, adasFlag } = this.state;

    const should = currentDotindex !== nextState.currentDotindex || adasFlag !== nextState.adasFlag;
    return should;
  }

  async ifsafeInfoJudge() {
    const appSettings = await getUserSetting();
    const { adasFlag } = appSettings;

    this.setState({
      adasFlag,
      indexArray: adasFlag === 1 ? [0, 1, 2] : [0, 1],
    });
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

  handleJump=(key) => {
    // 判断是否开启了定位权限
    if (key === 'monitorTrack') {
      NativeModules.LocationPermissionsModule.getLocationState('getLocationState').then((events) => {
        if (events === 0) {
          this.onLocationStatusDenied();
        } else {
          this.routeJudge(key);
        }
      });
    } else {
      this.routeJudge(key);
    }
  }

  routeJudge(key) {
    const activeMonitor = getMonitor();

    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }

    checkMonitorOnline({
      monitorId: activeMonitor.markerId,
    }).then((res) => {
      if (res.statusCode === 200) {
        if (res.obj === 1) { // 1：校验通过
          if (key === 'monitorVideo') {
            // 音视频检查是否流量环境
            if (isCellular()) {
              this.confirm(getLocale('flowPrompt'), getLocale('videoPrompt'), () => {
                getCurAccont().then(userName => go(key, { activeMonitor, userName }));
              });
            } else {
              getCurAccont().then(userName => go(key, { activeMonitor, userName }));
            }
          } else if (key === 'securityInfo') {
            this.getMonitorBindRisk(key, activeMonitor);
          } else if (key === 'obdMonitor') {
            this.getMonitorBindObd(key, activeMonitor);
          } else if (key === 'certificatesForEntry') {
            this.throttleCertificatesForEntry();
          } else {
            go(key, { activeMonitor });
          }
        } else if (res.obj === 2) { // 2：不在线
          if (key === 'monitorVideo' || key === 'monitorWake' || key === 'obdMonitor') {
            toastShow(getLocale('monitorOffLine'), { duration: 2000 });
          } else if (key === 'securityInfo') { // 安全信息权限判断
            this.getMonitorBindRisk(key, activeMonitor);
          } else if (key === 'certificatesForEntry') {
            this.throttleCertificatesForEntry();
          } else {
            go(key, { activeMonitor });
          }
        } else if (res.obj === 4) { // 4: 从未上线
          toastShow(getLocale('monitorNeverOnLine'), { duration: 2000 });
        } else if (res.obj === 3) { // 3：不为808协议
          if (key === 'monitorVideo') {
            toastShow(getLocale('video808Prompt'), { duration: 2000 });
          } else if (key === 'securityInfo') { // 安全信息权限判断
            this.getMonitorBindRisk(key, activeMonitor);
          } else if (key === 'certificatesForEntry') {
            this.throttleCertificatesForEntry();
          } else {
            go(key, { activeMonitor });
          }
        }
      } else {
        // toastShow(getLocale('requestFailed'), { duration: 2000 });
        errHandle(res, this.routeJudge, key);
      }
    });
  }

  // 监控对象是否绑定了obd传感器
  getMonitorBindObd=(key, activeMonitor) => {
    checkMonitorBindObd({
      monitorId: activeMonitor.markerId,
    }).then((data) => {
      if (data.statusCode === 200) {
        if (data.obj.isBandObdSensor === true) {
          go(key, { activeMonitor });
        } else {
          toastShow(getLocale('vehicleUnbindObd'), { duration: 2000 });
        }
      } else {
        // toastShow(getLocale('requestFailed'), { duration: 2000 });
        errHandle(data, this.getMonitorBindObd, key, activeMonitor);
      }
    });
  }

  // 获取报警风险设置权限
  getMonitorBindRisk=(key, activeMonitor) => {
    checkMonitorBindRisk({
      vehicleId: activeMonitor.markerId,
    }).then((data) => {
      if (data.statusCode === 200) {
        if (data.obj === true) {
          go(key, { activeMonitor });
        } else {
          toastShow(getLocale('vehicleUnbindRisk'), { duration: 2000 });
        }
      } else {
        // toastShow(getLocale('requestFailed'), { duration: 2000 });
        errHandle(data, this.getMonitorBindRisk, key, activeMonitor);
      }
    });
  }

  // 提示框
  confirm=(titile, content, callback) => {
    Alert.alert(
      titile, // 提示标题
      content, // 提示内容
      [
        {
          text: getLocale('cancel'),
          style: 'cancel',
        },
        {
          text: getLocale('sure'),
          onPress: callback,
        },
      ],
      { cancelable: false },
    );
  }

  handleOnScrollEndDrag=(e) => {
    const offset = e.nativeEvent.contentOffset;
    if (offset) {
      const page = Math.round(offset.x / windowWidth);

      const { currentDotindex } = this.state;
      if (currentDotindex !== page) {
        this.setState({ currentDotindex: page });
      }
    }
  }

  handleOrderSend=() => {
    const { onOrderSendClick } = this.props;
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }
    if (typeof onOrderSendClick === 'function') {
      onOrderSendClick(activeMonitor.markerId);
    }
  }

  async certificatesForEntryHandle() {
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }

    if (activeMonitor.monitorType === 2 || activeMonitor.monitorType === '2') {
      toastShow(getLocale('notSupportDocumentEntry'), { duration: 2000 });
      return;
    }

    const state = await getLoginState();

    const options = {
      http: `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}`,
      imageWebUrl: httpBaseConfig.imageWebUrl,
      token: state.token,
      monitorType: activeMonitor.monitorType.toString(),
      monitorId: activeMonitor.markerId,
      monitorName: activeMonitor.title,
      platform: Platform.OS,
      version: httpBaseConfig.version,
    };
    NativeModules.RNBridgeModule.backToViewController(options);
  }

  handleRenderItem=(data, adasFlag) => {
    const { showOrderSend } = this.props;
    // const { adasFlag } = this.state;
    const targetView = [];

    // if (adasFlag !== 1) {
    //   this.setState({ indexArray: [0, 1] });
    // } else {
    //   this.setState({ indexArray: [0, 1, 2] });
    // }


    for (let i = 0; i < data.length; i += 1) {
      if (i === 0) {
        targetView.push((
          <View style={styles.swiper_item}>
            {
              httpBaseConfig.ledBillboardState ? (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => this.handleJump('home')}
                >
                  <View>
                    <Image
                      source={toolIcon1}
                      style={styles.swiper_icon}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={styles.swiper_txt}>
                    {getLocale('toolMenu6')}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
            <TouchableOpacity
              style={styles.item}
              onPress={() => this.handleJump('historyData')}
            >
              <View>
                <Image
                  source={toolIcon1}
                  style={styles.swiper_icon}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.swiper_txt}>
                {getLocale('toolMenu1')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() => this.handleJump('monitorVideo')}
              // onPress={() => this.handleJump('test')}
            >
              <Image
                source={toolIcon3}
                style={styles.swiper_icon}
                resizeMode="contain"
              />
              <Text style={styles.swiper_txt}>
                {getLocale('toolMenu2')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => this.handleJump('monitorTrack')}
              style={styles.item}
            >
              <Image
                source={toolIcon2}
                style={styles.swiper_icon}
                resizeMode="contain"
              />
              <Text style={styles.swiper_txt}>
                {getLocale('toolMenu3')}
              </Text>
            </TouchableOpacity>
            {
              !httpBaseConfig.ledBillboardState ? (
                <TouchableOpacity
                  onPress={() => this.handleJump('monitorWake')}
                  style={styles.item}
                >
                  <Image
                    source={toolIcon4}
                    style={styles.swiper_icon}
                    resizeMode="contain"
                  />
                  <Text style={styles.swiper_txt}>
                    {getLocale('toolMenu4')}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          </View>
        ));
      } else if (i === 1) {
        targetView.push((
          <View style={styles.swiper_item}>
            {
              httpBaseConfig.ledBillboardState ? (
                <TouchableOpacity
                  onPress={() => this.handleJump('monitorWake')}
                  style={styles.item}
                >
                  <Image
                    source={toolIcon4}
                    style={styles.swiper_icon}
                    resizeMode="contain"
                  />
                  <Text style={styles.swiper_txt}>
                    {getLocale('toolMenu4')}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
            {
              showOrderSend ? (
                <TouchableOpacity
                  onPress={this.handleOrderSend}
                  style={styles.item}
                >
                  <Image
                    source={toolIcon6}
                    style={styles.swiper_icon}
                    resizeMode="contain"
                  />
                  <Text style={styles.swiper_txt}>
                    {getLocale('toolMenu5')}
                  </Text>
                </TouchableOpacity>
              ) : null
            }

            {
              adasFlag === 1 ? (
                <TouchableOpacity
                  onPress={() => this.handleJump('securityInfo')}
                  style={styles.item}
                >
                  <Image
                    source={safeInfo}
                    style={{ width: 34, height: 34 }}
                    resizeMode="contain"
                  />
                  <Text style={styles.swiper_txt}>
                    {getLocale('safeInfo')}
                  </Text>
                </TouchableOpacity>
              ) : null
            }

            <TouchableOpacity
              onPress={() => { this.handleJump('alarmInfo'); }}
              style={styles.item}
            >
              <Image
                source={toolIcon5}
                style={styles.swiper_icon}
                resizeMode="contain"
              />
              <Text style={styles.swiper_txt}>
                {getLocale('alarmInfo')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { this.handleJump('obdMonitor'); }}
              style={styles.item}
            >
              <Image
                source={toolIcon7}
                style={styles.swiper_icon}
                resizeMode="contain"
              />
              <Text style={styles.swiper_txt}>
                {getLocale('obdMonitor')}
              </Text>
            </TouchableOpacity>

            {
              adasFlag === 1 ? null : (
                <TouchableOpacity
                  onPress={() => { this.handleJump('certificatesForEntry'); }}
                  style={styles.item}
                >
                  <Image
                    source={certificatesForEntryIcon}
                    style={styles.swiper_icon}
                    resizeMode="contain"
                  />
                  <Text style={styles.swiper_txt}>
                    {getLocale('certificatesForEntryTitle')}
                  </Text>
                </TouchableOpacity>
              )
            }
          </View>
        ));
      } else if (i === 2) {
        if (adasFlag === 1) {
          targetView.push((
            <View style={styles.swiper_item}>
              <TouchableOpacity
                onPress={() => { this.handleJump('certificatesForEntry'); }}
                style={styles.item}
              >
                <Image
                  source={certificatesForEntryIcon}
                  style={styles.swiper_icon}
                  resizeMode="contain"
                />
                <Text style={styles.swiper_txt}>
                  {getLocale('certificatesForEntryTitle')}
                </Text>
              </TouchableOpacity>
            </View>
          ));
        }
      }
    }
    return targetView;
  }

  renderDots=(length, index) => {
    const dots = [];
    for (let i = 0; i < length; i += 1) {
      dots.push(<View style={[styles.dot, i === index ? styles.dot_activeDot : null]} />);
    }
    return dots;
  }

  render() {
    const { currentDotindex, indexArray, adasFlag } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView
          bounces={false}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          horizontal
          style={{
            flex: 1,
            // width: windowWidth,
          }}
          onMomentumScrollEnd={this.handleOnScrollEndDrag}
        >
          {this.handleRenderItem(indexArray, adasFlag)}
        </ScrollView>
        {
          indexArray.length > 1 ? (
            <View style={styles.dotsContainer}>
              {
            this.renderDots(indexArray.length, currentDotindex)
          }
            </View>
          ) : null
        }

      </View>
    );
  }
}

export default ToolSlider;