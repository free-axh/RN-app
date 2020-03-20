import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import { getLocale } from '../../../utils/locales';
import Loading from '../../../common/loading';
import Content from './content';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

class AlarmRank extends Component {
  data={
    startTime: null,
    oldStartTime: null,
  }

  static navigationOptions = ({ navigation }) => PublicNavBar(
    navigation,
    getLocale('alarmRank'),
  )

  static propTypes = {
    navigation: PropTypes.object.isRequired,
    startTime: PropTypes.object,
    endTime: PropTypes.object,
    monitors: PropTypes.array.isRequired,
    checkMonitors: PropTypes.array.isRequired,
    activeMonitor: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    barChartData: PropTypes.array.isRequired,
    pieChartData: PropTypes.object.isRequired,
    isSuccess: PropTypes.bool.isRequired,
    queryPeriod: PropTypes.number.isRequired,
    onInit: PropTypes.func.isRequired,
    detailsData: PropTypes.object.isRequired,
    getDetailData: PropTypes.func.isRequired,
    resetDetails: PropTypes.func.isRequired,
    currentIndex: PropTypes.number,
    extraState: PropTypes.object,
  }

  static defaultProps={
    activeMonitor: null,
    startTime: null,
    endTime: null,
    currentIndex: null,
    extraState: null,
  }


  render() {
    const { initStatus } = this.props;

    return (
      <View style={styles.container}>
        {
          initStatus === 'ing' ? <Loading type="modal" /> : null
        }
        <Content {...this.props} />
      </View>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    initStatus: state.getIn(['alarmRankReducers', 'initStatus']),
    queryPeriod: state.getIn(['alarmRankReducers', 'queryPeriod']),
    isSuccess: state.getIn(['alarmRankReducers', 'isSuccess']),
    barChartData: state.getIn(['alarmRankReducers', 'barChartData']),
    pieChartData: state.getIn(['alarmRankReducers', 'pieChartData']),
    detailsData: state.getIn(['alarmRankReducers', 'detailsData']),
    currentIndex: state.getIn(['alarmRankReducers', 'currentIndex']),
    extraState: state.getIn(['alarmRankReducers', 'extraState']),
  }),
  dispatch => ({
    onInit: (payload) => {
      dispatch({ type: 'alarmRank/SAGA/INIT_ACTION', payload });
    },
    getDetailData: (payload) => {
      dispatch({ type: 'alarmRank/SAGA/GET_DETAILS_ACTION', payload });
    },
    resetDetails: (payload) => {
      dispatch({ type: 'alarmRank/SAGA/RESET_DETAIL_ACTION', payload });
    },
  }),
)(AlarmRank);