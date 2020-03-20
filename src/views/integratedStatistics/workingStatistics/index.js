/* eslint no-bitwise:off */
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

class WorkingStatistics extends Component {
  static navigationOptions = ({ navigation }) => PublicNavBar(
    navigation,
    getLocale('workingStatistics'),
  )

  static propTypes = {
    startTime: PropTypes.object,
    endTime: PropTypes.object,
    monitors: PropTypes.array.isRequired,
    activeMonitor: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    barChartData: PropTypes.array.isRequired,
    isSuccess: PropTypes.bool.isRequired,
    onInit: PropTypes.func.isRequired,
    navigation: PropTypes.object.isRequired,
    checkMonitors: PropTypes.array.isRequired,
    queryPeriod: PropTypes.number.isRequired,
    detailsData: PropTypes.object,
    getDetails: PropTypes.func.isRequired,
    resetDetails: PropTypes.func.isRequired,
    currentIndex: PropTypes.number,
    extraState: PropTypes.object,
  }

  static defaultProps={
    activeMonitor: null,
    startTime: null,
    endTime: null,
    detailsData: null,
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
    initStatus: state.getIn(['workingStatisticsReducers', 'initStatus']),
    isSuccess: state.getIn(['workingStatisticsReducers', 'isSuccess']),
    barChartData: state.getIn(['workingStatisticsReducers', 'barChartData']),
    queryPeriod: state.getIn(['workingStatisticsReducers', 'queryPeriod']),
    detailsData: state.getIn(['workingStatisticsReducers', 'detailsData']),
    currentIndex: state.getIn(['workingStatisticsReducers', 'currentIndex']),
    extraState: state.getIn(['workingStatisticsReducers', 'extraState']),
  }),
  dispatch => ({
    onInit: (payload) => {
      dispatch({ type: 'workingStatistics/SAGA/INIT_ACTION', payload });
    },
    getDetails: (payload) => {
      dispatch({ type: 'workingStatistics/SAGA/GET_DETAILS_ACTION', payload });
    },
    resetDetails: (payload) => {
      dispatch({ type: 'workingStatistics/SAGA/RESET_DETAIL_ACTION', payload });
    },
  }),
)(WorkingStatistics);