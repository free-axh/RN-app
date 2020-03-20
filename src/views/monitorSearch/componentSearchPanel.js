import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  // ScrollView,
  // Keyboard,
} from 'react-native';
import Loading from '../../common/loading';
import PanelHead from './componentPanelHead';
import PanelBody from './componentPanelBody';
// import SearchPanelItem from './searchPanelItem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  count: {
    height: 30,
    lineHeight: 30,
    fontSize: 13,
    paddingHorizontal: 10,
  },
  body: {
    paddingVertical: 5,
  },
  hide: {
    display: 'none',
  },
});

class SearchPanel extends Component {
    static propTypes = {
      searchCount: PropTypes.number.isRequired,
      monitorCount: PropTypes.number.isRequired,
      monitorSearch: PropTypes.array.isRequired,
      searchStatus: PropTypes.string.isRequired,
      addMonitor: PropTypes.func.isRequired,
    }

    constructor(props) {
      super(props);
      this.state = {
        active: 0,
        count: 0,
        monitorNum: 0,
        result: [],
      };
    }

    componentWillReceiveProps(nextProps) {
      const {
        searchCount, monitorSearch, searchStatus, monitorCount,
      } = nextProps;
      const { pageSize } = this.state;
      if (searchStatus) {
        if (searchStatus === 'success' && searchCount > 0) {
          const data = [...monitorSearch.values()];
          const flag = data.length > pageSize;
          this.setState({
            count: searchCount,
            monitorNum: monitorCount,
            result: data,
            // result: flag ? data.slice(0, pageSize) : data,
            showFooter: flag ? 0 : 1,
            isPullTop: !!flag,
            active: 0,
          });
        } else {
          this.setState({
            active: 0,
            count: 0,
            monitorNum: monitorCount,
            result: [],
          });
        }
      } else {
        this.setState({
          active: 0,
          count: 0,
          monitorNum: monitorCount,
          result: [],
        });
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      return !is(this.props, nextProps) || !is(this.state, nextState);
    }

    // 展开关闭列表
    getList = (index) => {
      const { active } = this.state;

      if (active === index) {
        this.setState({
          active: -1,
        });
        return;
      }

      this.setState({
        active: index,
      });
    }

  // FlatList 渲染列表
  renderItem=({ item, index }) => {
    const { addMonitor } = this.props;
    const { active } = this.state;

    const lists = item.get('lists');
    const assigns = item.get('assigns');

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.6}
          style={{ width: '100%' }}
          onPress={() => this.getList(index)}
        >
          <PanelHead
            title={assigns}
            count={lists.size}
            isActive={active === index}
          />
        </TouchableOpacity>
        {
          active === index
            ? (
              <PanelBody
                eventItem={[...lists]}
                addMonitor={addMonitor}
              />
            )
            : null
        }
      </View>
    );
  }


  render() {
    const {
      result, count, monitorNum,
    } = this.state;
    const { searchStatus } = this.props;

    return (
      <View style={styles.container}>
        {
        searchStatus !== 'success' ? <Loading type="page" />
          : (
            <View style={{ flex: 1 }}>
              {
                result.length === 0
                  ? (
                    <Text style={styles.count}>
                    搜索结果 {count}条,暂无该监控对象!
                    </Text>
                  )
                  : (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.count}>
                          搜索结果,{monitorNum}个对象,{count}条记录
                      </Text>
                      <FlatList
                        data={result}
                        initialNumToRender={result.length > 20 ? 20 : result.length}
                        renderItem={this.renderItem}
                        keyExtractor={(item, index) => (index)}
                        extraData={this.state}
                        onEndReachedThreshold={0.5}
                      />
                    </View>
                  )
              }
            </View>
          )
      }
      </View>
    );
  }
}

export default connect(
  state => ({
    searchStatus: state.getIn(['monitorSearchReducers', 'searchStatus']), // 搜索结果数量
    searchCount: state.getIn(['monitorSearchReducers', 'searchCount']), // 搜索结果数量
    monitorCount: state.getIn(['monitorSearchReducers', 'monitorCount']), // 搜索监控对象总数
    monitorSearch: state.getIn(['monitorSearchReducers', 'monitorSearch']), // 搜索数据列表
  }),
  dispatch => ({
    addMonitor: (id, callback) => {
      dispatch({ type: 'HOME/SAGA/HOME_GET_MONITOR', id, callback }); // 单个分组列表action
    },
  }),
)(SearchPanel);