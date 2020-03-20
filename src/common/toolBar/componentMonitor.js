import React, { Component } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions,
} from 'react-native';
import { debounce } from 'lodash';
import { Actions } from 'react-native-router-flux';
import PropTypes from 'prop-types';
import wArrowLeft from '../../static/image/arrowBlue1.png';
import wArrowRight from '../../static/image/arrowBlue2.png';
// import carPic from '../../static/image/v_21.png';
import { setMonitor, setMonitors, refresh } from '../../utils/routeCondition';
import { isEmpty } from '../../utils/function';
import Loading from '../loading';
import { getLocale } from '../../utils/locales';
import { checkMonitorAuth, checkMonitorOnline } from '../../server/getData';
import { toastShow } from '../../utils/toastUtils';
import { errHandle } from '../../utils/network';
import SlideModal from './slideModal';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
// style
const styles = StyleSheet.create({
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 250,
  },
  listItem: {
    // textAlign: 'center',
    padding: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    // width: ITEM_WIDTH,
    // borderWidth: 1,
    // borderColor: 'red',
  },
  textItem: {
    textAlign: 'center',
    fontSize: 20,
    color: '#333',
    padding: 0,
    paddingHorizontal: 0,
  },
  modaltext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    padding: 0,
    paddingHorizontal: 0,
  },
  empty: {
    fontSize: 16,
    color: '#ccc',
  },
  text: {
    alignItems: 'center',
    width: 125,
  },
  focus: {
    color: '#2c7ae7',
  },
  arrowCotnainer: {
    // borderWidth: 1,
    // borderColor: 'purple',
    flex: 1,
  },
  arrow: {
    width: 17,
    height: 23,
    marginHorizontal: 5,
  },
  carPic: {
    width: 28,
    height: 15,
    marginHorizontal: 5,
  },
});


class Monitor extends Component {
  data={
    currentIndex: null,
    propIndex: null,
    lastTap: null,
    clickTimeoutId: null,
  }

  viewabilityConfig={
    itemVisiblePercentThreshold: 80,
  }

  static propTypes = {
    monitors: PropTypes.arrayOf(PropTypes.shape({
      markerId: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      monitorType: PropTypes.string.isRequired,
    })).isRequired, // 监控对象数组
    activeMonitor: PropTypes.object,
    isFocus: PropTypes.bool,
    onMonitorClick: PropTypes.func,
    onMonitorDbClick: PropTypes.func,
    onChange: PropTypes.func,
    neveronlinemonitorchange: PropTypes.func,
  }

  static defaultProps = {
    activeMonitor: null,
    isFocus: false,
    onMonitorClick: null,
    onMonitorDbClick: null,
    onChange: null,
    neveronlinemonitorchange: null,
  }

  constructor(props) {
    super(props);
    const { activeMonitor, monitors } = props;
    // console.log(props);
    // console.warn(activeMonitor);
    // console.warn(monitors);


    if (!isEmpty(activeMonitor) && !isEmpty(monitors)) {
      this.data.propIndex = monitors.findIndex(x => x.markerId === activeMonitor.markerId);
      this.data.currentIndex = this.data.propIndex;
      setMonitor(activeMonitor);
    } else if (isEmpty(activeMonitor) && !isEmpty(monitors)) {
      setMonitor(monitors.get(0));
    }

    if (isEmpty(monitors)) {
      setMonitor(null);
    }
    this.debounceIndexChange = debounce(this.handleOnChange, 500);
    this.debounceIndexChange500 = debounce(this.handleOnChange, 500);
  }

  state={
    listWidth: null,
    isFocus: false,
    modalVisible: false,
    currentMonitorId: null,
  }

  componentWillReceiveProps(nextProps) {
    const { activeMonitor, monitors, isFocus } = nextProps;


    if (isEmpty(monitors)) {
      setMonitor(null);
      this.data.propIndex = null;
      this.data.currentIndex = null;
    }

    const { currentMonitorId } = this.state;

    if (!isEmpty(activeMonitor) && !isEmpty(monitors)) {
      if (currentMonitorId === null
        || (currentMonitorId !== null
        && currentMonitorId !== activeMonitor.markerId)) {
        this.state.currentMonitorId = activeMonitor.markerId;
        this.data.propIndex = monitors.findIndex(x => x.markerId === activeMonitor.markerId);
        setMonitor(activeMonitor);
      }
    } else if (isEmpty(activeMonitor) && !isEmpty(monitors)) {
      this.data.propIndex = 0;
      const monitor = monitors.get(0);
      setMonitor(monitor);
      this.state.currentMonitorId = monitor.markerId;
    }

    this.setState({
      isFocus,
    });
  }


  shouldComponentUpdate(nextProps, nextState) {
    // const { activeMonitor: prevActiveMonitor, monitors: prevMonitors } = this.props;
    // const { activeMonitor, monitors } = nextProps;
    // const equal = !is(prevActiveMonitor, activeMonitor)
    // || !is(prevMonitors, monitors)
    // || !is(this.state, nextState);
    // return equal;
    const { listWidth: prevWidth, isFocus: prevFocus, modalVisible: prveModalVisible } = this.state;
    const { listWidth, isFocus, modalVisible } = nextState;
    const { currentIndex, propIndex } = this.data;


    const should = currentIndex !== propIndex
    || prevWidth !== listWidth
    || (currentIndex === null && propIndex === null)
    || prevFocus !== isFocus || prveModalVisible !== modalVisible;
    if (should) {
      this.data.currentIndex = this.data.propIndex;
    }
    return should;
  }

  componentWillUnmount() {
    this.setState({
      modalVisible: false,
    });
  }

  checkNeverOnline=(monitorId, item, index, callback) => {
    const key = Actions.currentScene;
    const neverOnlineScene = ['historyData', 'monitorVideo', 'monitorWake', 'monitorTrack', 'alarmInfo', 'home'];
    const offLineScene = ['monitorVideo', 'monitorWake'];
    const videoScene = ['monitorVideo'];
    const { neveronlinemonitorchange } = this.props;

    checkMonitorOnline({
      monitorId,
    }).then((res) => {
      if (res.statusCode === 200) {
        if (res.obj === 1) { // 1：校验通过
          callback(item, index);
        } else if (res.obj === 2) { // 2：不在线
          if (offLineScene.indexOf(key) > -1) {
            toastShow(getLocale('monitorOffLine'), { duration: 2000 });
          } else {
            callback(item, index);
          }
        } else if (res.obj === 4) { // 4: 从未上线
          if (neverOnlineScene.indexOf(key) > -1) {
            toastShow(getLocale('monitorNeverOnLine'), { duration: 2000 });
            if (typeof neveronlinemonitorchange === 'function') {
              neveronlinemonitorchange(item, index);
            }
            callback(item, index);
          } else {
            callback(item, index);
          }
        } else if (res.obj === 3) { // 3：不为808协议
          if (videoScene.indexOf(key) > -1) {
            toastShow(getLocale('video808Prompt'), { duration: 2000 });
          } else {
            callback(item, index);
          }
        }
      } else {
        errHandle(res, this.checkNeverOnline, monitorId, item, index, callback);
        // toastShow(getLocale('requestFailed'), { duration: 2000 });
      }
    });
  }

  handleOnChange=(index) => {
    const { monitors, onChange } = this.props;
    if (!isEmpty(monitors)) {
      if (typeof onChange === 'function') {
        const item = monitors.get(index);
        setMonitor(item);

        checkMonitorAuth({
          monitorId: item.markerId,
        }).then((res) => {
          if (res.statusCode === 200) {
            if (res.obj === 1) { // 1：未解绑
              this.checkNeverOnline(item.markerId, item, index, onChange);
            } else if (res.obj === 2) { // 解绑
              toastShow(getLocale('vehicleUnbindCluster'), { duration: 2000 });
              refresh();
            } else if (res.obj === 3) { // 没有权限
              toastShow(getLocale('noJurisdictionCluster'), { duration: 2000 });
              refresh();
            }
          } else {
            errHandle(res, this.handleOnChange, index);
            // toastShow(getLocale('requestFailed'), { duration: 2000 });
          }
        });


        // onChange(item, index);
      }
    }
    // this.setState({
    //   isFocus: false,
    // });
  }

  handleLeft = () => {
    const { monitors } = this.props;

    if (!isEmpty(monitors) && !isEmpty(this.listRef)) {
      const { currentIndex } = this.data;
      const newIndex = currentIndex - 1;
      if (currentIndex === 0) {
        // newIndex = monitors.length - 1;
        return;
      }

      this.listRef.scrollToIndex({
        animated: true,
        index: newIndex,
        viewOffset: 0,
        viewPosition: 0.5,
      });
      this.data.currentIndex = newIndex;
      this.data.propIndex = newIndex;
      this.debounceIndexChange500(newIndex);
    }
  }

  handleRight=() => {
    const { monitors } = this.props;
    if (!isEmpty(monitors) && !isEmpty(this.listRef)) {
      const { currentIndex } = this.data;
      const newIndex = currentIndex + 1;

      if (currentIndex === monitors.size - 1) {
        // newIndex = 0;
        return;
      }

      this.listRef.scrollToIndex({
        animated: true,
        index: newIndex,
        viewOffset: 0,
        viewPosition: 0.5,
      });
      this.data.currentIndex = newIndex;
      this.data.propIndex = newIndex;
      this.debounceIndexChange500(newIndex);
    }
  }

  // 点击快速切换条底部定位当前车辆
  setActiveMonitor=(item, ind) => {
    const { monitors } = this.props;
    if (!isEmpty(monitors) && !isEmpty(this.listRef)) {
      const newIndex = ind;
      this.listRef.scrollToIndex({
        animated: false,
        index: newIndex,
        viewOffset: 0,
        viewPosition: 0.5,
      });
      this.data.currentIndex = newIndex;
      this.data.propIndex = newIndex;
      this.debounceIndexChange500(newIndex);
      setMonitor(item);
    }
  }

  handleListIndexChanged=({ changed }) => {
    const [{ index, isViewable }] = changed;
    if (!isViewable) {
      return;
    }
    if (index === this.data.currentIndex) {
      return;
    }
    this.debounceIndexChange(index);
  }

  handleClick=(item, parma) => {
    const { onMonitorClick, onMonitorDbClick } = this.props;
    // console.warn('item', item);
    const now = Date.now();
    if (this.data.lastTap != null && (now - this.data.lastTap) < 300) {
      if (this.data.clickTimeoutId !== null) {
        clearTimeout(this.data.clickTimeoutId);
      }
      if (typeof onMonitorDbClick === 'function') {
        this.data.lastTap = null;
        this.data.clickTimeoutId = null;
        onMonitorDbClick(item);
        const { isFocus } = this.state;
        if (!isFocus) {
          this.setState({
            isFocus: true,
          });
        }


        if (parma !== undefined && parma !== null) {
          this.setActiveMonitor(item, parma);
        }

        return;
      }
    }
    this.data.lastTap = now;

    this.data.clickTimeoutId = setTimeout(() => {
      if (typeof onMonitorClick === 'function') {
        this.data.clickTimeoutId = null;
        onMonitorClick(item);
        this.setState({
          isFocus: false,
        });
        if (parma !== undefined && parma !== null) {
          this.setActiveMonitor(item, parma);
        }
      }
    }, 300);
  }

  onLongPress=(item) => {
    if (Actions.currentScene === 'home') {
      const { monitors } = this.props;
      this.setState({
        modalVisible: true,
      });


      if (monitors !== null) {
        const monitorsArr = [...monitors.values()];
        const len = monitorsArr.length;
        // console.warn('activeMonitor', len);
        if (len > 5) {
          monitorsArr.forEach((element, ind) => {
            const { markerId: eleId } = element;
            const { markerId } = item;
            if (markerId === eleId) {
              let scrollIndex;
              if (ind < 2) {
                scrollIndex = ind;
              } else if (ind > len - 3) {
                scrollIndex = len - 5;
              } else {
                scrollIndex = ind - 2;
              }
              // console.warn('ind', ind, 'scrollIndex', scrollIndex);


              this.modalFlatList.scrollToIndex({
                animated: true,
                index: scrollIndex,
                viewPosition: 0,
              });
            }
          });
        }
      }
    }
  }

  modalPress=() => {
    this.setState({
      modalVisible: false,
    });
  }

  /* eslint no-nested-ternary:off */
  render() {
    const { monitors, activeMonitor } = this.props;
    const { currentIndex: initialIndex } = this.data;
    const { listWidth, isFocus, modalVisible } = this.state;
    const itemWidth = windowWidth / 5;
    // console.warn(this.props, this.state);
    if (monitors !== null) {
      setMonitors(monitors);
    }
    return (
      <View style={styles.textContainer}>
        <TouchableOpacity onPress={this.handleLeft} style={[styles.arrowCotnainer, { alignItems: 'flex-end' }]}>
          <Image
            source={wArrowLeft}
            style={styles.arrow}
          />
        </TouchableOpacity>

        <View
          style={styles.text}
          onLayout={(event) => {
            this.setState({ listWidth: event.nativeEvent.layout.width });
          }}
        >

          {listWidth === null || monitors === null ? <Loading type="inline" color="#3399ff" /> : (
            monitors.size === 0 ? <Text style={styles.empty}>{getLocale('noMonitor')}</Text> : (
              <FlatList
                ref={(ref) => { this.listRef = ref; }}
                bounces={false}
                getItemLayout={(data, index) => (
                  { length: listWidth, offset: listWidth * index, index }
                )}
                key={initialIndex}
                initialScrollIndex={initialIndex}
                keyExtractor={x => x.markerId}
                showsHorizontalScrollIndicators
                pagingEnabled
                horizontal
                style={{
                  flex: 1,
                }}
                onViewableItemsChanged={this.handleListIndexChanged}
                viewabilityConfig={this.viewabilityConfig}
                data={[...monitors.values()]}
                renderItem={({ item: x }) => (
                  <View
                    style={[styles.listItem, { width: listWidth }]}
                    // onPress={() => { this.handleClick(x); }}
                  >
                    <Text
                      style={[styles.textItem,
                        isFocus && x.markerId === activeMonitor.markerId ? styles.focus : null,
                        { width: listWidth }]}
                      numberOfLines={2}
                      onLongPress={() => { this.onLongPress(x); }}
                      onPress={() => { this.handleClick(x); }}
                      ellipsizeMode="tail"
                    >
                      {x.title}
                    </Text>
                  </View>
                )
                }
              />
            )
          )}
        </View>
        <TouchableOpacity onPress={this.handleRight} style={styles.arrowCotnainer}>
          <Image
            source={wArrowRight}
            style={styles.arrow}
          />
        </TouchableOpacity>

        <SlideModal
          visible={modalVisible}
          animationInTiming={300}
        >
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={this.modalPress} style={{ flex: 1 }}>
              <View style={{ flex: 1 }} />
            </TouchableOpacity>
            <View style={{ height: 58, width: '100%', backgroundColor: '#fff' }}>
              {
                 monitors === null ? <Loading type="inline" color="#3399ff" /> : (
                   <FlatList
                     ref={(view) => { this.modalFlatList = view; }}
                     horizontal
                     data={[...monitors.values()]}
                     getItemLayout={(data, index) => (
                       { length: itemWidth, offset: itemWidth * index, index }
                     )}
                     initialNumToRender={10}
                     renderItem={({ item: x, index: num }) => (
                       <TouchableOpacity
                         style={[styles.listItem, { width: itemWidth }]}
                         onPress={() => { this.handleClick(x, num); }}
                       >
                         <View style={{
                           width: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                         }}
                         >
                           <Image
                             source={{ uri: x.ico }}
                             style={styles.carPic}
                             resizeMode="contain"
                           />
                           <Text
                             style={[styles.modaltext, { width: itemWidth }]}
                             numberOfLines={1}
                             ellipsizeMode="tail"
                           >
                             {x.title}
                           </Text>
                         </View>
                       </TouchableOpacity>
                     )
                     }
                    //  windowSize={300}
                   />
                 )
               }
            </View>
          </View>
        </SlideModal>
      </View>

    );
  }
}

export default Monitor;