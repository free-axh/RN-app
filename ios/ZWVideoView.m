//
//  ZWVideoView.m
//  rnProject
//
//  Created by zwkj on 2018/8/29.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "ZWVideoView.h"
#import "ZWStreamPlayer.h"

#import <React/RCTComponent.h> //事件

@interface ZWVideoView() <ZWStreamPlayerDelegate>

  @property (nonatomic, copy) NSString* socketUrl; //url地址
  @property (nonatomic, assign) BOOL ifOpenVideo; //是否开启视频
  @property (nonatomic, assign) int sampleRate; //音频采样率
  @property (nonatomic,assign) BOOL ifOpenAudio;//是否开启音频
  @property (nonatomic, strong) ZWStreamPlayer* player;

  @property (nonatomic, copy) RCTBubblingEventBlock onChange; // 事件

@end


@implementation ZWVideoView

-(void)close
{
    NSLog(@"close ZWVideoView");
    if(_player)
    {
        [_player close];
    }
}

-(void)setSocketUrl:(NSString*)socketUrl
{
  _socketUrl = socketUrl;
}

-(void)setSampleRate:(int)sampleRate
{
  _sampleRate = sampleRate;
}

-(void)setIfOpenAudio:(BOOL)ifOpenAudio
{
  _ifOpenAudio = ifOpenAudio;
  
  if (_player) {
    if (_ifOpenAudio) {
      [_player playAudio];
    }else{
      [_player closeAudio];
    }
  }
}

/**
 * 设置视频播放或停止
 */
-(void)setIfOpenVideo:(BOOL)ifOpenVideo
{
    _ifOpenVideo = ifOpenVideo;

    if(_ifOpenVideo)
    {
      if(_player)
      {
        NSLog(@"前端代码有误");
        abort();
      }
      NSLog(@"sampleRate: %d", _sampleRate);
//      _player = [[ZWStreamPlayer alloc] initWithUri:_socketUrl view:self delegate:self sampleRate:8000 enableAudio:true];
      _player = [[ZWStreamPlayer alloc] initWithUri:_socketUrl view:self delegate:self sampleRate:_sampleRate enableAudio:_ifOpenAudio];
      NSLog(@"onPlay 123456");
    }
    else if(_player)
    {
      NSLog(@"关闭视频");
      [_player close];
      _player = nil;
      NSLog(@"onStop 123456");
    }
    else
    {
        NSLog(@"player is nil, ifOpenVideo: %d", _ifOpenAudio);
    }
}

/**
 * 0链接socket成功，1出错，2关闭,3打开视频成功,4关闭视频
 */
-(void)onState:(int)state
{
  NSLog(@"state%i",state);
  if (!self.onChange) {
    NSLog(@"354454544544s");
    return;
  }
 
//  _videoStateChange([NSNumber numberWithInt:1]);
  
//  NSArray *array = [NSArray arrayWithObject:[NSNumber numberWithInt:state]];
  
  self.onChange(@{@"state":[NSArray arrayWithObject:[NSNumber numberWithInt:state]]});
  
}
@end
