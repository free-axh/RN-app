import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  Image,
  Dimensions,
  CameraRoll,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import VideoView from '../../common/video/VideoView';
import { getUserSetting } from '../../server/getStorageData';

import { requestConfig } from '../../utils/env';
// import storage from '../../utils/storage';

import refreshVideo from '../../static/image/refreshVideo.png';
// var url = 'ws://' + Env.videoRequestUrl + ':' + Env.videoRequestPort + '/' + unique;
const Env = requestConfig();
// console.warn('video:' + Env);
const windowH = Dimensions.get('window').height;
const windowW = Dimensions.get('window').width;
// style
const styles = StyleSheet.create({
  noVideo: {
    backgroundColor: 'rgb(217,217,217)',
  },
  videoItem: {
    width: '50%',
    height: '50%',
    padding: 2,
    borderColor: '#fff',
    borderWidth: 2,
    position: 'relative',
    backgroundColor: '#fff',
    zIndex: 100,
  },
  itemTitle: {
    height: 30,
    paddingLeft: 10,
    paddingRight: 10,
    color: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgb(51,187,255)',
  },
  titleTxt: {
    color: '#fff',
    fontSize: 15,
    maxWidth: '40%',
  },
  driveRoom: {
    height: 26,
    lineHeight: 26,
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: 'rgb(228,228,228)',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgb(217,217,217)',
  },
  requestVideo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestVideoText: {
    top: 20,
    color: '#fff',
    fontSize: 16,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(109, 109, 109, 0.8)',
  },
  refreshCont: {
    width: 60,
    height: 60,
    position: 'absolute',
    left: '50%',
    marginLeft: -30,
    top: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109, 109, 109, 0.8)',
    borderRadius: 5,

  },
  refreshPng: {
    width: 42,
    height: 40,
  },
  fullScreenItem: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5000,
  },
});

class VideoItem extends Component {
 static propTypes = {
   item: PropTypes.object.isRequired,
   brand: PropTypes.string.isRequired,
   choosenVideo: PropTypes.number.isRequired,
   videoChoose: PropTypes.func.isRequired, // 点击选择视频事件
   refreshVideoFun: PropTypes.func.isRequired, // 刷新视频
   videoStateChangeFun: PropTypes.func.isRequired, // 播放状态改变
   fullScreenFun: PropTypes.func.isRequired, // 全屏不能滑动函数
   captureCallback: PropTypes.func.isRequired, // 拍照
   screenFlag: PropTypes.bool.isRequired,
 }

 constructor(props) {
   super(props);
   this.state = {
     ifOpenVideo: false,
     ifSuccess: true,
     ifFullScreen: false,
     clickTime: null, // 双击时间间隔
     ifState0: false,
     fullScreenStyle: { // 全屏横屏样式

     },
     realTimeVideoPort: Env.videoRequestPort,
     realTimeVideoIp: Env.realTimeVideoIp,
     ifCaptureAndroid: false,
   };

   // this.getStorageVideoRequestPort();
 }


 componentWillReceiveProps(nextProps) {
   const { item: preItem } = this.props;
   const { item, captureCallback } = nextProps;
   if (item) {
     // 拍照

     if (item.ifCapture && !preItem.ifCapture) {
       if (Platform.OS === 'ios') {
         this.refCapture(item);
       }
       if (Platform.OS === 'android') {
         this.setState({
           ifCaptureAndroid: true,
         });
         setTimeout(() => {
           this.setState({
             ifCaptureAndroid: false,
           });
           captureCallback(item, true);
         }, 500);
       }
     }

     if (item.physicsChannel === 1) {
       //  console.warn('item哈哈哈', item);
     }
     const { socketUrl, playFlag } = item;
     if (socketUrl) {
       this.setState({
         ifOpenVideo: playFlag,
       });
     } else {
       this.setState({
         ifOpenVideo: false,
       });
     }
   }
 }


 shouldComponentUpdate(nextProps, nextState) {
   return !is(this.props, nextProps) || !is(this.state, nextState);
 }

 // 获取缓存的视频端口port
 // getStorageVideoRequestPort() {
 //   // let ret2 = null;
 //   // ret2 = await getUserSetting();
 //   // if (ret2 === null) {
 //   //   this.setState({
 //   //     realTimeVideoPort: '3791',
 //   //     realTimeVideoIp: '113.204.5.58',
 //   //   });
 //   // }
 //   //
 //   // if (ret2) {
 //   //   this.setState({
 //   //     realTimeVideoPort: ret2.realTimeVideoPort,
 //   //     realTimeVideoIp: ret2.realTimeVideoIp,
 //   //   });
 //   // }
 //   console.warn('Env', Env);
 //   this.setState({
 //     realTimeVideoIp: Env.realTimeVideoIp,
 //     realTimeVideoPort: Env.videoRequestPort,
 //   });
 // }

 // 选择切换视频
 videoChoose=() => {
   const {
     clickTime,
     ifFullScreen,
     ifSuccess,
   } = this.state;
   const {
     item, videoChoose, screenFlag, refreshVideoFun,
   } = this.props;
   if (typeof videoChoose === 'function') {
     videoChoose(item);
   }

   const ifFullScreenNew = ifFullScreen;

   const time = new Date();
   const millisencod = time.getTime();
   if (clickTime) {
     const differValue = millisencod - clickTime;
     if (differValue < 500) {
       //  ifFullScreenNew = !ifFullScreenNew;

       const { fullScreenFun } = this.props;
       if (typeof fullScreenFun === 'function') {
         //  fullScreenFun(ifFullScreenNew);

         fullScreenFun(!screenFlag);
         // console.warn('!ifSuccess', !ifSuccess);

         if (!screenFlag && refreshVideoFun && !ifSuccess) {
           // console.warn('双击重新播放视频');

           refreshVideoFun(item);
         }
       }
     }
   }


   this.setState({
     clickTime: millisencod,
     ifFullScreen: ifFullScreenNew,
   });
 }

 // 视频状态改变后触发
 videoStateFun=(state) => {
   const sta = parseInt(state, 10);
   if (sta === 3) { // 播放成功
     this.setState({
       ifSuccess: true,
     });
   }
   if (sta === 4 || sta === 2 || sta === 1) {
     this.setState({
       ifSuccess: false,
     });
   }

   if (sta === 0) {
     this.setState({
       ifSuccess: true,
       ifState0: true,
     });
   } else {
     this.setState({
       ifState0: false,
     });
   }

   // 播放状态改变后传给父组件
   const { videoStateChangeFun, item } = this.props;
   if (typeof videoStateChangeFun === 'function') {
     videoStateChangeFun(item, sta);
   }
 }

 // 刷新视频
 refreshVideo=() => {
   const { refreshVideoFun, item } = this.props;
   if (typeof refreshVideoFun === 'function') {
     refreshVideoFun(item);
   }
 }

  refCapture=(item) => {
    // console.warn('拍照');

    const { captureCallback } = this.props;


    captureRef(this[`refCapture${item.physicsChannel}`], {
      //  format: 'png',
      //  quality: 0.8,
      format: 'jpg',
      quality: 0.8,
      //  snapshotContentContainer: true,
    }).then(

      (uri) => {
        if (Platform.OS === 'android') {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'My App Storage Permission',
              message: 'My App needs access to your storage '
                + 'so you can save your photos',
            },
          ).then((granted) => {
            // console.warn('granted:', granted);
            // console.warn('uri', uri);

            const promise = CameraRoll.saveToCameraRoll(uri, 'photo');
            promise.then((res) => {
              // console.warn('保存成功', res);
              captureCallback(item, true);
            }).catch((err) => {
              // console.warn('errrrrr', err);
              captureCallback(item, false);
            });
          }).catch((err) => {
            console.error('Failed to request permission ', err);
            captureCallback(item, false);
          });
        } else {
          const promise = CameraRoll.saveToCameraRoll(uri, 'photo');
          promise.then((res) => {
            // console.warn('保存成功', res);
            captureCallback(item, true);
          }).catch((err) => {
            // console.warn('errrrrr', err);
            captureCallback(item, false);
          });
        }
      },
      (error) => {
        // console.warn('失败', error);
        //  captureCallback(item, false);
      },
    );
  }


 handleOnLayout=() => {
   //  const {
   //    nativeEvent: {
   //      layout: {
   //        x, y, width, height,
   //      },
   //    },
   //  } = evt;
   //  const data = {
   //    x,
   //    y,
   //    width,
   //    height,
   //  };
   //  console.warn('data', data);
   const { item } = this.props;
   this[`myComponent${item.physicsChannel}`].measure((fx, fy, width, height, px, py) => {
     console.log('fx', fx, 'fy', fy, 'with', width, 'height', height, 'px', px, 'py', py);

     this.setState({
       fullScreenStyle: {
         height: windowH,
         width: windowW,
         position: 'absolute',
         left: -px,
         top: -py,
         //  left: 0,
         //  top: 0,
         zIndex: 100000,
         //  transform: [{ rotateZ: '90deg' }],
       },
     });
   });
 }

 render() {
   const {
     item, brand, choosenVideo, screenFlag,
   } = this.props;
   const {
     //  ifFullScreen,
     ifOpenVideo,
     ifSuccess,
     ifCaptureAndroid,
     //  fullScreenStyle,
     ifState0,
     realTimeVideoPort,
     realTimeVideoIp,
     //  ifOpenAudio,
   } = this.state;
   let url;
   let sampleRate;
   // console.warn('realTimeVideoIp', realTimeVideoIp);
   // console.warn('realTimeVideoPort', realTimeVideoPort);
   if (item) {
     const { socketUrl, audioSampling } = item;
     //  url = `ws://${Env.videoRequestUrl}:${Env.videoRequestPort}/${socketUrl}`;
     //  url = `ws://${Env.baseUrl}:${realTimeVideoPort}/${socketUrl}`;
     url = `ws://${realTimeVideoIp}:${realTimeVideoPort}/${socketUrl}`;
     sampleRate = audioSampling || 8000;
   } else {
     url = '';
     sampleRate = '';
   }
   // console.warn('url', url);

   return (
     item
       ? (
         <View style={{ flex: 1 }}>
           <View style={styles.itemTitle}>
             <Text style={styles.titleTxt}>通道{item.physicsChannel}</Text>
             <Text style={[styles.titleTxt, { maxWidth: '60%', width: '60%', textAlign: 'right' }]} numberOfLines={1}>{brand}</Text>
           </View>
           <Text style={styles.driveRoom}>{item.logicChannelName}</Text>
           <TouchableHighlight
             onPress={this.videoChoose}
             underlayColor="transparent"
             style={[{ flex: 1 }]}
             ref={(view) => { this[`myComponent${item.physicsChannel}`] = view; }}
           >
             <VideoView
               ref={(ref) => { this[`refCapture${item.physicsChannel}`] = ref; }}
               style={[styles.video]}
               ifOpenVideo={ifOpenVideo}
               socketUrl={url}
               videoStateFun={this.videoStateFun}
               sampleRate={sampleRate}
               ifOpenAudio={item.ifOpenAudio}
               screenFlag={screenFlag}
               ifCurrentScreenFlag={item.physicsChannel === choosenVideo}
               ifCaptureAndroid={ifCaptureAndroid}
               item={item}
             />
           </TouchableHighlight>

           {
             !ifSuccess ? (
               <TouchableHighlight
                 onPress={this.refreshVideo}
                 underlayColor="transparent"
                 style={styles.refreshCont}
               >
                 <Image source={refreshVideo} style={styles.refreshPng} />
               </TouchableHighlight>
             ) : (null)
           }

           {
             ifState0 ? (
               <View style={styles.requestVideo}>
                 <View style={styles.requestVideoText}>
                   <Text style={{ color: '#fff' }}>音视频请求中...</Text>
                 </View>
               </View>
             ) : (null)
           }

         </View>
       )
       : (
         <View style={{ flex: 1 }}>
           <View style={styles.itemTitle}>
             <Text style={styles.titleTxt}>通道--</Text>
             <Text style={[styles.titleTxt, { maxWidth: '60%', width: '60%', textAlign: 'right' }]} numberOfLines={1}>{brand}</Text>
           </View>
           <Text style={styles.driveRoom}>--</Text>
           <View style={styles.video} />
         </View>
       )
   );
 }
}

export default VideoItem;