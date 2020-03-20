//
//  RNAMapNavi.m
//  rnProject
//
//  Created by zwkj on 2019/2/18.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "RNAMapNavi.h"

#define kRoutePlanInfoViewHeight    130.f
#define kRouteIndicatorViewHeight   64.f

@implementation RNAMapNavi

/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect {
    // Drawing code
}
*/

- (void)viewDidLoad
{
  if (self.state) {
    return;
  }
  self.state = YES;
  [super viewDidLoad];
  
  //设置导航的起点和终点
  self.startPoint = [AMapNaviPoint locationWithLatitude:39.98 longitude:116.47];
  self.endPoint   = [AMapNaviPoint locationWithLatitude:39.99 longitude:116.45];
  
  //初始化AMapNaviDriveManager
  [[AMapNaviDriveManager sharedInstance] setDelegate:self];
  
  //初始化AMapNaviDriveView
  if (self.driveView == nil)
  {
    self.driveView = [[AMapNaviDriveView alloc] initWithFrame:self.view.bounds];
    [self.driveView setDelegate:self];
  }
  
  //将AMapNaviManager与AMapNaviDriveView关联起来
  [[AMapNaviDriveManager sharedInstance] addDataRepresentative:self.driveView];
  //将AManNaviDriveView显示出来
  [self.view addSubview:self.driveView];
  
  [[AMapNaviDriveManager sharedInstance] calculateDriveRouteWithStartPoints:@[self.startPoint]
                                                                  endPoints:@[self.endPoint]
                                                                  wayPoints:nil
                                                            drivingStrategy:AMapNaviDrivingStrategySingleDefault];
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  
  //路径规划
  [[AMapNaviDriveManager sharedInstance] calculateDriveRouteWithStartPoints:@[self.startPoint]
                                                                  endPoints:@[self.endPoint]
                                                                  wayPoints:nil
                                                            drivingStrategy:AMapNaviDrivingStrategySingleDefault];
}

//路径规划成功后，开始模拟导航
//- (void)driveManagerOnCalculateRouteSuccess:(AMapNaviDriveManager *)driveManager
//{
//  [[AMapNaviDriveManager sharedInstance] startEmulatorNavi];
//}

/**
 * @brief 驾车路径规划成功后的回调函数 since 6.1.0
 * @param driveManager 驾车导航管理类
 * @param type 路径规划类型,参考 AMapNaviRoutePlanType
 */
- (void)driveManager:(AMapNaviDriveManager *)driveManager onCalculateRouteSuccessWithType:(AMapNaviRoutePlanType)type
{
  NSLog(@"驾车路径规划成功");
}

/**
 * @brief 驾车路径规划失败后的回调函数. 从5.3.0版本起,算路失败后导航SDK只对外通知算路失败,SDK内部不再执行停止导航的相关逻辑.因此,当算路失败后,不会收到 driveManager:updateNaviMode: 回调; AMapDriveManager.naviMode 不会切换到 AMapNaviModeNone 状态, 而是会保持在 AMapNaviModeGPS or AMapNaviModeEmulator 状态.
 * @param driveManager 驾车导航管理类
 * @param error 错误信息,error.code参照 AMapNaviCalcRouteState
 */
- (void)driveManager:(AMapNaviDriveManager *)driveManager onCalculateRouteFailure:(NSError *)error
{
  NSLog(@"驾车路径规划失败");
}

/**
 * @brief 驾车路径规划失败后的回调函数. since 6.1.0
 * @param driveManager 驾车导航管理类
 * @param error 错误信息,error.code参照 AMapNaviCalcRouteState
 * @param type 路径规划类型,参考 AMapNaviRoutePlanType
 */
- (void)driveManager:(AMapNaviDriveManager *)driveManager onCalculateRouteFailure:(NSError *)error routePlanType:(AMapNaviRoutePlanType)type
{
  NSLog(@"驾车路径规划失败");
}


@end
