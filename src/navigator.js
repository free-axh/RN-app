import React, { Component } from 'react';
import { StackViewStyleInterpolator } from 'react-navigation-stack';
import {
  Router, Scene,
} from 'react-native-router-flux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import { requestConfig, resetHttpConfig } from './utils/env';
import { resetHttpConfig } from './utils/env';
import Loading from './common/loading';
import Welcome from './common/welcome';
import { back } from './utils/routeCondition';
import Login from './views/login/login';
// import LoginZhonghuan from './views/loginZhonghuan/login';
import Home from './views/home/home';
import MonitorSearch from './views/monitorSearch';
import MonitorDetail from './views/monitorDetail';
import MonitorTrack from './views/monitorTrack';
import HistoryData from './views/historyData';
import SearchBar from './views/monitorSearch/componentSearchBar';
import AlarmCenter from './views/alarmModule/alarmCenter';
import AlarmInfo from './views/alarmModule/alarmInfo';
import AlarmSwitch from './views/alarmModule/alarmSwitch';
import PersonalCenter from './views/personalCenter'; // 个人中心
import UserInfo from './views/personalCenter/userInfo/index';// 用户信息
import SystemSetting from './views/personalCenter/systemSetting';// 系统设置
import Feedback from './views/personalCenter/feedback';// 意见反馈
import AboutUs from './views/personalCenter/aboutUs'; // 关于我们
import ChangePassword from './views/personalCenter/changePassword'; // 关于我们
import MonitorWake from './views/monitorWake';// 实时尾迹
import MonitorVideo from './views/monitorVideo';// 音视频监控
import Security from './views/security';// 主动安全
import SecurityInfo from './views/securityInfo';// 安全信息
import IntegrativeStatistics from './views/integratedStatistics/main';// 综合统计
import AlarmRank from './views/integratedStatistics/alarmRank';// 报警排名
import OnlineStatistics from './views/integratedStatistics/onlineStatistics';// 上线统计
import LedBillboard from './views/ledBillboard';// 领导看板
import SpeedingStatistics from './views/integratedStatistics/speedingStatistics'; // 超速统计
import AlarmDisposal from './views/integratedStatistics/alarmDisposal'; // 报警处置
import MileStatistics from './views/integratedStatistics/mileStatistics'; // 里程统计
import StopStatistics from './views/integratedStatistics/stopStatistics'; // 停止统计
import WorkingStatistics from './views/integratedStatistics/workingStatistics'; // 工时统计
import FuelMileageStatistics from './views/integratedStatistics/fuelMileageStatistics'; // 油量里程
import DevicesStatistics from './views/integratedStatistics/devicesStatistics'; // 里程统计
import FuelConsumptionStatistics from './views/integratedStatistics/fuelConsumptionStatistics'; // 油耗里程
import ObdMonitor from './views/obdMonitor'; // obd监控
import BaiduPanoDemo from './views/demo/baiduPano';
// import DatePicker from './views/test';

import { isSingleSignOnConnected } from './utils/singleSignOn';

resetHttpConfig();
// const httpBaseConfig = requestConfig();

const transitionConfig = () => ({
  screenInterpolator: StackViewStyleInterpolator.forHorizontal,
});

class Navigator extends Component {
  static propTypes={
    onInit: PropTypes.func.isRequired,
    isLoaded: PropTypes.bool.isRequired,
    hasToken: PropTypes.bool.isRequired,
    showWelcome: PropTypes.bool.isRequired,
    onEnter: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    const { onInit } = props;
    onInit();
  }

  componentDidMount() {
    isSingleSignOnConnected();
  }

  render() {
    const {
      isLoaded, hasToken, showWelcome, onEnter,
    } = this.props;

    if (!isLoaded) {
      return (
        <Loading type="page" />
      );
    }

    if (showWelcome) {
      return (
        <Welcome onEnter={onEnter} />
      );
    }

    console.warn('hasToken', hasToken);

    return (
      <Router backAndroidHandler={() => back()}>
        <Scene
          key="root"
          transitionConfig={transitionConfig}
        >
          <Scene
            key="login"
            component={Login}
            initial={!hasToken}
          />
          <Scene
            key="home"
            component={Home}
            // component={DatePicker}
            initial={hasToken}
            headerMode="none"
            hideNavBar
            navTransparent
            navBar={null}
          />

          <Scene key="monitorDetail" component={MonitorDetail} />
          <Scene key="monitorTrack" component={MonitorTrack} />
          <Scene
            key="historyData"
            component={HistoryData}
          />
          <Scene
            key="alarmRank"
            component={AlarmRank}
            // initial
          />
          <Scene
            key="onlineStatistics"
            component={OnlineStatistics}
            // initial
          />
          <Scene
            key="speedingStatistics"
            component={SpeedingStatistics}
            // initial
          />
          <Scene
            key="stopStatistics"
            component={StopStatistics}
          />
          <Scene
            key="mileStatistics"
            component={MileStatistics}
          />
          <Scene
            key="alarmDisposal"
            component={AlarmDisposal}
          />
          <Scene
            key="workingStatistics"
            component={WorkingStatistics}
          />
          <Scene
            key="fuelMileageStatistics"
            component={FuelMileageStatistics}
          />
          <Scene
            key="devicesStatistics"
            component={DevicesStatistics}
          />
          <Scene
            key="fuelConsumptionStatistics"
            component={FuelConsumptionStatistics}
          />

          <Scene
            navBar={SearchBar} // 自定义navBar组件
            key="monitorSearch"
            component={MonitorSearch}
          />
          {/* obd监控 */}
          <Scene key="obdMonitor" component={ObdMonitor} />
          <Scene key="alarmCenter" component={AlarmCenter} />
          <Scene key="alarmInfo" component={AlarmInfo} />
          <Scene key="alarmSwitch" component={AlarmSwitch} />
          {/* 个人中心begin */}
          <Scene key="integrativeStatistics" component={IntegrativeStatistics} />
          <Scene key="personalCenter" component={PersonalCenter} />
          <Scene key="userInfo" component={UserInfo} />
          <Scene key="systemSetting" component={SystemSetting} />
          <Scene key="feedback" component={Feedback} />
          <Scene key="aboutUs" component={AboutUs} />
          <Scene key="changePassword" component={ChangePassword} />
          {/* 个人中心end */}
          {/* 实时尾迹 */}
          <Scene key="monitorWake" component={MonitorWake} />
          {/* 音视频监控 */}
          <Scene key="monitorVideo" component={MonitorVideo} />

          {/* <Scene
            key="video"
            component={Video}
          /> */}
          <Scene
            // navBar={null}
            // initial={httpBaseConfig.ledBillboardState ? hasToken : !hasToken}
            key="ledBillboard"
            component={LedBillboard}
            // headerMode="none"
            // hideNavBar
            // navTransparent
          />

          {/* 主动安全 */}
          <Scene key="security" component={Security} />

          {/* 安全信息 */}
          <Scene key="securityInfo" component={SecurityInfo} />

          <Scene key="baiduPanoDemo" component={BaiduPanoDemo} />

        </Scene>
      </Router>
    );
  }
}

export default connect(
  state => ({
    isLoaded: state.getIn(['rootReducers', 'isLoaded']),
    hasToken: state.getIn(['rootReducers', 'hasToken']),
    showWelcome: state.getIn(['rootReducers', 'showWelcome']),
    key_: state.getIn(['rootReducers', 'key_']),
  }),
  dispatch => ({
    onInit: () => {
      dispatch({ type: 'root/SAGA/INIT_ACTION' });
    },
    onEnter: () => {
      dispatch({ type: 'root/ONENTER_ACTION' });
    },
  }),
)(Navigator);