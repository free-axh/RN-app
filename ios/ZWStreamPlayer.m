//
//  ZWStreamPlayer.m
//  VideoEx1
//
//  Created by 改革丰富 on 2018/7/26.
//  Copyright © 2018年 改革丰富. All rights reserved.
//

#import "ZWStreamPlayer.h"
#import "SocketRocket/SRWebSocket.h"
#import "ZWHardDecoder.h"
#import "ZWAudioUnit.h"
#include <pthread.h>

static const int PAYLOAD_TYPE_MASK = ((1 << 7) - 1);

@interface ZWFrameData : NSObject

@property (nonatomic, assign) uint8_t* data;
@property (nonatomic, assign) uint32_t trueLen;
@property (nonatomic, assign) int type;
@property (nonatomic, assign) uint32_t duration;
@property (nonatomic, assign) uint64_t startTime;

@end

@implementation ZWFrameData

-(void)dealloc
{
    free(_data);
}

@end

@interface ZWStreamPlayer() <SRWebSocketDelegate>
{
    pthread_mutex_t _mutex;
    pthread_cond_t _condition;
}

@property (nonatomic, strong) SRWebSocket* webSocket;
@property (nonatomic, strong) ZWStreamView* view;
@property (nonatomic, strong) ZWHardDecoder* decoder;
@property (nonatomic, strong) NSMutableArray<ZWFrameData*>* frameDataArray;
@property (nonatomic, strong) NSMutableArray<ZWFrameData*>* audioDataArray;
@property (nonatomic, strong) dispatch_queue_t queue;
@property (nonatomic, strong) dispatch_queue_t audioQueue;
@property (nonatomic, strong) dispatch_semaphore_t videoSem;
@property (nonatomic, strong) dispatch_semaphore_t audioSem;
@property (nonatomic, strong) dispatch_semaphore_t waitSem;
@property (nonatomic, assign) uint64_t lastTime;
@property (nonatomic, assign) uint64_t currentTime;
@property (nonatomic, assign) uint64_t timeBase;
@property (nonatomic, assign) int timeAdd;
@property (atomic, assign) int isStart;
@property (nonatomic, assign) size_t allLen;
@property (nonatomic, assign) int sampleRate;
@property (nonatomic, assign) bool isPlayAudio;

@property (nonatomic, assign) int isRender;

@end

@implementation ZWStreamPlayer

-(instancetype)initWithUri:(NSString*)uri view:(ZWStreamView*)view delegate:(id<ZWStreamPlayerDelegate>)delegate sampleRate:(int)sampleRate enableAudio:(bool)enableAudio
{
    self = [super init];
    if(self)
    {
        _uri = uri;
        _view = view;
        _isRender = 0;
        self.delegate = delegate;
        _decoder = [[ZWHardDecoder alloc] init];
        _queue = dispatch_queue_create([uri UTF8String], DISPATCH_QUEUE_SERIAL);
        _audioQueue = dispatch_queue_create("audio", DISPATCH_QUEUE_SERIAL);
        _frameDataArray = [[NSMutableArray alloc] init];
        _audioDataArray = [[NSMutableArray alloc] init];
        _videoSem = dispatch_semaphore_create(1);
        _audioSem = dispatch_semaphore_create(1);
        _waitSem = dispatch_semaphore_create(0);
        _webSocket = [[SRWebSocket alloc] initWithURL:[[NSURL alloc] initWithString:_uri]];
        _webSocket.delegate = self;
        [_webSocket open];
        _isStart = 1;
        _sampleRate = sampleRate;
        _isPlayAudio = enableAudio;
        [self timeLoop];
    }
    return self;
}

-(void)dealloc
{
    NSLog(@"Destroy stream player.");
}

-(void)playAudio
{
    _isPlayAudio = true;
}

-(void)closeAudio
{
    _isPlayAudio = false;
}

-(void)close
{
    [_webSocket close];
    _webSocket = nil;
    dispatch_semaphore_wait(_videoSem, DISPATCH_TIME_FOREVER);
    dispatch_semaphore_wait(_audioSem, DISPATCH_TIME_FOREVER);
    self.isStart = 0;
    dispatch_semaphore_signal(_videoSem);
    dispatch_semaphore_signal(_audioSem);
    dispatch_sync(_queue, ^{});
    dispatch_sync(_audioQueue, ^{});
    if(self.delegate)
    {
      [self.delegate onState:4];
    }
}

-(void)timeLoop
{
    __weak ZWStreamPlayer* weakSelf = self;
    dispatch_async(_queue, ^{
        __strong ZWStreamPlayer* player = weakSelf;
        while(player.isStart)
        {
            dispatch_semaphore_wait(player.videoSem, DISPATCH_TIME_FOREVER);
            if(player.frameDataArray.count)
            {
                ZWFrameData* frameData = player.frameDataArray.firstObject;
                if(frameData)
                {
                    dispatch_semaphore_signal(player.videoSem);
                    uint64_t time = [[NSProcessInfo processInfo] systemUptime] * 1000000;
                    int64_t sleepTime = frameData.startTime - time;
                    if(sleepTime > 0)
                    {
                        usleep((uint32_t)sleepTime);
                    }
                    NSLog(@"play video data");
                    CVPixelBufferRef pixelBuffer = [player.decoder decode:frameData.data
                                                                      len:frameData.trueLen
                                                                frameType:frameData.type];
                    if(pixelBuffer)
                    {
                        [player.view draw:pixelBuffer];
                        CFRelease(pixelBuffer);
                        if(!player.isRender)
                        {
                            player.isRender = 1;
                            if(player.delegate)
                            {
                                [player.delegate onState:3];
                            }
                        }
                    }
                    dispatch_semaphore_wait(player.videoSem, DISPATCH_TIME_FOREVER);
                    [player.frameDataArray removeObjectAtIndex:0];
                    player.allLen -= frameData.trueLen;
                }

            }
            else
            {
                dispatch_semaphore_wait(player.waitSem, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_MSEC));
            }
            dispatch_semaphore_signal(player.videoSem);
        }
        player = nil;
    });
    
    dispatch_async(_audioQueue, ^{
        __strong ZWStreamPlayer* player = weakSelf;
        ZWAudioUnit *audioUnit = [[ZWAudioUnit alloc] initAudioUnit:player.sampleRate];
        while (player.isStart) {
            @autoreleasepool {
                dispatch_semaphore_wait(player.audioSem, DISPATCH_TIME_FOREVER);
                if (player.audioDataArray.count) {
                    ZWFrameData* frameData = player.audioDataArray.firstObject;
                    if (frameData == nil)
                    {
                        continue;
                    }
                    uint8_t *data = frameData.data + 26;
                    NSLog(@"play audio data");
                    [audioUnit play:data dataLen:frameData.trueLen audioFormat:frameData.type];
                    [player.audioDataArray removeObjectAtIndex:0];
                    dispatch_semaphore_signal(player.audioSem);
                    continue;
                }
                dispatch_semaphore_wait(player.waitSem, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_MSEC));
                dispatch_semaphore_signal(player.audioSem);
            }
        }
        [audioUnit stop];
        [audioUnit audio_release];
    });
}

-(void)pushFrameData:(ZWFrameData*)frameData
{
    dispatch_semaphore_wait(_videoSem, DISPATCH_TIME_FOREVER);
    _allLen += frameData.trueLen;
    _currentTime = _allLen > 30000000 ? 0 : _currentTime;
    [_frameDataArray addObject:frameData];
    if(_frameDataArray.count > 20)
    {
        _timeAdd = 2;
    }
    else if (_frameDataArray.count < 10)
    {
        _timeAdd = 0;
    }
    frameData.startTime -= _timeAdd;
    dispatch_semaphore_signal(_videoSem);
}

-(void)pushAudioData:(ZWFrameData*)frameData {
    dispatch_semaphore_wait(_audioSem, DISPATCH_TIME_FOREVER);
    [_audioDataArray addObject:frameData];
    dispatch_semaphore_signal(_audioSem);
}

-(void)saveData:(uint8_t*)frameData len:(size_t)len time:(uint64_t)time
{
    int type = (frameData[15] & 0xf0) >> 4;
    if(((_currentTime != 0 && type < 3) || type == 0) && ((_currentTime == 0 && _allLen < 10000000) || (_currentTime != 0 && _allLen < 30000000)))
    {
        int frameHeadLen = 30;
        uint64_t currentTime = ntohll(*((uint64_t*)(frameData + 16)));
        uint16_t duration = ntohs(*((uint16_t*)(frameData + 26)));
        duration = _currentTime == 0 ? 0 : (duration > 0 ? duration : currentTime - _currentTime);
        _currentTime = currentTime;
        duration = (duration > 0 && duration < 500) ? duration : 40;
        int offset = 0;
        int trueLen = 0;
        int rtpLen = 0;
        while(rtpLen <= 950 && offset < len)
        {
            rtpLen = ntohs(*((uint16_t*)(frameData + offset + 28)));
            memcpy(frameData + trueLen, frameData + offset + frameHeadLen, rtpLen);
            trueLen += rtpLen;
            offset += rtpLen + frameHeadLen;
        }
        if(rtpLen <= 950 && offset == len)
        {
            ZWFrameData* saveData = [[ZWFrameData alloc] init];
            saveData.data = frameData;
            saveData.trueLen = trueLen;
            saveData.type = type;
            saveData.duration = duration * 1000;
            _timeBase = _timeBase == 0 ? time : _timeBase;
            saveData.startTime = _timeBase;
            _timeBase += saveData.duration;
            [self pushFrameData:saveData];
        }
    } else if (type == 3) {
        if (!_isPlayAudio) {
            free(frameData);
            frameData = NULL;
            return;
        }
        uint8_t payloadType = *(frameData + 5) & PAYLOAD_TYPE_MASK;
        ZWFrameData* saveData = [[ZWFrameData alloc] init];
        saveData.data = frameData;
        saveData.type = payloadType;
        saveData.trueLen = ntohs(*((uint16_t*)(frameData + 24)));
        saveData.startTime = time;
        [self pushAudioData:saveData];
    } else {
        // init ZWFrameData to let GCD to release the frameData
        ZWFrameData* saveData = [[ZWFrameData alloc] init];
        saveData.data = frameData;
    }
}

-(void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message
{
    uint64_t time = [[NSProcessInfo processInfo] systemUptime] * 1000000;
    if([message isKindOfClass:[NSData class]])
    {
        NSData* data = message;
        uint8_t* mutableData = malloc(data.length);
        memcpy(mutableData, data.bytes, data.length);
        if(data.length > 30)
        {
            [self saveData:mutableData len:data.length time:time];
        }
        else
        {
            free(mutableData);
        }
    }
    if(time - _lastTime > 5000000)
    {
        [webSocket sendString:@"0" error:nil];
        _lastTime = time;
    }
}

-(void)webSocketDidOpen:(SRWebSocket *)webSocket
{
    NSLog(@"%@ open", _uri);
    if(self.delegate)
    {
        [self.delegate onState:0];
    }
}

-(void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
    NSLog(@"%@ error: %@", _uri, error);
    if(self.delegate)
    {
        [self.delegate onState:1];
    }
}

-(void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
    NSLog(@"%@ close, reson: %@", _uri, reason);
    if(self.delegate)
    {
        [self.delegate onState:2];
    }
}

@end
