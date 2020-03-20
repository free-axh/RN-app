//
//  WakeBMKAnnotation.h
//  rnProject
//
//  Created by 敖祥华 on 2018/10/11.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <BaiduMapAPI_Map/BMKPointAnnotation.h>

@interface WakeBMKAnnotation : BMKPointAnnotation

@property (nonatomic, copy) NSString *icon;
@property (nonatomic, copy) NSString *markerId;
@property (nonatomic, copy) NSString *markerName;
@property (nonatomic, assign) int status;
@property (nonatomic, assign) BOOL tracking;

@end
