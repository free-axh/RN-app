//
//  RNAMapNavi.h
//  rnProject
//
//  Created by zwkj on 2019/2/18.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <AMapNaviKit/AMapNaviKit.h>

@interface RNAMapNavi : UIViewController<AMapNaviDriveViewDelegate, MAMapViewDelegate, AMapNaviDriveManagerDelegate>

@property (nonatomic, strong) AMapNaviPoint *startPoint;
@property (nonatomic, strong) AMapNaviPoint *endPoint;
@property (nonatomic, strong) MAMapView *mapView;
@property (nonatomic, strong) AMapNaviDriveView *driveView;
@property (nonatomic) BOOL state;

@end
