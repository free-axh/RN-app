import React, { Component } from 'react';
import { is } from 'immutable';
import {
  StyleSheet, View,
} from 'react-native';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import ScrollableTabView, { DefaultTabBar } from 'react-native-scrollable-tab-view';
import { getLocale } from '../../utils/locales';
import Panel from './componentPanel';
import SearchPanel from './componentSearchPanel';
import ToolBar from '../../common/toolBar';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  active: {
    height: 2,
    backgroundColor: '#3399FF',
    color: '#3399FF',
  },
  tabTxt: {
    fontSize: 15,
    paddingTop: 11,
  },
});

class TabsBar extends Component {
  static propTypes = {
    monitors: PropTypes.object.isRequired,
    activeMonitor: PropTypes.object.isRequired,
    counter: PropTypes.object.isRequired,
    monitorGroupAction: PropTypes.func.isRequired,
    monitorEmptyAction: PropTypes.func.isRequired,
    monitorCounterAction: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      total: 0,
      online: 0,
      offline: 0,
      tabPage: 0,
      search: 0,
      searchList: [],
      searchLoad: false,
      tab: -1,
    };
  }

  // 组件加载完毕
  componentDidMount() {
    // 统计
    const { monitorCounterAction } = this.props;
    monitorCounterAction({
      type: 0,
    });

    // 分组数据
    const { tab } = this.state;
    if (tab === -1) {
      this.tabChange({
        i: 0,
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      counter,
      page,
    } = nextProps;

    // 统计
    if (counter.size > 0) {
      this.setState({
        total: counter.get('total'), // 全部数
        online: counter.get('online'), // 在线数
        offline: counter.get('offline'), // 离线数
      });
    }

    // 页面切换(1为切换到搜索页)
    this.setState({
      tabPage: page,
    });

    // 搜索页返回重新获取分组数据
    if (page === 0) {
      this.tabChange({
        i: 0,
      }, 'search');
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount() {
    this.setState({
      tab: -1,
    });
  }

  // tab切换
  tabChange=(obj, type) => {
    const { monitorGroupAction, monitorEmptyAction } = this.props;
    const { tab } = this.state;
    const currentTab = obj.i;

    if (tab === currentTab && !type) {
      return;
    }

    this.setState({
      tab: currentTab,
    });

    monitorEmptyAction();// 页面置空
    monitorGroupAction({
      type: currentTab,
    });
  }

  render() {
    const {
      total,
      online,
      offline,
      tabPage,
    } = this.state;

    const {
      monitors,
      activeMonitor,
    } = this.props;


    return (
      <View style={styles.container}>
        {
        tabPage === 1 // 为1显示搜索页面
          ? (
            <SearchPanel />
          )
          : (
            <ScrollableTabView
              tabBarUnderlineStyle={styles.active}
              tabBarBackgroundColor="#F4F7FA"
              tabBarActiveTextColor="#3399FF"
              tabBarInactiveTextColor="#616161"
              // scrollWithoutAnimation
              locked
              renderTabBar={() => <DefaultTabBar />}
              tabBarTextStyle={styles.tabTxt}
              onChangeTab={this.tabChange}
            >
              <Panel tabLabel={`${getLocale('monitorSearchTab1')} (${total})`} />
              <Panel tabLabel={`${getLocale('monitorSearchTab2')} (${online})`} />
              <Panel tabLabel={`${getLocale('monitorSearchTab3')} (${offline})`} />
            </ScrollableTabView>
          )
      }

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
    counter: state.getIn(['monitorSearchReducers', 'counter']), // 统计数量
    page: state.getIn(['monitorSearchReducers', 'page']), // 搜索页面切换
  }),
  dispatch => ({
    // 数量统计
    monitorCounterAction: (params) => {
      dispatch({ type: 'monitorSearch/SAGA/GET_COUNTER_ACTION', params });
    },
    // tab切换
    monitorGroupAction: (params) => {
      dispatch({ type: 'monitorSearch/SAGA/GET_MONITORGROUP_ACTION', params });
    },
    // 清空数据
    monitorEmptyAction: (params) => {
      dispatch({ type: 'monitorSearch/GROUP_EMPTY_ACTION', params });
    },
  }),
)(TabsBar);