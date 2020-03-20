/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import <BaiduMapAPI_Base/BMKBaseComponent.h>
#import <AMapNaviKit/AMapNaviKit.h>
//#import "RCTBaiduMapView.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) BMKMapManager *mapManager;
@property (nonatomic, strong) CLLocationManager *manager;
// @property (nonatomic, assign) CLLocationCoordinate2D userLocation;

//@property (strong, nonatomic) UIViewController *viewController;
@property (nonatomic, strong) UINavigationController *nav;

@property (nonatomic, strong) AMapNaviPoint* startNaviPoint;
//
@property (nonatomic, strong) AMapNaviPoint* endNaviPoint;

@end
