import React from 'react';
import {
  requireNativeComponent,
  StyleSheet,
  View,
  Platform,
  NativeModules,
  UIManager,
  findNodeHandle,
} from 'react-native';

import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  videoBoxStyle: {
    height: 200,
    width: 200,
  },
  videoStyle: {
    flex: 1,
    width: '100%',
    height: '100%',
    // backgroundColor: 'rgb(217,217,217)',
  },
});
class RNTVideoView extends React.Component {
    static propTypes = {
      style: PropTypes.shape(styles.videoStyle), // 样式，宽高等
      ifOpenVideo: PropTypes.bool.isRequired, // 是否开启视频
      socketUrl: PropTypes.string.isRequired, // url地址
      videoStateFun: PropTypes.func.isRequired, // 播放视频状态
      sampleRate: PropTypes.number.isRequired, // 音频采样率
      ifOpenAudio: PropTypes.bool.isRequired, // 是否播放音频

      screenFlag: PropTypes.bool, // 是否全屏
      ifCurrentScreenFlag: PropTypes.bool, // 是否当前全屏
      ifCaptureAndroid: PropTypes.bool, // android截屏

    }

    static defaultProps = {
      style: null,
      screenFlag: false,
      ifCurrentScreenFlag: false,
      ifCaptureAndroid: false,
    }

    constructor(props) {
      super(props);
      this.state = {
        ifstate3: false,
      };
    }

    componentWillReceiveProps(nextProps) {
      const { ifCaptureAndroid } = nextProps;
      if (ifCaptureAndroid) {
        this.capture();
      }
    }

    componentWillUnmount() {
      // console.warn('video unmount');
      if (Platform.OS === 'ios' && this.videoRef) {
        // console.warn(this.videoRef.RNTVideoView);
        /* eslint no-underscore-dangle:off */
        NativeModules.ZWVideoViewManager.close(this.videoRef._nativeTag);
      }
    }

    play=() => {
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(this),
        UIManager.ZWVideoView.Commands.play,
        [],
      );
    }

    stop=() => {
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(this),
        UIManager.ZWVideoView.Commands.stop,
        [],
      );
    }

    capture=() => {
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(this.videoRef),
        UIManager.ZWVideoView.Commands.capture,
        [],
      );
    }

    onVideoStateChange=(val) => {
      const { state } = val.nativeEvent;
      const { videoStateFun } = this.props;
      if (typeof videoStateFun === 'function') {
        // console.warn('state哈哈哈', state[0]);
        if (Platform.OS === 'android') {
          if (state === 3) {
            this.setState({
              ifstate3: true,
            });
            setTimeout(() => {
              this.setState({
                ifstate3: false,
              });
            }, 100);
          }

          videoStateFun(state);
        } else {
          videoStateFun(state[0]);
        }
      }
    }

    render() {
      const {
        style, ifOpenVideo, socketUrl, sampleRate, ifOpenAudio, screenFlag, ifCurrentScreenFlag,
      } = this.props;
      const { ifstate3 } = this.state;
      // const ifShow = ifOpenVideo ? null : ({ display: 'none' });
      // console.warn('screenFlag && !ifCurrentScreenFlag', screenFlag && !ifCurrentScreenFlag);
      // console.warn('ifOpenAudio', ifOpenAudio)
      return (
        <View style={[styles.videoBoxStyle, style]}>
          <RNTVideo
            ref={(ref) => { this.videoRef = ref; }}
            ifOpenVideo={ifOpenVideo}
            ifOpenAudio={ifOpenAudio}
            sampleRate={sampleRate}
            style={[styles.videoStyle, ifstate3 ? { width: '99%' } : null, screenFlag && !ifCurrentScreenFlag ? { opacity: 0, top: -2000, zIndex: -1 } : null]}
            socketUrl={socketUrl}
            onChange={this.onVideoStateChange}
          />
        </View>

      );
    }
}
const RNTVideo = requireNativeComponent('ZWVideoView', null);
export default RNTVideoView;