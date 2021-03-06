/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTDevLoadingView.h>
#import <React/RCTRootView.h>
#import <CoreLocation/CoreLocation.h>
#import <AVFoundation/AVFoundation.h>
#import <AMapFoundationKit/AMapFoundationKit.h>
#import <Bugly/Bugly.h>
#import <UMShare/UMShare.h>
#import <UMCommon/UMCommon.h>
#import <UMCommonLog/UMCommonLogHeaders.h>
#import "GPSNaviViewController.h"
#import "RNAMapNaviModule.h"
#import "RNUMConfigure.h"

@implementation AppDelegate

@synthesize startNaviPoint;
@synthesize endNaviPoint;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

//#if RCT_DEV
  jsCodeLocation = [NSURL URLWithString:@"http://192.168.66.78:8081/index.bundle?platform=ios&dev=true"];
//#else
//  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
//#endif

  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:jsCodeLocation
                                            moduleProvider:nil
                                             launchOptions:launchOptions];
#if RCT_DEV
  [bridge moduleForClass:[RCTDevLoadingView class]];
#endif
  
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                      moduleName:@"rnProject"
                                               initialProperties:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  
  _nav=[[UINavigationController alloc]initWithRootViewController:rootViewController];
  _nav.navigationBarHidden = YES;
  
  self.window.rootViewController = _nav;
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(doAMapNaviNotification:) name:@"openAMapNavi" object:nil];
  
//  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  _mapManager = [[BMKMapManager alloc]init];
  // 如果要关注网络及授权验证事件，请设定     generalDelegate参数
  BOOL ret = [_mapManager start:@"UTL4FHMYP6MRWogBIkL5WBFLjGGpkCMQ"  generalDelegate:nil];
  if (!ret) {
    //NSLog(@"manager start failed!");
  }
  
  // 设置启动图片延迟时间
  [NSThread sleepForTimeInterval:3];

//  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
  [self onGetLocation];
  
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];
  
  [Bugly startWithAppId:@"392cd38994"];
  
  [self getMediaPermissions];
  
  // 高德地图导航
  [AMapServices sharedServices].apiKey = @"017109979273af910a6338728eccce6a"; // (NSString *)APIKey;
  
//  });
  //开发者需要显式的调用此函数，日志系统才能工作
  [UMCommonLogManager setUpUMCommonLogManager];
  [UMConfigure setLogEnabled:YES];//设置打开日志
  [UMConfigure initWithAppkey:@"5d7f56dd3fc195a8e4000e16" channel:@"App Store"];
  
  [UMConfigure setLogEnabled:YES];
  [RNUMConfigure initWithAppkey:@"5d7f56dd3fc195a8e4000e16" channel:@"App Store"];
  // U-Share 平台设置
  [self configUSharePlatforms];
  [self confitUShareSettings];
  
  return YES;
}

-(void)onGetLocation
{
  // 获取定位权限
  _manager = [[CLLocationManager alloc] init];
  [_manager requestAlwaysAuthorization];//一直获取定位信息
  // [_manager requestWhenInUseAuthorization];//使用的时候获取定位信息
  [_manager startUpdatingLocation];
//  CLLocation *location = _manager.location;
//  _userLocation = location.coordinate;
  
}

- (void)onGetNetworkState:(int)iError
{
  if (0 == iError) {
    NSLog(@"联网成功");
  }
  else{
    NSLog(@"onGetNetworkState %d",iError);
  }
  
}

- (void)onGetPermissionState:(int)iError
{
  if (0 == iError) {
    NSLog(@"授权成功");
  }
  else {
    NSLog(@"onGetPermissionState %d",iError);
  }
}

-(void)doAMapNaviNotification:(NSNotification *)notification
{
  NSLog(@"成功收到===>通知");
//  RCTBaiduMapView *mapView = [[RCTBaiduMapView alloc] init];
  GPSNaviViewController *vc = [[GPSNaviViewController alloc] init];
  vc.startPoint = self.startNaviPoint;
  vc.endPoint = self.endNaviPoint;
  
  RNAMapNaviModule *eventEmitter = [RNAMapNaviModule allocWithZone:nil];
  CLAuthorizationStatus stateInfo = [CLLocationManager authorizationStatus];
//  [eventEmitter notEnadledLocationPermission:nil];
//  [eventEmitter unableGetCurrentLocation:nil];
//  [eventEmitter unableGetTargetLocation:nil];
  if (stateInfo == kCLAuthorizationStatusDenied) { // 拒绝获取定位
    [eventEmitter notEnadledLocationPermission:nil];
  } else {
    // 将通知里面的userInfo取出来，使用
    if (vc.startPoint.longitude == 0 || vc.startPoint.latitude == 0) {
      // 无法获取当前位置
      [eventEmitter unableGetCurrentLocation:nil];
    } else if (vc.endPoint.longitude == 0 || vc.endPoint.latitude == 0) {
      // 无法获取监控对象位置
      [eventEmitter unableGetTargetLocation:nil];
    } else {
      [self.nav pushViewController:vc animated:YES];
    }
    // 注意不能在这里移除通知否则push进去后有pop失效
  }
}

- (void)confitUShareSettings
{
  /*
   * 打开图片水印
   */
  //[UMSocialGlobal shareInstance].isUsingWaterMark = YES;
  
  /*
   * 关闭强制验证https，可允许http图片分享，但需要在info.plist设置安全域名
   <key>NSAppTransportSecurity</key>
   <dict>
   <key>NSAllowsArbitraryLoads</key>
   <true/>
   </dict>
   */
  //[UMSocialGlobal shareInstance].isUsingHttpsWhenShareContent = NO;
  
}

- (void)configUSharePlatforms
{
  /* 设置微信的appKey和appSecret */
  [[UMSocialManager defaultManager] setPlaform:UMSocialPlatformType_WechatSession appKey:@"wx4f7d606dde72cc1d" appSecret:@"ec7c6e1c762314a596ee8606154db647" redirectURL:nil];
  /*
   * 移除相应平台的分享，如微信收藏
   */
  //[[UMSocialManager defaultManager] removePlatformProviderWithPlatformTypes:@[@(UMSocialPlatformType_WechatFavorite)]];
  
  /* 设置分享到QQ互联的appID
   * U-Share SDK为了兼容大部分平台命名，统一用appKey和appSecret进行参数设置，而QQ平台仅需将appID作为U-Share的appKey参数传进即可。
   */
  [[UMSocialManager defaultManager] setPlaform:UMSocialPlatformType_QQ appKey:@"1106561424"/*设置QQ平台的appID*/  appSecret:nil redirectURL:nil];
  
}

/**
 * 相机权限
 */
- (void)getMediaPermissions
{
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted){
    if (granted) {
      NSLog(@"允许");
    } else {
      NSLog(@"拒绝");
    }
  }];
}

@end
