// 上拉刷新,下拉加载公共组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  // Image,
  ListView,
} from 'react-native';

import { PullList } from 'react-native-pull';
// import * as Animatable from 'react-native-animatable';
// import refreshIco from '../static/image/refresh.png';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  refreshBox: {
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgBox: {
    // padding: 6,
    // borderRadius: 20,
    // borderWidth: 1,
    // borderStyle: 'solid',
    // borderColor: '#eee',
    // shadowRadius: 2,
    // alignItems: 'center',
    // justifyContent: 'center',
    // backgroundColor: '#fff',
  },
  refreshImg: {
    width: 26,
    height: 26,
  },
});

export default class extends Component {
  static propTypes = {
    onPullRelease: PropTypes.func.isRequired, // 上拉刷新方法
    renderHeader: PropTypes.func.isRequired, // 列表头部渲染样式
    dataSource: PropTypes.array.isRequired, // 列表数据
    pageSize: PropTypes.number.isRequired, // 每页显示数
    renderRow: PropTypes.func.isRequired, // 列表item显示样式
    renderSectionHeader: PropTypes.func.isRequired,
    onEndReached: PropTypes.func.isRequired, // 上拉加载方法
    renderFooter: PropTypes.func.isRequired, // 列表底部渲染样式
    layoutY: PropTypes.number.isRequired, // y轴位置(设置滚动条滚动到指定位置)
  }

  constructor(props) {
    super(props);
    this.state = {
      list: (new ListView.DataSource(
        {
          rowHasChanged: () => true,
          // rowHasChanged: (r1, r2) => {
          //   return r1 !== r2;
          // },
        },
      )),
    };
  }

  componentWillReceiveProps(nextProps) {
    let { dataSource } = nextProps;
    if (!dataSource) {
      dataSource = [];
    }
    if (dataSource) {
      const { list } = this.state;
      this.setState({
        list: list.cloneWithRows(dataSource),
      });
    }
  }

  // 下拉刷新
  onPullRelease=(resolve) => {
    const { onPullRelease } = this.props;
    if (typeof onPullRelease === 'function') {
      onPullRelease(resolve);
    }
  }

  // 下拉刷新加载样式
  topIndicatorRender=() => (
    <View style={styles.refreshBox}>
      {/* <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        direction="300"
      >
        <View style={styles.imgBox}>
          <Image
            source={refreshIco}
            style={styles.refreshImg}
          />
        </View>
      </Animatable.View> */}
    </View>
  )

  render() {
    const {
      renderHeader, layoutY,
      pageSize, renderRow, onEndReached, renderFooter, renderSectionHeader,
    } = this.props;
    const { list } = this.state;
    return (
      <View style={styles.container}>
        <PullList
          ref={(view) => {
            if (view !== null) {
              setTimeout(() => {
                if (layoutY) {
                  view.scrollTo({ x: 0, y: layoutY, animated: true });
                }
              }, 0);
            }
          }}
          nestedScrollEnabled
          stickyHeaderIndices={[0, 1, 2, 3]}
          stickySectionHeadersEnabled
          automaticallyAdjustContentInsets={false}
          onPullRelease={this.onPullRelease}
          topIndicatorRender={this.topIndicatorRender}
          topIndicatorHeight={30}
          renderHeader={renderHeader || (() => {})}
          dataSource={list}
          pageSize={pageSize || 10}
          initialListSize={10}
          renderRow={renderRow}
          onEndReached={onEndReached}
          onEndReachedThreshold={0}
          renderFooter={renderFooter}
          renderSectionHeader={renderSectionHeader}
        />
      </View>
    );
  }
}