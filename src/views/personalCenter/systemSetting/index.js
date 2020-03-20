import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  // Image,
  // Text,
  Dimensions,
  ScrollView,
//   TouchableHighlight,
//   Animated,
} from 'react-native';
// import { Actions } from 'react-native-router-flux';

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ToolBar from '../../../common/toolBar';
import SwitchBar from '../component/switchBar';
import MsgRemindSwitch from '../component/msgRemindSwitch';
import Title from '../component/title';
import storage from '../../../utils/storage';
import { getLocale } from '../../../utils/locales';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#F4F7FA',
    flex: 1,
  },
  outLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    fontWeight: 'bold',
    marginTop: 10,
    paddingHorizontal: 26,
    paddingVertical: 10,
  },
  textColor: {
    color: '#333',
    fontSize: 16,
  },
  title: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: windowWidth,
  },
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
});

class SystemSetting extends Component {
  // 页面导航
  static navigationOptions = ({ navigation }) => PublicNavBar(
    navigation,
    getLocale('sysSettingTitle'),
  )
  // static navigationOptions = ({ navigation }) => ({
  //   header: (
  //     <PublicNavBar title={getLocale('sysSettingTitle')} nav={navigation} />
  //   ),
  // });

  static propTypes = {
    monitors: PropTypes.object.isRequired,
    activeMonitor: PropTypes.object.isRequired,
    userName: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      voiceValue: true, // 声音开关
      shakeValue: true, // 震动开关
      msgRemind: true, // 免打扰开关
      msgRemindStart: '20:00', // 免打扰开始时间
      msgRemindEnd: '08:00', // 免打扰结束时间
    };
  }

  async componentDidMount() {
    this.readData();
  }

  componentDidUpdate() {
    this.saveSetting();
  }

  // 声音开关切换
  voiceSetting=(val) => {
    this.setState({
      voiceValue: val,
    });
  }

  // 震动开关切换
  shakeSetting=(val) => {
    this.setState({
      shakeValue: val,
    });
  }

  // 免打扰开关切换
  msgRemindSetting=(val) => {
    this.setState({
      msgRemind: val,
    });
  }

  // 免打扰开始时间改变
  startDateChange=(val) => {
    this.setState({
      msgRemindStart: val,
    });
  }

  // 免打扰结束时间改变
  endDateChange=(val) => {
    this.setState({
      msgRemindEnd: val,
    });
  }

  // 本地缓存系统设置
  saveSetting=() => {
    const { userName } = this.props;
    const {
      voiceValue,
      shakeValue,
      msgRemind,
      msgRemindStart,
      msgRemindEnd,
    } = this.state;

    const ret = {
      voice: voiceValue, // 声音
      shake: shakeValue, // 震动
      time: msgRemind, // 免打扰
      timeStart: msgRemindStart, // 免打扰开始时间
      timeEnd: msgRemindEnd, // 免打扰结束时间
    };

    storage.save({
      key: userName,
      data: ret,
    });
  }

  // 获取存储数据
  async readData() {
    const { userName } = this.props;
    let ret = null;
    try {
      ret = await storage.load({
        key: userName,
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
      console.log(err);
    }

    if (ret) {
      this.setState({
        voiceValue: ret.voice, // 声音开关
        shakeValue: ret.shake, // 震动开关
        msgRemind: ret.time, // 免打扰开关
        msgRemindStart: ret.timeStart, // 免打扰开始时间
        msgRemindEnd: ret.timeEnd, // 免打扰结束时间
      });
    }
  }

  render() {
    const { monitors, activeMonitor } = this.props;
    const {
      voiceValue, shakeValue, msgRemind, msgRemindStart, msgRemindEnd,
    } = this.state;
    return (
      // <ScrollView></ScrollView>
      <View style={styles.body}>
        <ScrollView>
          <View style={{ flex: 1, paddingBottom: 100 }}>
            {/* <View style={styles.title}>
              <Text style={{ fontSize: 14 }}>系统消息</Text>
            </View> */}
            <Title title={getLocale('sysSettingTit')} />
            <View style={styles.container}>
              <SwitchBar title={getLocale('sysSettingLabel1')} value={voiceValue} switchChange={this.voiceSetting} />
              <SwitchBar title={getLocale('sysSettingLabel2')} value={shakeValue} switchChange={this.shakeSetting} />
              <MsgRemindSwitch
                title={getLocale('sysSettingLabel3')}
                value={msgRemind}
                switchChange={this.msgRemindSetting}
                msgRemindStart={msgRemindStart}
                startDateChange={this.startDateChange}
                msgRemindEnd={msgRemindEnd}
                endDateChange={this.endDateChange}
              />
            </View>
          </View>
        </ScrollView>

        <ToolBar
          activeMonitor={activeMonitor}
          monitors={monitors}
        />
      </View>

    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
  }),
  null,
)(SystemSetting);