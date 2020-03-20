/* eslint react/sort-comp:off */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Image,
  Text,
  Dimensions,
  TouchableOpacity,
  TouchableHighlight,
  Animated,
  AsyncStorage,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
  Alert,
  NativeModules,
  Platform,
  Linking,
  DeviceEventEmitter,
} from 'react-native';
import SplashScreen from 'rn-splash-screen';
import LinearGradient from 'react-native-linear-gradient'; // 渐变色
import CheckBox from 'react-native-checkbox'; // checkBox
import { reset } from '../../utils/routeCondition';
import { getUserSetting, getLoginAccont } from '../../server/getStorageData';
import Loading from '../../common/loading';
import storage from '../../utils/storage';
import { getLocale } from '../../utils/locales';
import logoPng from '../../static/image/logo.png'; // logo图片
import netSettingPng from '../../static/image/netSetting.png'; // logo图片
import checkboxNo from '../../static/image/checkboxNo.png';
import checkboxYes from '../../static/image/checkboxYes.png';
import InputComponent from './loginComponent/inputComponent'; // input组件
// import CommontAlert from '../../common/commonAlert';
import { toastShow } from '../../utils/toastUtils';// 导入toast
import HistoryLogin from './historyLogin/historyLogin';
import { requestConfig } from '../../utils/env';
import { isEmpty } from '../../utils/function';
import { isConnected } from '../../utils/network';

const httpBaseConfig = requestConfig();

/* eslint prefer-template:off */
const { version: versionNumber } = httpBaseConfig;

const btnWidth = Dimensions.get('window').width * 0.8; // 获取屏幕宽度


const styles = StyleSheet.create({
  windowBody: {
    flex: 1,
    backgroundColor: '#fff',
  },
  body: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
  },
  logo: {
    marginTop: 50,
    width: 220,
    height: 66,
    marginBottom: 20,
  },
  text1: {
    fontSize: 24,
    color: '#333',
  },
  text2: {
    fontSize: 16,
    color: '#646464',
    marginBottom: 50,
  },
  adminView: {
    marginBottom: 12,
    width: btnWidth,
    position: 'relative',
  },
  inputComponent: {
    marginBottom: 12,
  },
  btn: {
    width: btnWidth,
    height: 42,
    borderRadius: 42,
    // backgroundColor: '#3399ff',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  loginBtn: {
    width: btnWidth,
    // height: 42,
    color: '#fff',
    textAlign: 'center',
    // lineHeight: 42,
    fontSize: 16,
    // backgroundColor: 'red',
  },
  aboutLogin: {
    // color: '#333',
    width: btnWidth,
    height: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 10,
    zIndex: -1,
  },
  bottom: {
    flex: 1,
    width: '100%',
  },
  netBox: {
    flex: 1,
    justifyContent: 'flex-end',
    // textAlign: 'center',
  },
  netSetting: {
    height: 50,
    // lineHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  netSettingIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  hide: {
    display: 'none',
  },
});
class Login extends Component {
  static navigationOptions = () => ({
    header: null,
  });

  static propTypes = {
    onSetting: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired,
    loginStatus: PropTypes.string.isRequired,
    loginFailReason: PropTypes.string,
    ifNeedUpdate: PropTypes.object.isRequired,
    updateAppNum: PropTypes.number.isRequired,
    ifClbsVerLow: PropTypes.bool.isRequired,
    clbsLowNum: PropTypes.number.isRequired,
    // getPersonalAction: PropTypes.func.isRequired,
  }

  static defaultProps={
    loginFailReason: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      storagrAccont: [],
      accont: '',
      password: '',
      ip: '',
      isAdminIconUP: false, // 点击选择历史记录
      ifIpInputShow: false,
      alertInfo: { // 信息弹框
        ifShow: false,
        text: [],
      },
      rememberPW: true,
      fadeAnim: new Animated.Value(0),
      loging: false,
      historyLoginComponentStyle: {
        display: 'none',
      },
      imageHeight: 0,
      contentH: 0,
      histroyH: 0,
      offsetY: 0,
      appSetting: null,
      imUrl: null,
      updateObj: {},
    };
  }

  // 组件加载完毕
  componentDidMount() {
    setTimeout(() => {
      if (SplashScreen) {
        SplashScreen.hide();
      }
    }, 2000);
    this.getStorgetUser();// 获取缓存的账号密码
    this.getStorgetSetting();// app配置信息

    if (Platform.OS === 'android') {
      this.deviceEventListener = DeviceEventEmitter.addListener('onScanningResult', this.onScanningResult);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      this.deviceEventListener.remove();
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      loginStatus, loginFailReason, ifNeedUpdate: ifNeedUpdatestr,
      updateAppNum, ifClbsVerLow, clbsLowNum,
    } = nextProps;
    const ifNeedUpdate = JSON.parse(JSON.stringify(ifNeedUpdatestr));
    const { updateAppNum: prevUpdateAppNum, clbsLowNum: prevClbsLowNum } = this.props;
    if (ifClbsVerLow && clbsLowNum !== prevClbsLowNum) {
      this.setState({
        loging: false,
      });
      toastShow('平台版本过低\n请联系平台管理员', { duration: 2000 });
      return;
    }

    if (!ifNeedUpdate.flag && updateAppNum !== prevUpdateAppNum) {
      this.setState({
        loging: false,
        updateObj: ifNeedUpdate,
      });

      Alert.alert(
        '更新提醒', // 提示标题
        '当前平台需要APP更新后才能继续使用\n注：更新后的版本将无法自动回退', // 提示内容
        [
          {
            text: getLocale('cancel'),
            style: 'cancel',
          },
          {
            text: '更新',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.canOpenURL('https://itunes.apple.com/cn/app/f3监控/id1442032000?mt=8').then((supported) => {
                  if (!supported) {
                    toastShow('请先安装App Store');
                  } else {
                    Linking.openURL('https://itunes.apple.com/cn/app/f3监控/id1442032000?mt=8');
                  }
                });
              } else {
                const { version } = ifNeedUpdate;
                // console.warn('version', version);

                // Android原生判断本地版本与更新版本差异
                NativeModules.AppVersionModule.judgeUpdate(Math.random(), Number(version));
              }
            },
          },
        ],
        { cancelable: false },
      );
      return;
    }


    if (loginStatus) {
      if (loginStatus === 'failed') {
        this.setState({
          loging: false,
        });
        let errMsg;
        if (loginFailReason === 'ERR_ACCOUNT_PWD') {
          errMsg = getLocale('loginAccountPWWrong');
        } else if (loginFailReason === 'ERR_EXPIRED') {
          errMsg = getLocale('loginExpireWrong');
        } else if (loginFailReason === 'ERR_INVOKED') {
          errMsg = getLocale('loginInvokeWrong');
        } else if (loginFailReason === 'ERR_UNAUTHORIZED') {
          errMsg = getLocale('loginUnauthroizedWrong');
        }
        if (errMsg) {
          toastShow(errMsg, { duration: 2000 });
        }
      } else if (loginStatus === 'success') {
        const {
          onSetting,
          // getPersonalAction,
        } = nextProps;
        onSetting();
        this.saveStorage();
        // 获取app设置
        // getPersonalAction()
        if (httpBaseConfig.ledBillboardState) {
          reset('ledBillboard');
        } else {
          reset('home');
        }
      }
    } else if (loginStatus === null) {
      this.setState({
        loging: false,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 获取缓存的账号密码
  async getStorgetUser() {
    let ret = null;
    ret = await getLoginAccont();
    if (ret === null) {
      this.setState({
        storagrAccont: [],
      });
    }

    if (ret && ret.length > 0) {
      const item = ret[0];
      this.setState({
        accont: item.accont,
        password: item.password,
        ip: item.ip,
        defaultIp: item.defaultIp,
      });

      if (item.ip === '') {
        this.setState({
          ifIpInputShow: false,
        });
      } else {
        this.setState({
          ifIpInputShow: true,
        });
      }
    } else {
      this.setState({
        accont: '',
        password: '',
        ip: '',
        defaultIp: '',
        isAdminIconUP: false,
        historyLoginComponentStyle: {
          display: 'none',
        },
      });
    }

    this.setState({
      storagrAccont: ret, // 历史账号列表
    });
  }

  // 获取app设置信息
  async getStorgetSetting() {
    let ret = null;
    ret = await getUserSetting();

    if (ret) {
      this.setState({
        appSetting: ret.login,
      }, () => {
        this.setImgUrl();
      });
    } else {
      this.setState({
        appSetting: null,
      });
    }
  }

// 版本回调
onScanningResult=(e) => {
  const { result } = e;

  const { updateObj } = this.state;
  const { url } = updateObj;
  const resNum = Number(result);
  // console.warn('jj', resNum);
  // toastShow('版本检查中...\n请稍候', { duration: 0 });
  if (resNum === 0) {
    toastShow('已是最新版本', { duration: 2000 });
    return;
  }


  if (resNum === 1) {
    // console.warn('url4411', url);

    NativeModules.AppVersionModule.updateApp(Math.random(), 10200, url);
  }
  if (resNum === 3 || resNum === 2) {
    Alert.alert(
      '发现新版本', // 提示标题
      '是否立即安装', // 提示内容
      [
        {
          text: getLocale('personalAlertCancle'),
          style: 'cancel',
        },
        {
          text: getLocale('personalAlertSure'),
          onPress: () => {
            // console.warn('安装');
            NativeModules.AppVersionModule.installApp(Math.random());
          },
        },
      ],
      { cancelable: false },
    );
  }
}

  // 组装logo图片
  setImgUrl=() => {
    const { storagrAccont, appSetting } = this.state;
    if (!isEmpty(storagrAccont)) {
      const userIp = storagrAccont[0].ip;
      const userDefaultIp = storagrAccont[0].defaultIp;
      const imgIp = userIp === '' ? userDefaultIp : `http://${userIp}`;

      const imgUrl = `${imgIp}${appSetting.logo}`;
      this.setState({
        imgUrl,
      });
    }
  }

  // 账号缓存
  saveStorage=() => {
    const {
      accont,
      password,
      rememberPW,
      ip,
    } = this.state;

    getLoginAccont().then((ret) => {
      ret.forEach((element, index) => {
        if (element.accont === accont) {
          ret.splice(index, 1);
        }
      });

      ret.unshift({
        accont,
        password: rememberPW === true ? password : '',
        ip,
        defaultIp: `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}`, // 默认地址
      });

      storage.save({
        key: 'loginAccont',
        data: ret,
      });
      this.getStorgetUser();
    }).catch(() => {
      const newRet = [{
        accont,
        password,
        ip,
        defaultIp: `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}`,
      }];

      storage.save({
        key: 'loginAccont',
        data: newRet,
      });

      this.getStorgetUser();
    });
  }

  // 关于登录
  about=() => {
    // NativeModules.RNBaiduMapSearchAddressModule.mapAddressSearch('39.993135|116.474175');
    const { appSetting } = this.state;
    if (appSetting && appSetting.about) {
      const about = appSetting.about.replace(/\\n/g, '');
      toastShow(about, { duration: 3000 });
    } else {
      toastShow(getLocale('loginAboutAlert'), { duration: 3000 });
    }
  }

  // 忘记密码
  forgetPw=() => {
    const { appSetting } = this.state;
    if (appSetting && appSetting.forgetPwd) {
      const forgetPwd = appSetting.forgetPwd.replace(/\\n/g, '');
      toastShow(forgetPwd, { duration: 3000 });
    } else {
      toastShow(getLocale('loginForgetPwAlert'), { duration: 3000 });
    }
  }

  // 账号输入框值变化
  accontInputChange=(val) => {
    this.setState({
      accont: val,
    });
  }

  // 密码输入框变化
  passwordInputChange=(val) => {
    this.setState({
      password: val,
    });
  }

  // ip输入框变化
  ipInputChange=(val) => {
    this.setState({
      ip: val,
    });
  }

  // 获取焦点
  onFocus=() => {
    this.setState({
      isAdminIconUP: false,
      historyLoginComponentStyle: {
        display: 'none',
      },
    });
  }

  // 选择历史账号
  chooseAccontFun=(item) => {
    this.setState({
      accont: item.accont,
      password: item.password,
      ifIpInputShow: !!item.ip,
      ip: item.ip,
      isAdminIconUP: false,
      historyLoginComponentStyle: {
        display: 'none',
      },
    }, () => {
      this.setState({
        ip: item.ip,
      });
    });
  }

  // 删除输入框内容
  delfun=(type) => {
    switch (type) {
      case 'admin':
        this.setState({
          accont: '',
        });
        break;
      case 'password':
        this.setState({
          password: '',
        });
        break;
      case 'ip':
        this.setState({
          ip: '',
        });
        break;
      default:
        break;
    }
  }

  // 删除历史记录
  deleteStorage=(accontList, index) => {
    Alert.alert(
      getLocale('loginAlertTitle'),
      getLocale('loginAlertContent'),
      [
        { text: getLocale('loginAlertCancel'), onPress: () => {} },
        {
          text: getLocale('loginAlertSure'),
          onPress: () => {
            accontList.splice(index, 1);
            storage.save({
              key: 'loginAccont',
              data: accontList,
            });
            this.getStorgetUser();
          },
        },
      ],
      { cancelable: false },
    );
  }

  // 显示隐藏历史记录
  showHistoryLogin=(isShow) => {
    this.setHeight();

    // const { storagrAccont } = this.state;
    if (isShow) {
      this.setState({
        isAdminIconUP: false,
        historyLoginComponentStyle: {
          display: 'none',
        },
      });
    } else {
      const { histroyH } = this.state;
      this.setState({
        isAdminIconUP: true,
        historyLoginComponentStyle: {
          height: histroyH,
          position: 'absolute',
          top: '100%',
          zIndex: 2000,
          backgroundColor: '#fff',
        },
        fadeAnim: new Animated.Value(0),
      }, () => {
        const { fadeAnim } = this.state;
        Animated.timing( // 随时间变化而执行动画
          fadeAnim, // 动画中的变量值
          {
            toValue: 1, // 透明度最终变为1，即完全不透明
            duration: 300, // 让动画持续一段时间
          },
        ).start();
      });
    }
  }

  // 网络设置显示隐藏
  netSetting=() => {
    const { ifIpInputShow } = this.state;
    this.setState({
      ifIpInputShow: !ifIpInputShow,
    });
  }

  // 记住密码
  checkboxChange=() => {
    const { rememberPW } = this.state;
    this.setState({ rememberPW: !rememberPW });
  }

  // 清除缓存
  handleClearStorage=() => {
    AsyncStorage.clear();
  }

  // input失去焦点收起键盘
  setBlur=() => {
    Keyboard.dismiss();
  }

  // 获取记住密码底部的偏移量
  onLayout=(e) => {
    NativeModules.UIManager.measure(e.target, (x, y, width, height, pageX, pageY) => {
      this.setState({
        contentH: pageY,
      }, () => {
        this.setHeight();
      });
    });
  }

  // 获取历史记录的偏移量
  onLayout2=(e) => {
    NativeModules.UIManager.measure(e.target, (x, y, width, height, pageX, pageY) => {
      this.setState({
        offsetY: pageY,
      }, () => {
        this.setHeight();
      });
    });
  }

  // 设置历史记录高度
  setHeight=() => {
    const { contentH, offsetY } = this.state;
    const H = contentH - offsetY;
    this.setState({
      histroyH: H,
    });
  }

  // 输入校验
  checkForm=() => {
    // const {
    //   accont, password, ip,
    // } = this.state;

    // let ips = '';
    // if (ip) {
    //   ips = ip.split(':')[1] ? ip : `${ip}:8080`;// 添加端口号
    // }

    // const ipReg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]):([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/;

    // const ipDomain = ips.split(':')[0];
    // const ipPort = ips.split(':')[1];
    // const domainReg = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
    // const portReg = /^([1-9]|[1-9]\d{1,3}|[1-6][0-5][0-5][0-3][0-5])$/;

    // // if (domainReg.test(ip)) {
    // //   ips = ip;
    // // }


    // let errMsg = '';
    // if (!accont || !password) {
    //   errMsg = 'loginAccountPWPropmt';
    // } else if (((ip !== '' && !ipReg.test(ips)) && (ip !== '' && !domainReg.test(ipDomain))) || (ip !== '' && !portReg.test(ipPort))) {
    //   errMsg = 'loginIpWrong';
    // } else {
    //   console.warn('ips', ips);

    //   this.setState({
    //     ip: ips,
    //   });
    // }

    // return errMsg;

    const {
      accont, password, ip,
    } = this.state;

    let ips = '';
    if (ip) {
      ips = ip.split(':')[1] ? ip : `${ip}:8080`;// 添加端口号
    }

    const ipReg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]):([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/;

    const domainReg = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;

    let errMsg = '';
    if (!accont || !password) {
      errMsg = 'loginAccountPWPropmt';
    } else if ((ip !== '' && !ipReg.test(ips)) && (ip !== '' && !domainReg.test(ip))) {
      errMsg = 'loginIpWrong';
    } else {
      let ipStr;
      if (ipReg.test(ips)) {
        ipStr = ips;
      } else {
        ipStr = ip;
      }
      // console.warn('ipStr', ipStr);
      this.setState({
        ip: ipStr,
      });
    }
    return errMsg;
  }

  // 登录
  login=() => {
    const { onLogin } = this.props;

    Keyboard.dismiss();
    // 输入校验
    const err = this.checkForm();
    if (err !== '') {
      toastShow(getLocale(err), { duration: 2000 });
      return;
    }

    if (!isConnected()) {
      toastShow(getLocale('noNetwork'), { duration: 2000 });
      return;
    }

    this.setState({
      loging: true,
    });

    const {
      accont, password,
    } = this.state;

    storage.save({// 缓存当前登录用户
      key: 'curAccont',
      data: accont,
    }).then(() => {
      const { ip } = this.state;
      onLogin({
        username: accont,
        password,
        ip,
        platform: Platform.OS,
        version: versionNumber,
      });
    });
  }

  render() {
    const {
      storagrAccont,
      accont,
      password,
      ip,
      rememberPW,
      isAdminIconUP,
      ifIpInputShow,
      fadeAnim,
      loging,
      historyLoginComponentStyle,
      appSetting,
      imgUrl,
    } = this.state;
    return (
      <TouchableOpacity
        style={styles.windowBody}
        activeOpacity={1}
        onPress={this.setBlur}
      >
        <View style={styles.body}>
          <KeyboardAvoidingView
            behavior="position"
            enabled
            style={[styles.center]}
            onKeyboardChange={e => this.boardChange(e)}
          >
            {/* logo 标题start */}
            {
              appSetting
                ? (
                  <View style={styles.center}>
                    <Image
                      resizeMode="contain"
                      style={styles.logo}
                      source={{ uri: imgUrl }}
                    />
                    <Text
                      style={styles.text1}
                      onPress={this.handleClearStorage}
                      numberOfLines={1}
                    >
                      {appSetting.title}
                    </Text>
                    <Text
                      style={styles.text2}
                      numberOfLines={1}
                    >
                      {appSetting.url}
                    </Text>
                  </View>
                )
                : (
                  <View style={styles.center}>
                    <Image
                      style={styles.logo}
                      source={logoPng}
                    />
                    <Text
                      style={styles.text1}
                      numberOfLines={1}
                      onPress={this.handleClearStorage}
                    >
                      {getLocale('loginTitle')}
                    </Text>
                    <Text
                      style={styles.text2}
                      numberOfLines={1}
                    >
                      {getLocale('loginURLtext')}
                    </Text>
                  </View>
                )
            }
            {/* logo 标题end */}

            {/* 用户名 */}
            <View style={styles.adminView}>
              <InputComponent
                inputType="admin"
                placeholder={getLocale('loginAdminPlaceholder')}
                showHistory={this.showHistoryLogin}
                inputChange={this.accontInputChange}
                isAdminIconUP={isAdminIconUP}
                value={accont}
                onFocus={this.onFocus}
                delfun={() => this.delfun('admin')}
                // boardType="decimal-pad"
              />
              {/* 历史账号 */}
              <View onLayout={(e) => { this.onLayout2(e); }} />
              <Animated.View
                style={[historyLoginComponentStyle, { opacity: fadeAnim }]}
              >
                <ScrollView
                  showsVerticalScrollIndicator
                >
                  <HistoryLogin
                    accontList={storagrAccont}
                    deleteFun={this.deleteStorage}
                    chooseAccont={this.chooseAccontFun}
                  />
                </ScrollView>
              </Animated.View>
            </View>

            {/* 密码 */}
            <InputComponent
              style={styles.inputComponent}
              inputType="password"
              placeholder={getLocale('loginPasswordPlaceholder')}
              inputChange={this.passwordInputChange}
              value={password}
              delfun={() => this.delfun('password')}
            />

            {/* ip */}
            {
                ifIpInputShow ? (
                  <InputComponent
                    style={styles.inputComponent}
                    inputType="ip"
                    placeholder={getLocale('loginIpPlaceholder')}
                    autoFocusautoFocus
                    inputChange={this.ipInputChange}
                    value={ip}
                    delfun={() => this.delfun('ip')}
                  />
                ) : (null)
              }

            {/* btn登录 */}
            <LinearGradient
              colors={['#33bbff', '#33aeff', '#339eff', '#3399ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >

              {
              loging ? <Loading type="inline" /> : (
                <TouchableHighlight
                  onPress={this.login}
                  underlayColor="transparent"
                >
                  <Text style={styles.loginBtn}>
                    {getLocale('login')}
                  </Text>
                </TouchableHighlight>
              )
            }

            </LinearGradient>

            {/* 记住密码、关于登录、忘记密码 */}
            <View style={styles.aboutLogin}>
              <CheckBox
                label={getLocale('loginRemenberPW')}
                labelStyle={{ fontSize: 14, color: '#333', marginTop: 5 }}
                checkedImage={checkboxYes}
                uncheckedImage={checkboxNo}
                checked={rememberPW}
                checkboxStyle={{
                  width: 15, height: 15, marginTop: 5, marginRight: -8,
                }}
                onChange={this.checkboxChange}
              />

              <TouchableHighlight
                onPress={this.about}
                underlayColor="transparent"
                style={{ marginRight: 14 }}
              >
                <Text style={{ color: '#333' }}>
                  {getLocale('loginAboutLogin')}
                </Text>
              </TouchableHighlight>

              <TouchableHighlight
                onPress={this.forgetPw}
                underlayColor="transparent"
              >
                <Text style={{ color: '#333' }}>
                  {getLocale('loginForgetPW')}
                </Text>
              </TouchableHighlight>
            </View>
          </KeyboardAvoidingView>
          <View
            onLayout={(e) => { this.onLayout(e); }}
          />

          {/* 底部bottom */}
          <View style={styles.bottom}>
            {/* 网络设置 */}
            <View
              // style={[styles.netBox, (isAdminIconUP && !isEmpty(storagrAccont) && storagrAccont.length !== 0)
              //   ? styles.hide
              //   : null]}
              style={styles.netBox}
            >
              <TouchableHighlight
                onPress={this.netSetting}
                underlayColor="transparent"
              >
                <View style={styles.netSetting}>
                  <Image
                    style={styles.netSettingIcon}
                    source={netSettingPng}
                  />
                  <Text style={{ color: '#333' }}>
                    {getLocale('loginNetSetting')}
                  </Text>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}
export default connect(
  state => ({
    loginStatus: state.getIn(['loginReducers', 'loginStatus']),
    loginFailReason: state.getIn(['loginReducers', 'loginFailReason']),
    ifNeedUpdate: state.getIn(['loginReducers', 'ifNeedUpdate']),
    updateAppNum: state.getIn(['loginReducers', 'updateAppNum']),
    ifClbsVerLow: state.getIn(['loginReducers', 'ifClbsVerLow']),
    clbsLowNum: state.getIn(['loginReducers', 'clbsLowNum']),
    key_: state.getIn(['loginReducers', 'key_']),
  }),
  dispatch => ({
    onSetting: () => {
      dispatch({ type: 'login/SAGA/SETTING_ACTION' });
    },
    onLogin: (payload) => {
      dispatch({ type: 'login/SAGA/LOGIN_ACTION', payload });
    },
    // getPersonalAction: () => {
    //   dispatch({ type: 'personalCenter/SAGA/GET_SETTING_ACTION' });// 获取app自定义信息
    // },
  }),
)(Login);
