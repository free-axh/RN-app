import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image,
} from 'react-native';
// import * as Animatable from 'react-native-animatable';
import { go } from '../../../utils/routeCondition';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ToolBar from '../../../common/toolBar';
import { getUserSetting } from '../../../server/getStorageData';
import { isEmpty } from '../../../utils/function';
import {
  getDefaultMonitors, judgeUserIfOwnSend, judgeUserPollingOilMassMonitor,
  getWorkingStatisticalMonitor, getPollingOilMassMonitor,
  getOilConsumptionMonitor,
} from '../../../server/getData';
import { toastShow } from '../../../utils/toastUtils';

import { getLocale } from '../../../utils/locales';
import wArrowRight from '../../../static/image/wArrowRight.png';
import { serviceError, tokenOverdue, serviceConnectError } from '../../../utils/singleSignOn';
import storage from '../../../utils/storage';
import NetworkModal from '../../../utils/networkModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,250)',
  },
  totalHeaderBox: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderTopColor: '#eee',
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  totalHeader: {
    padding: 12,
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 16,
    color: '#555',
  },
  noData: {
    marginTop: 30,
    lineHeight: 25,
    textAlign: 'center',
  },
  panel_icon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
});

class IntegrativeStatistics extends Component {
// 顶部导航
static navigationOptions = ({ navigation }) => PublicNavBar(
  navigation,
  getLocale('comprehensiveStatistics'),
)

  static propTypes = {
    monitors: PropTypes.array.isRequired,
    activeMonitor: PropTypes.object.isRequired,
    // navigation: PropTypes.objectOf.isRequired, // 导航配置
  }

  constructor(props) {
    super(props);
    this.state = {
      totalData: [],
      maxNum: 100,
    };

    // 获取用户在后台配置的统计信息
    getUserSetting().then((res) => {
      const num = res.app.maxStatObjNum || 100;
      this.state.maxNum = num;

      const statistics = res.statistics || [];
      for (let i = 0; i < statistics.length; i += 1) {
        switch (statistics[i].name) {
          case getLocale('alarmRank'):// 报警排名
            statistics[i].goTarget = 'alarmRank';
            break;
          case getLocale('alarmDisposal'):
            statistics[i].goTarget = 'alarmDisposal';// 报警处置
            break;
          case getLocale('onlineStatistics'):// 上线统计
            statistics[i].goTarget = 'onlineStatistics';
            statistics[i].getType = 3;
            break;
          case getLocale('speedingStatistics'):// 超速统计
            statistics[i].goTarget = 'speedingStatistics';
            break;
          case getLocale('mileStatistics'):// 行驶统计
            statistics[i].goTarget = 'mileStatistics';
            statistics[i].getType = 3;
            break;
          case getLocale('stopStatistics'):// 停止统计
            statistics[i].goTarget = 'stopStatistics';
            statistics[i].getType = 3;
            break;
          case getLocale('workingStatistics'):// 工时统计
            statistics[i].goTarget = 'workingStatistics';
            break;
          case getLocale('fuelMileageStatistics'):// 油量里程
            statistics[i].goTarget = 'fuelMileageStatistics';
            break;
          case getLocale('devicesStatistics'):// 里程统计
            statistics[i].goTarget = 'devicesStatistics';
            break;
          case getLocale('fuelConsumptionStatistics'):// 油耗里程
            statistics[i].goTarget = 'fuelConsumptionStatistics';
            break;
          default:
            statistics[i].goTarget = '';
            break;
        }
      }
      this.setState({ totalData: statistics });
    }).catch((err) => {
      this.setState({ totalData: [] });
      console.log(err);
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

   // 跳转界面
   goTargetNav=(item) => {
     //  判断是否有监控对象
     const { activeMonitor } = this.props;
     if (isEmpty(activeMonitor)) {
       toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
       return;
     }

     if (item.goTarget === 'workingStatistics' || item.goTarget === 'fuelMileageStatistics' || item.goTarget === 'fuelConsumptionStatistics') { // 工时统计与油量里程,需判断下属监控对象是否有相关权限
       let judgeFun = judgeUserIfOwnSend;
       let getDefaultMonitorFun = getWorkingStatisticalMonitor;
       if (item.goTarget === 'fuelMileageStatistics') { // 油量里程
         judgeFun = judgeUserPollingOilMassMonitor;
         getDefaultMonitorFun = getPollingOilMassMonitor;
       }

       if (item.goTarget === 'fuelConsumptionStatistics') { // 油耗里程
         getDefaultMonitorFun = getOilConsumptionMonitor;
       }

       judgeFun().then((res) => {
         //  console.warn('res', res);
         if (res.statusCode === 200) {
           if (res.obj) {
             const { maxNum } = this.state;
             const checkMonitors = {
               assIds: [],
               hasCheckItems: [],
               monitors: [],
             };
             getDefaultMonitorFun({
               page: 1,
               pageSize: 20,
               defaultSize: maxNum,
             }).then((result) => {
               if (result.statusCode === 200) {
                 checkMonitors.monitors = result.obj.defaultCheckMonitorIdList;
                 go(item.goTarget, { checkMonitors });
               }
             });
           } else {
             toastShow(getLocale('notHasMonitor'), { duration: 2000 });
           }
         } else if (res.error === 'invalid_token') {
           storage.remove({
             key: 'loginState',
           });
           tokenOverdue();
         } else if (res.error === 'request_timeout') {
           NetworkModal.show({ type: 'timeout' });
         } else if (res.error !== 'network_lose_connected') {
           //  console.warn(11);
           serviceError();
         } else {
           serviceConnectError();
         }
       });
     } else {
       this.getDefaultMonitorsFun(item);
     }
   }

   // 获取默认勾选的监控对象
   getDefaultMonitorsFun=(item) => {
     const checkMonitors = {
       assIds: [],
       hasCheckItems: [],
       monitors: [],
     };
     const { maxNum } = this.state;
     const params = {
       type: item.getType ? item.getType : '0',
       defaultSize: maxNum,
       isFilter: item.number !== 2,
     };
     // 获取默认选中监控对象
     getDefaultMonitors(params).then((res) => {
       const monitorsObj = res;

       if (monitorsObj.statusCode === 200) {
         checkMonitors.monitors = monitorsObj.obj;
         if (monitorsObj.obj.length > 0) {
           go(item.goTarget, { checkMonitors });
         } else {
           toastShow(getLocale('notHasMonitor'), { duration: 2000 });
         }
       } else if (monitorsObj.error === 'invalid_token') {
         storage.remove({
           key: 'loginState',
         });
         tokenOverdue();
       } else if (monitorsObj.error === 'request_timeout') {
         NetworkModal.show({ type: 'timeout' });
       } else if (monitorsObj.error !== 'network_lose_connected') {
         //  console.warn(12);
         serviceError();
       } else {
         serviceConnectError();
       }
     });
   }

   renderItem(item) {
     return (
       <TouchableOpacity
         style={styles.totalHeaderBox}
         activeOpacity={0.6}
         onPress={() => { this.goTargetNav(item); }}
       >
         <Text
           style={styles.totalHeader}
         >
           {item.name}
         </Text>
         <Image
           source={wArrowRight}
           style={styles.panel_icon}
         />
       </TouchableOpacity>
     );
   }

   render() {
     const { monitors, activeMonitor } = this.props;
     const {
       totalData,
     } = this.state;

     return (
       <View style={styles.container}>
         <ScrollView
           style={styles.container}
         >
           {totalData.map(item => this.renderItem(item))}
           {totalData.length === 0 ? (
             <Text style={styles.noData}>{getLocale('notHasStatistics')}</Text>
           ) : null}
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
  dispatch => ({
    // 获取报警设置数据
    getMonitorData: (payload) => {
      dispatch({ type: 'integrativeStatistics/SAGA/GETDATA_ACTION', payload });
    },
  }),
)(IntegrativeStatistics);