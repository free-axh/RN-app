import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  StyleSheet,
  View,
  Image,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import PanelVideo from './componentVideo';
import arrowLeft from '../../static/image/arrowBlue1.png';
import arrowRight from '../../static/image/arrowBlue2.png';
import arrowLeftDisable from '../../static/image/arrowgray1.png';
import arrowRightDisable from '../../static/image/arrowgray2.png';
import modalClose from '../../static/image/close.png';
import Loading from '../../common/loading';
import { getLocale } from '../../utils/locales';

const windowWidth = Dimensions.get('window').width * 0.8; // 获取屏幕宽度
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    width: windowWidth,
    height: windowWidth,
    position: 'relative',
  },
  close: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 32,
    height: 32,
  },
  item: {
    flex: 1,
    width: windowWidth,
  },
  item_title: {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 16,
  },
  media_box: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  bottom_box: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    paddingVertical: 10,
  },
  arrow: {
    flex: 1,
  },
  imgLoad: {
    position: 'absolute',
    width: 100,
    height: 30,
    left: '50%',
    top: '50%',
    marginLeft: -50,
    marginTop: -15,
  },
});

class MediaPage extends Component {
  static propTypes = {
    type: PropTypes.number.isRequired, // 媒体类型
    closeFun: PropTypes.func.isRequired, // 关闭弹窗
    mediaInfo: PropTypes.object.isRequired,
    mediaStatus: PropTypes.bool.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      currentDotindex: 1,
      count: 0,
      mediaData: [],
      currentMedia: null,
      isLoad: true,
      isFirst: true,
      isLast: false,
      mediaLoad: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillReceiveProps(nextProps) {
    const { mediaInfo, mediaStatus } = nextProps;
    if (mediaStatus === 'success') {
      if (mediaInfo.size > 0) {
        this.setState({
          count: mediaInfo.size,
          mediaData: [...mediaInfo],
          currentMedia: [...mediaInfo][0],
          isLast: mediaInfo.size === 1,
        });
      }

      this.setState({
        isLoad: false,
      });
    } else {
      this.setState({
        isLoad: false,
      });
    }
  }

  // 获取分页页码
  handleOnScrollEndDrag=(e) => {
    const offset = e.nativeEvent.contentOffset;
    if (offset) {
      const page = Math.round(offset.x / windowWidth) + 1;

      const { currentDotindex } = this.state;
      if (currentDotindex !== page) {
        this.setState({ currentDotindex: page });
      }
    }
  }

  // 上一页,下一页
  slideTo=(currentDotindex, num) => {
    const { count, mediaData } = this.state;

    if ((currentDotindex === count && num > 0) || (currentDotindex === 1 && num < 0)
    || count === 0) {
      return;
    }

    const inx = currentDotindex + num;
    this.setState({
      currentDotindex: inx,
      currentMedia: mediaData[inx - 1],
      isFirst: inx === 1,
      isLast: inx === count,
    });
  }

  // 图片生命周期
  onLoadStart=() => {
    // console.log('图片加载开始');
    this.setState({
      mediaLoad: true,
    });
  }

  onLoad=() => {
    // console.log('图片加载');
    this.setState({
      mediaLoad: true,
    });
  }

  onLoadEnd=() => {
    // console.log('图片加载完毕');
    this.setState({
      mediaLoad: false,
    });
  }

  onError=() => {
    // console.log('图片加载失败');
  }

  render() {
    const {
      currentDotindex, count, currentMedia, isLoad, isFirst, isLast, mediaLoad,
    } = this.state;
    const { type, closeFun } = this.props;
    // console.log('视频证据', currentMedia);
    return (
      <View
        style={styles.container}
      >
        {/* 视频/图片 start */}
        {
          isLoad ? <Loading type="page" />
            : (
              <View style={{ flex: 1 }}>
                {
                  (currentMedia && currentMedia.size > 0)
                    ? (
                      <View style={styles.item}>
                        <Text style={styles.item_title}>
                          {currentMedia.get('eventName')}-{currentMedia.get('eventTime').substr(11)}
                        </Text>

                        <View style={styles.media_box}>
                          {
                            type === 2
                              ? <PanelVideo VideoUrl={currentMedia.get('mediaUrl')} />
                              : (
                                <Image
                                  style={{ width: '100%', height: '100%' }}
                                  resizeMode="contain"
                                  source={{ uri: currentMedia.get('mediaUrl') }}
                                  onLoad={this.onLoad}
                                  onLoadStart={this.onLoadStart}
                                  onLoadEnd={this.onLoadEnd}
                                  onError={this.onError}
                                />
                              )
                          }

                          {
                            !mediaLoad ? null : <Text style={[styles.imgLoad]}>{getLocale('securityImgLoad')}</Text>
                          }
                        </View>
                      </View>
                    )
                    : null
                }
              </View>
            )
        }
        {/* 视频/图片 end */}

        {/* 底部页码 start */}
        <View style={styles.bottom_box}>
          <TouchableOpacity
            style={styles.arrow}
            onPress={() => { this.slideTo(currentDotindex, -1); }}
          >
            <Image
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
              source={!isFirst ? arrowLeft : arrowLeftDisable}
            />
          </TouchableOpacity>

          <Text style={[styles.page]}>{currentDotindex}/{count}</Text>

          <TouchableOpacity
            style={styles.arrow}
            onPress={() => { this.slideTo(currentDotindex, 1); }}
          >
            <Image
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
              source={!isLast && count !== 0 ? arrowRight : arrowRightDisable}
            />
          </TouchableOpacity>
        </View>
        {/* 底部页码 end */}

        {/* 关闭按钮 start */}
        <TouchableOpacity
          style={styles.close}
          onPress={closeFun}
        >
          <Image
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            source={modalClose}
          />
        </TouchableOpacity>
        {/* 关闭按钮 end */}
      </View>
    );
  }
}

export default connect(
  state => ({
    mediaStatus: state.getIn(['securityReducers', 'mediaStatus']), // 风险证据
    mediaInfo: state.getIn(['securityReducers', 'mediaInfo']), // 风险证据
  }),
  null,
)(MediaPage);