//
//  RCTBaiduMapView.m
//  rnProject
//
//  Created by 敖祥华 on 2018/8/14.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RCTBaiduMapView.h"
#import "RCTPolylineView.h"
#import "AppDelegate.h"


// 轨迹平滑移动
#import "MovingAnnotationView.h"
#import "TracingPoint.h"
#import "JSONKit.h"
#import "CustomBMKAnnotation.h"
#import "SportBMKAnnotation.h"
#import <objc/runtime.h>
#import "BMKMapViewAdapter.h"
#import "MyLocation.h"
#import "GPSNaviViewController.h"
#import "BMKLocalSyncTileLayer.h"
#import "BDStopAnnotation.h"
#import "BDStopAnnotationSearcher.h"


// 颜色16进制转rgb宏
#define UIColorFromHex(s) [UIColor colorWithRed:(((s & 0xFF0000) >> 16 )) / 255.0 green:((( s & 0xFF00 ) >> 8 )) / 255.0 blue:(( s & 0xFF )) / 255.0 alpha:1.0]
#define pi 3.14159265358979323846
#define radiansToDegrees(x) (180.0 * x / pi)
#define latSpan 0.001784
#define lngSpan 0.008542

/*
 *点聚合Annotation
 */
@interface ClusterAnnotation : BMKPointAnnotation

///所包含annotation个数
@property (nonatomic, assign) NSInteger size;
@property (nonatomic, assign) NSMutableArray *clusterPointsInfo;

@end

@implementation ClusterAnnotation

@synthesize size = _size;
@synthesize clusterPointsInfo = _clusterPointsInfo;

@end

/**
 * 长按
 */
@interface RCTLongPress:UILongPressGestureRecognizer

@property (nonatomic, assign) NSMutableArray *data;

@end

@implementation RCTLongPress

@synthesize data = _data;

@end

@interface RouteAnnotation : BMKPointAnnotation
{
  int _type; //0:起点 1：终点 2：公交 3：地铁 4：驾乘 5：途经点
  int _degree;
}

@property (nonatomic) int type;
@property (nonatomic) int degree;
@end

@implementation RouteAnnotation

@synthesize type = _type;
@synthesize degree = _degree;

@end

@interface RCTBaiduMapView()

@property (nonatomic, assign) int bMapType;
@property (nonatomic, strong) NSArray* markers;
@property (nonatomic, strong) NSArray* videoMarker;
@property (nonatomic, strong) NSArray* overlayPoints;
// 驾车路线规划
@property (nonatomic, strong) NSArray* routePlan;
// 保存路线规划终点信息
@property (nonatomic, strong) NSArray *planData;
@property (nonatomic, strong) BMKRouteSearch* routeSearch;
@property (nonatomic, strong) BMKMapView* mapView;
// @property (nonatomic, strong) NSMutableDictionary* annotations;
// 设置需要在地图中心点显示标注点id
@property (nonatomic, strong) NSString* centerPoint;
/**
 * 保存中心点的监控对象id
 */
@property (nonatomic, strong) NSString* centerMonitorId;
// 实时监控标注物
@property (nonatomic, strong) NSMutableDictionary* realTimeAnnotations;
// 保存所有监控对象位置信息
@property (nonatomic, strong) NSMutableDictionary* markesInfo;
// 保存区域内监控对象位置信息
@property (nonatomic, strong) NSMutableDictionary* inAreaMarkers;
// 保存区域外监控对象位置信息
@property (nonatomic, strong) NSMutableDictionary* outAreaMarkers;
// 保存标注点图片
@property (nonatomic, strong) NSMutableDictionary* optionsIcon;

// 保存paopaoview对象
@property (nonatomic, strong) NSMutableDictionary* paopaoViewInfo;
// 保存地图可视区域范围
@property (nonatomic, strong) NSMutableArray* mapAreaScope;
@property (nonatomic, assign) BOOL locationManager;

@property (nonatomic, strong) BMKLocationManager* locService;
@property (nonatomic, strong) CLHeading* userHeading;

@property (nonatomic, strong) BMKClusterManager* clusterManager;//点聚合管理类

// 设置聚焦跟踪标注物
@property (nonatomic, copy) NSString* pointTracking;
// 保存聚焦跟踪标注物id
// @property (nonatomic, copy) NSString* trackingMonitorId;

// 轨迹回放
@property (nonatomic, assign) NSArray* sportPath;
// 轨迹回放播放控制
@property (nonatomic, assign) BOOL sportPathPlay;
// 轨迹回放标注物是否已经播放过
@property (nonatomic, assign) BOOL sportPlayed;
// 轨迹播放速度
@property (nonatomic, assign) double playBackSpeed;
// 设置轨迹回放播放速度
@property (nonatomic, assign) double sportSpeed;
// 设置轨迹回放当前位置点
@property (nonatomic, assign) NSArray* sportIndex;

// 保存轨迹回放的点信息
@property (nonatomic, strong) NSMutableDictionary* tracking;

// 点击地图事件
@property (nonatomic, copy) RCTBubblingEventBlock onMapClick;
// 返回位置信息事件
@property (nonatomic, copy) RCTBubblingEventBlock onAddress;
// 返回区域内标注物信息
@property (nonatomic, copy) RCTBubblingEventBlock onInAreaOptions;

// 删除指定id的标注物
@property (nonatomic, copy) NSString *removeAnnotation;

// 保存当前位置信息
@property (nonatomic, assign) CLLocationCoordinate2D currentLocation;

// 获取当前位置信息成功后回调函数
@property (nonatomic, copy) RCTBubblingEventBlock onLocationSuccess;

// 设置实时尾迹
@property (nonatomic, assign) BOOL realTimeWake;
// 是否为实时尾迹类型
@property (nonatomic, assign) BOOL wakeTyPe;
// 路径规划成功后距离返回事件
@property (nonatomic, copy) RCTBubblingEventBlock onPlanDistance;
// 地图初始化完成事件
@property (nonatomic, copy) RCTBubblingEventBlock onMapInitFinish;
//实时追踪当前定位
@property (nonatomic, assign) BOOL trackCurrentLocation;
// 实时追踪目标定位
@property (nonatomic, assign) BOOL trackTargetLocation;
//实时追踪当前定位
@property (nonatomic, assign) BOOL wakeCurrentLocation;
// 实时追踪目标定位
@property (nonatomic, assign) BOOL wakeTargetLocation;
// 实时尾迹
@property (nonatomic, assign) NSArray* wakeData;
// 保存当前实时尾迹监控对象的id
@property (nonatomic, copy) NSString *wakeMonitorId;
// 保存实时尾迹数据集合
@property (nonatomic, strong) NSMutableArray* wakeCoordinate;
@property (nonatomic, strong) NSMutableArray* wakeAllCoordinate;
// 位置信息查询
@property (nonatomic, assign) NSArray* searchAddress;
// 放大地图
@property (nonatomic, assign) NSArray* mapAmplification;
// 缩小地图
@property (nonatomic, assign) NSArray* mapNarrow;
// 点击地图标注物事件
@property (nonatomic, copy) RCTBubblingEventBlock onPointClickEvent;
// 定位监控对象，进行居中显示
@property (nonatomic, assign) NSArray* monitorFocus;
// 记录地图层级
@property (nonatomic, assign) BOOL clusterState; // zoomNumber;
// 聚合数量
@property (nonatomic, assign) int aggrNum;
@property (nonatomic, assign) int clusterNumer;
/**
 * 标明是否是主页
 */
@property (nonatomic, assign) BOOL isHome;
@property (nonatomic, assign) BOOL isHomeState;

// 点名下发功能
@property (nonatomic, assign) NSDictionary* latestLocation;
/**
 * 拒绝获取定位事件
 */
@property (nonatomic, copy) RCTBubblingEventBlock onLocationStatusDenied;
/**
 * 指南针是否开启
 */
@property (nonatomic, assign) BOOL compassOpenState;
@property (nonatomic, assign) BOOL compassState;
/**
 * 是否已经定位到用户当前位置
 */
@property (nonatomic, assign) BOOL userLocationState;
/**
 * 地图轨迹适配
 */
@property (nonatomic, assign) NSString* fitPolyLineSpan;
@property (nonatomic, assign) int fSpan;
/**
 * 地图实时追踪轨迹适配
 */
@property (nonatomic, assign) int trackPolyLineSpan;

/**
 * 声明处于哪个页面
 */
@property (nonatomic, copy) NSString* pageDet;

// 取消监控对象聚焦跟踪通知事件
@property (nonatomic, copy) RCTBubblingEventBlock onMonitorLoseFocus;

// 聚焦跟踪id
@property (nonatomic, copy) NSString *monitorFocusId;

// GCD定时器
@property (nonatomic, strong) dispatch_source_t timer;

//@property (nonatomic, copy) RCTBubblingEventBlock onGoLatestPoinEvent;

// 更新最新位置点
@property (nonatomic, strong) NSMutableArray* latestPoins;

// 聚合点长按事件
@property (nonatomic, copy) RCTBubblingEventBlock onClustersClickEvent;

// 历史数据停止点annotation
@property (nonatomic, strong) NSMutableDictionary* stopAnnotations;

// 历史数据停止点annotation view
@property (nonatomic, strong) NSMutableDictionary* stopAnnotationViews;

// 返回停止点位置信息事件
@property (nonatomic, copy) RCTBubblingEventBlock onStopPointDataEvent;

/**
 * 历史数据停止点当前高亮点位置
 */
@property (nonatomic, assign) int stopActiveIndex;

// 返回停止点index事件
@property (nonatomic, copy) RCTBubblingEventBlock onStopPointIndexEvent;

@end

// 轨迹平滑移动
@interface RCTBaiduMapView()<MovingAnnotationViewAnimateDelegate>
{
  SportBMKAnnotation *sportAnnotation;
  MovingAnnotationView *playBackSportAnnotationView;
  NSMutableArray *playBackTracking;
  NSMutableArray *playBackSportNodes;//轨迹点
  NSInteger playBackSportNodeNum;//轨迹点数
  NSInteger currentIndex;//当前结点
  BOOL sportState;// 当前轨迹运动状态
  BOOL changeState; // 当前轨迹点是否被改变
  UIImage* potionImage;
}

@end

@implementation RCTBaiduMapView

-(instancetype)init
{
  self = [super init];
  if(self)
  {
    self.delegate = self;
  }
  return self;
}

-(void)willMoveToSuperview:(UIView *)newSuperview
{
  [super willMoveToSuperview:newSuperview];
  if(newSuperview)
  {
    [self viewWillAppear];
    self.delegate = self;
  }
  else
  {
    [self viewWillDisappear];
    self.delegate = nil;
  }
}

/**
 * 设置中心点
 */
-(void)centerLatLng:(NSDictionary *)LatLngObj
{
  if (![_pageDet  isEqual: @"monitorVideo"] ) {
    CGRect fRect = [self convertRect:self.frame toView:self];
    CGFloat width = fRect.size.width * 0.5;
    CGFloat height = fRect.size.height * 1 / 3;
    [self setMapCenterToScreenPt:CGPointMake(width, height)];
  }
  double lat = [RCTConvert double:LatLngObj[@"latitude"]];
  double lng = [RCTConvert double:LatLngObj[@"longitude"]];
  CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
//  self.centerCoordinate = point;
  [self setZoomLevel:19];
//  self.zoomLevel = 19;
  [self setCenterCoordinate:point animated:YES];
}

/**
 * 设置地图类型
 */
-(void)setBMapType:(int)num
{
  if (num == 1) { // 标准地图
   [self setMapType:BMKMapTypeStandard];
  } else if (num == 2) { // 卫星地图
    [self setMapType:BMKMapTypeSatellite];
  }
}

/**
 *批量创建图标
 */
-(void)setMarkers:(NSArray *)markers
{
  double markersCount = [markers count];
  if (markersCount > 0) {
    if (_realTimeAnnotations == nil) {
      // 创建第一个标注物
      // 将第一条监控对象数据居中显示
      NSDictionary* option = [markers objectAtIndex:0];
      NSString* markerId = [RCTConvert NSString:option[@"markerId"]];
      
      if (_realTimeAnnotations == nil) {
        _realTimeAnnotations = [NSMutableDictionary dictionary];
      }
      
      if (self.zoomLevel >= 14 || _realTimeAnnotations == nil) {
        double latFirst = [RCTConvert double:option[@"latitude"]];
        double lngFirst = [RCTConvert double:option[@"longitude"]];
        if (!(latFirst == 1000 || lngFirst == 1000)) {
//          [self centerLatLng:option];
          if (![_pageDet  isEqual: @"monitorVideo"] ) {
            CGRect fRect = [self convertRect:self.frame toView:self];
            CGFloat width = fRect.size.width * 0.5;
            CGFloat height = fRect.size.height * 1 / 3;
            [self setMapCenterToScreenPt:CGPointMake(width, height)];
          }
          CustomBMKAnnotation* annotation = [[CustomBMKAnnotation alloc] init];
          [self addMarker:annotation option:option];
          CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(latFirst, lngFirst);
          [self setCenterCoordinate:coor animated:YES];
          [_realTimeAnnotations setObject:annotation forKey:markerId];
          dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            CLLocationCoordinate2D coordinate = self.centerCoordinate;
            double coorlat = coordinate.latitude + 0.000001;
            double coorlng = coordinate.longitude + 0.000001;
            CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(coorlat, coorlng);
            [self setCenterCoordinate:coor animated:YES];
          });
          
        } else {
          /**
           * 移动地图区域以触发事件创建可视区域范围内的监控对象
           */
          dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            CLLocationCoordinate2D coordinate = self.centerCoordinate;
            double coorlat = coordinate.latitude + 0.000001;
            double coorlng = coordinate.longitude + 0.000001;
            CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(coorlat, coorlng);
            [self setCenterCoordinate:coor animated:YES];
          });
        }
      } else {
        /**
         * 移动地图区域以触发事件创建可视区域范围内的监控对象
         */
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
          CLLocationCoordinate2D coordinate = self.centerCoordinate;
          double coorlat = coordinate.latitude + 0.000001;
          double coorlng = coordinate.longitude + 0.000001;
          CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(coorlat, coorlng);
          [self setCenterCoordinate:coor animated:YES];
        });
      }
      // 保存所有的监控对象信息
      if (_markesInfo == nil) {
        _markesInfo = [NSMutableDictionary dictionary];
      }
      for (int i = 0; i < markersCount; i++) {
        NSDictionary* thisMarkerOption = [markers objectAtIndex:i];
        double lat = [RCTConvert double:thisMarkerOption[@"latitude"]];
        double lng = [RCTConvert double:thisMarkerOption[@"longitude"]];
        if (!(lat == 1000 || lng == 1000)) {
          NSString* thisMarkerId = [RCTConvert NSString:thisMarkerOption[@"markerId"]];
          [_markesInfo setObject:thisMarkerOption forKey:thisMarkerId];
        } else {
          
        }
      }
    } else {
//      if (_mapAreaScope != nil) {
        CGRect fRect = [self convertRect:self.frame toView:self];
        
//        double leftUpLat = [[_mapAreaScope objectAtIndex:0] doubleValue];
//        double leftUpLng = [[_mapAreaScope objectAtIndex:1] doubleValue];
//        double rightDownLat = [[_mapAreaScope objectAtIndex:2] doubleValue];
//        double rightDownLng = [[_mapAreaScope objectAtIndex:3] doubleValue];
        
        
        // NSArray *allKeyArr = [_markesInfo allKeys];
        NSArray *inAreaKeyArr = [_inAreaMarkers allKeys];
        // NSArray *outAreaKeyArr = [_outAreaMarkers allKeys];
        for (int i = 0; i < markersCount; i++) {
          NSDictionary *option = [markers objectAtIndex:i];
          NSString *markerId = [RCTConvert NSString:option[@"markerId"]];
          // int s = self.zoomLevel;
          NSArray *clusterArr = self.annotations;
          
          int m = 0;
          for (int j = 0; j < clusterArr.count; j++) {
            if ([clusterArr[j] isKindOfClass:[ClusterAnnotation class]]) {
              ClusterAnnotation *cluann = clusterArr[j];
              m = m + (int)cluann.size;
            }
          }
          
          if (self.zoomLevel >= 14 && m < _clusterNumer) {
            double lat = [RCTConvert double:option[@"latitude"]];
            double lng = [RCTConvert double:option[@"longitude"]];
            
            CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(lat, lng);
            CGPoint cRect = [self convertCoordinate:coordinate toPointToView:self.mapView];
            
            int status = [RCTConvert int:option[@"status"]];
            // 判断对应点是否已经存在
            if ([inAreaKeyArr containsObject:markerId]) {
              // 更新监控对象状态
              MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:markerId];
              UIView* button = [[sportAnnotationView viewWithTag:111] viewWithTag:110];
              button.layer.backgroundColor = [self getStatus:(int)status].CGColor;
              
              if (self.latestPoins && [self.latestPoins containsObject:markerId]) {
                [self setMonitorLatestPoint:markerId latestPosition:option];
                [self.latestPoins removeObject:markerId];
              } else {
                NSMutableArray *values = [_inAreaMarkers objectForKey:markerId];
                if (values.count > 0) {
                  // 判断经纬度是否相同
                  NSDictionary * lastOption = [values lastObject];
                  double lastLat = [RCTConvert double:lastOption[@"latitude"]];
                  double lastLng = [RCTConvert double:lastOption[@"longitude"]];
                  if (!(lastLat == lat && lastLng == lng)) {
                    [values addObject:option];
                    // 判断保存的标注位置点是否保存为2个，如果是两个就进行移动
                    if (values.count == 2) {
                      [self initSportNodes:markerId];
                    }
                  }
                } else {
                  [values addObject:option];
                }
              }
            }
            // else if (lat > leftUpLat && lat < rightDownLat && lng > leftUpLng && lng > rightDownLng) {
            else if (CGRectContainsPoint(fRect, cRect)) {
              CustomBMKAnnotation* annotation = [[CustomBMKAnnotation alloc] init];
              [self addMarker:annotation option:option];
              [_realTimeAnnotations setObject:annotation forKey:markerId];
              NSMutableArray *values = [[NSMutableArray alloc] init];
              [values addObject:option];
              [_inAreaMarkers setObject:values forKey:markerId];
            } else {
              [_outAreaMarkers setObject:option forKey:markerId];
            }
          }
          // 保存在所有点集合中
          [_markesInfo setObject:option forKey:markerId];
        }
//      }
    }
  }
}

/**
 * 创建独立的标注物
 */
-(void)setVideoMarker:(NSArray *)videoMarker
{
  double markersCount = [videoMarker count];
  if (markersCount > 0) {
    if (_realTimeAnnotations == nil) {
      // 创建第一个标注物
      // 将第一条监控对象数据居中显示
      NSDictionary* option = [videoMarker firstObject];
      NSString* markerId = [RCTConvert NSString:option[@"markerId"]];
      // [self centerLatLng:option];
      
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
//      self.centerCoordinate = point;
      [self setCenterCoordinate:point animated:YES];
      self.zoomLevel = 17;
      
      CustomBMKAnnotation* annotation = [[CustomBMKAnnotation alloc] init];
      [self addMarker:annotation option:option];
      
      annotation.tracking = YES;
      //if (_realTimeAnnotations == nil) {
      _realTimeAnnotations = [NSMutableDictionary dictionary];
      //}
      [_realTimeAnnotations setObject:annotation forKey:markerId];
      if (_inAreaMarkers == nil) {
        _inAreaMarkers = [NSMutableDictionary dictionary];
        NSMutableArray *values = [[NSMutableArray alloc] init];
        [values addObject:option];
        [_inAreaMarkers setObject:values forKey:markerId];
      }
    } else {
      NSArray *inAreaKeyArr = [_inAreaMarkers allKeys];
      NSDictionary *option = [videoMarker firstObject];
      NSString *markerId = [RCTConvert NSString:option[@"markerId"]];
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];

      int status = [RCTConvert int:option[@"status"]];
      // 判断对应点是否已经存在
      if ([inAreaKeyArr containsObject:markerId]) {
        // 更新监控对象状态
        MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:markerId];
        UIView* button = [[sportAnnotationView viewWithTag:111] viewWithTag:110];
        button.layer.backgroundColor = [self getStatus:(int)status].CGColor;
        
        NSMutableArray *values = [_inAreaMarkers objectForKey:markerId];
        if (values.count > 0) {
          // 判断经纬度是否相同
          NSDictionary * lastOption = [values lastObject];
          double lastLat = [RCTConvert double:lastOption[@"latitude"]];
          double lastLng = [RCTConvert double:lastOption[@"longitude"]];
          if (!(lastLat == lat && lastLng == lng)) {
            [values addObject:option];
            // 判断保存的标注位置点是否保存为2个，如果是两个就进行移动
            if (values.count == 2) {
              [self initSportNodes:markerId];
            }
          }
        } else {
          [values addObject:option];
        }
      } else {
        CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:markerId];
        [self removeAnnotation:annotation];
        [_realTimeAnnotations removeObjectForKey:markerId];
        
        [self centerLatLng:option];
        CustomBMKAnnotation* newAnn = [[CustomBMKAnnotation alloc] init];
        [self addMarker:newAnn option:option];
        
        newAnn.tracking = YES;
        
        [_realTimeAnnotations setObject:newAnn forKey:markerId];
        
        NSMutableArray *values = [[NSMutableArray alloc] init];
        [values addObject:option];
        [_inAreaMarkers removeObjectForKey:markerId];
        [_inAreaMarkers setObject:values forKey:markerId];
      }
    }
  }
}

/**
 *地图区域改变完成后会调用此接口
 *@param mapview 地图View
 *@param animated 是否动画
 */
- (void)mapView:(BMKMapView *)mapView regionDidChangeAnimated:(BOOL)animated
{
  // [self.superview removeFromSuperview];
//  [self.superview addSubview:self.mapView];
  // 获取地图可视区域范围内经纬度
  
  CGRect fRect = [self convertRect:self.frame toView:self];

  if (_isHomeState) {
    if (_realTimeAnnotations != nil) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        BMKCoordinateRegion rect = [mapView convertRect:mapView.bounds toRegionFromView:mapView];
        // double latDelta = 0;
        // double lngDelta = 0;
        double latitudeDelta = fabs(rect.span.latitudeDelta);
        double longitudeDelta = fabs(rect.span.longitudeDelta);
        
        // if (latDelta <= latitudeDelta && lngDelta <= longitudeDelta) {
        float zoomLevel = mapView.zoomLevel;
        double rectLat = 0;
        double rectLng = 0;
        if (zoomLevel > 17) {
          rectLat = latitudeDelta*3;
          rectLng = longitudeDelta*3;
        } else if (zoomLevel <= 17 && zoomLevel >= 15) {
          rectLat = latitudeDelta*2;
          rectLng = longitudeDelta*2;
        } else {
          rectLat = latitudeDelta;
          rectLng = longitudeDelta;
        }
//        double leftUpLat = rect.center.latitude - rectLat;
//        double leftUpLng = rect.center.longitude - rectLng;
//        double rightDownLat = rect.center.latitude + rectLat;
//        double rightDownLng = rect.center.longitude + rectLng;
        
        // 地图可视区域范围
//        if (_mapAreaScope == nil) {
//          _mapAreaScope = [[NSMutableArray alloc] init];
//        }
        // NSString* leftUpLatStr = [NSString stringWithFormat:@"%f", leftUpLat];
//        NSNumber *leftUpLatStr = [NSNumber numberWithDouble:leftUpLat];
//        NSNumber *leftUpLngStr = [NSNumber numberWithDouble:leftUpLng];
//        NSNumber *rightDownLatStr = [NSNumber numberWithDouble:rightDownLat];
//        NSNumber *rightDownLngStr = [NSNumber numberWithDouble:rightDownLng];
//        [_mapAreaScope removeAllObjects];
//        [_mapAreaScope addObjectsFromArray:@[leftUpLatStr, leftUpLngStr, rightDownLatStr, rightDownLngStr]];
        
        // if (_realTimeAnnotations != nil) {
        // 区域内标注物信息清空
        if (_inAreaMarkers == nil) {
          _inAreaMarkers = [NSMutableDictionary dictionary];
        }
        
        if (_outAreaMarkers == nil) {
          _outAreaMarkers = [NSMutableDictionary dictionary];
        }
        
        // 区域外标注物信息清空
        
        NSArray* infos = [_markesInfo allValues];
        NSArray* inAreaKeyArr = [_inAreaMarkers allKeys];
        NSArray* outAreaKeyArr = [_outAreaMarkers allKeys];
        for (int i = 0; i < infos.count; i++) {
          NSDictionary* info = [infos objectAtIndex:i];
          double lat = [RCTConvert double:info[@"latitude"]];
          double lng = [RCTConvert double:info[@"longitude"]];
          NSString* markerId = [RCTConvert NSString:info[@"markerId"]];
          
          CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(lat, lng);
          CGPoint cRect = [self convertCoordinate:coordinate toPointToView:self.mapView];
          
          // if (lat > leftUpLat && lat < rightDownLat && lng > leftUpLng && lng < rightDownLng) {
          if (CGRectContainsPoint(fRect, cRect)) {
            // 区域内
            if (![inAreaKeyArr containsObject:markerId]) {
              // 区域改变后区域内不包含新的监控对象
              NSMutableArray *values = [[NSMutableArray alloc] init];
              [values addObject:info];
              [_inAreaMarkers setObject:values forKey:markerId];
//              // 判断区域内的点是否在区域外的集合中
//              if ([outAreaKeyArr containsObject:markerId]) {
//                [_outAreaMarkers removeObjectForKey:markerId];
//              }
            }
            // 判断区域内的点是否在区域外的集合中
            if ([outAreaKeyArr containsObject:markerId]) {
              [_outAreaMarkers removeObjectForKey:markerId];
            }
          } else {
            // 删除区域内集合中的点
            BOOL isArea = YES;
            if ([inAreaKeyArr containsObject:markerId]) {
              CustomBMKAnnotation *annotation = [_realTimeAnnotations objectForKey:markerId];
              CGPoint aRect = [self convertCoordinate:annotation.coordinate toPointToView:self.mapView];
              if (!CGRectContainsPoint(fRect, aRect)) {
                isArea = NO;
                [_inAreaMarkers removeObjectForKey:markerId];
              }
            }
            if (!isArea) {
              //增加区域外集合中没有的点
              if (![outAreaKeyArr containsObject:markerId]) {
                [_outAreaMarkers setObject:info forKey:markerId];
              }
            }
          }
        }
        // 创建标注
        // [self createOption:_inAreaMarkers];
        // }
        // 聚合与非聚合
        if (self.zoomLevel >= 14 && _inAreaMarkers.count < _clusterNumer) {
          if (_clusterState) {
            [self removeAnnotations:self.annotations];
            [_realTimeAnnotations removeAllObjects];
            _clusterState = NO;
          }
          [self createOption];
        } else {
          [self cancelMonitorFocus:_centerPoint];
          _clusterState = YES;
          [self createCluster];
        }
        // _zoomNumber = self.zoomLevel;
        // }
      });
    }
  }
}

/**
 * 创建区域范围内的标注物
 */
-(void)createOption
{
  // 首先删除不在区域内的标注物
  // 获取已创建标注id
  NSArray* markersIdArr = [_realTimeAnnotations allKeys];
  NSArray* inAreaKeyArr = [_inAreaMarkers allKeys];
  NSArray* outAreaKeyArr = [_outAreaMarkers allKeys];
  
  // 首先删除在区域外的已创建标注物
  for (int i = 0; i < markersIdArr.count; i++) {
    if ([outAreaKeyArr containsObject:markersIdArr[i]]) {
      CustomBMKAnnotation *annotation = [_realTimeAnnotations objectForKey:markersIdArr[i]];
      
      if ([_centerPoint isEqualToString:markersIdArr[i]]) {
        // [self cancelMonitorFocus:_centerPoint];
      } else {
        // 先移除标注物动画
        [playBackSportAnnotationView removeLayer:annotation.coordinate];
        // [self removeAnnotation:annotation];
        [self removeAnnotation:annotation];
        [_paopaoViewInfo removeObjectForKey:markersIdArr[i]];
        [_realTimeAnnotations removeObjectForKey:markersIdArr[i]];
      }
    }
  }
  
  // 然后创建区域内未创建的标注物
  for (int j = 0; j < inAreaKeyArr.count; j ++) {
    if (![markersIdArr containsObject:inAreaKeyArr[j]]) {
      NSMutableArray* msg = [_inAreaMarkers objectForKey:inAreaKeyArr[j]];
      NSDictionary* option = [msg objectAtIndex:0];
      CustomBMKAnnotation *annotation = [[CustomBMKAnnotation alloc] init];
      [self addMarker:annotation option:option];
      if (_monitorFocusId) {
        if ([_monitorFocusId isEqualToString:inAreaKeyArr[j]]) {
          // annotation.tracking = YES;
          [self createGCD:annotation];
          _monitorFocusId = nil;
        }
      }
      [_realTimeAnnotations setObject:annotation forKey:inAreaKeyArr[j]];
    }
  }
  
  if (self.onInAreaOptions) {
    // self.onInAreaOptions(_inAreaMarkers);
    NSArray *arr = [_inAreaMarkers allKeys];
    self.onInAreaOptions(@{@"data":arr});
  }
}


/**
 *添加标注物
 */
-(void)addMarker:(CustomBMKAnnotation *)annotation option:(NSDictionary *)option
{
  [self updateMarker:annotation option:option];
  [self addAnnotation:annotation];
}

/**
 * 更新标注物位置信息
 */
-(void)updateMarker:(CustomBMKAnnotation *)annotation option:(NSDictionary *)option
{
  CLLocationCoordinate2D coor = [self getCoorFromMarkerOption:option];
  NSString *title = [RCTConvert NSString:option[@"title"]];
  NSString *markerIconUrl =[RCTConvert NSString:option[@"ico"]];
  NSString *markerId =[RCTConvert NSString:option[@"markerId"]];
  int status = [RCTConvert int:option[@"status"]];
  int angle = [RCTConvert int:option[@"angle"]];
  annotation.coordinate = coor;
  annotation.title = title;
  annotation.icon = markerIconUrl;
  annotation.markerId = markerId;
  annotation.status = status;
  annotation.tracking = false;
  annotation.angle = angle;
}

/**
 * 筛选数据，组装经纬度
 */
-(CLLocationCoordinate2D)getCoorFromMarkerOption:(NSDictionary *)option
{
  double lat = [RCTConvert double:option[@"latitude"]];
  double lng = [RCTConvert double:option[@"longitude"]];
  CLLocationCoordinate2D coor;
  coor.latitude = lat;
  coor.longitude = lng;
  return coor;
}

/**
 * 绘制线
 */
-(void)setOverlayPoints:(NSArray *)points
{
  CLLocationCoordinate2D* coor = malloc(sizeof(CLLocationCoordinate2D) * points.count);
  
  for (int i = 0; i < points.count; i++) {
    NSDictionary *option = [points objectAtIndex:i];
    double lat = [RCTConvert double:option[@"latitude"]];
    double lng = [RCTConvert double:option[@"longitude"]];
    coor[i].latitude = lat;
    coor[i].longitude = lng;
  }
  BMKPolyline* polyline = [BMKPolyline polylineWithCoordinates:coor count:points.count];
  [self addOverlay:polyline];
  
  free(coor);
  
}

/**
 * 添加线的属性
 */
- (BMKOverlayView *)mapView:(BMKMapView *)mapView viewForOverlay:(id <BMKOverlay>)overlay{
  if ([overlay isKindOfClass:[BMKPolyline class]]){
    BMKPolylineView* polylineView = [[BMKPolylineView alloc] initWithOverlay:overlay];
    polylineView.strokeColor = [UIColor blueColor];
    polylineView.lineWidth = 1.0;
    return polylineView;
  }
  if ([overlay isKindOfClass:[BMKTileLayer class]]) {
//    CLLocationCoordinate2D pt = (CLLocationCoordinate2D){overlay.coordinate.latitude, overlay.coordinate.longitude};
//    [overlay setCoordinate:pt];
    BMKTileLayerView *view = [[BMKTileLayerView alloc] initWithTileLayer:overlay];
    return view;
  }
//  if ([overlay isKindOfClass:[BMKTileLayer class]]) {
//    BMKTileLayerView *view = [[BMKTileLayerView alloc] initWithTileLayer:overlay];
//    return view;
//  }
  return nil;
}

/**
 * 逆地理编码
 */
-(void)getAddress:(NSDictionary *)option
{
  double lat = [RCTConvert double:option[@"latitude"]];
  double lng = [RCTConvert double:option[@"longitude"]];
  NSString *type = [RCTConvert NSString:option[@"type"]];
  if ([type isEqualToString:@"stopPoint"]) {
    NSString *index = [[option objectForKey:@"index"] stringValue]; // [RCTConvert NSString:option[@"index"]];
    BDStopAnnotationSearcher* searcher =[[BDStopAnnotationSearcher alloc] init];
    searcher.tag = [index intValue];
    searcher.delegate = self;
    CLLocationCoordinate2D pt = (CLLocationCoordinate2D){lat, lng};
    BMKReverseGeoCodeSearchOption *reverseGeoCodeSearchOption = [[BMKReverseGeoCodeSearchOption alloc] init];
    reverseGeoCodeSearchOption.location = pt;
    BOOL flag = [searcher reverseGeoCode:reverseGeoCodeSearchOption];
    if(flag)
    {
      NSLog(@"反geo检索发送成功");
    }
    else
    {
      NSLog(@"反geo检索发送失败");
    }
  } else {
    BMKGeoCodeSearch* searcher =[[BMKGeoCodeSearch alloc] init];
    searcher.delegate = self;
    CLLocationCoordinate2D pt = (CLLocationCoordinate2D){lat, lng};
    BMKReverseGeoCodeSearchOption *reverseGeoCodeSearchOption = [[BMKReverseGeoCodeSearchOption alloc] init];
    reverseGeoCodeSearchOption.location = pt;
    BOOL flag = [searcher reverseGeoCode:reverseGeoCodeSearchOption];
    if(flag)
    {
      NSLog(@"反geo检索发送成功");
    }
    else
    {
      NSLog(@"反geo检索发送失败");
    }
  }
}

//实现Deleage处理回调结果
//接收反向地理编码结果
- (void)onGetReverseGeoCodeResult:(BMKGeoCodeSearch *)searcher result:(BMKReverseGeoCodeSearchResult *)result errorCode:(BMKSearchErrorCode)error{
  if (error == BMK_SEARCH_NO_ERROR) {
    NSString* address = [result.address stringByAppendingString:result.sematicDescription];
    if ([searcher isKindOfClass:[BDStopAnnotationSearcher class]]) {
      BDStopAnnotationSearcher *stopSearcher = (BDStopAnnotationSearcher *)searcher;
      NSDictionary *data = @{@"address":address, @"index": @(stopSearcher.tag)};
      [self stopPointAddressCallBack:data];
    } else {
      // 轨迹回放的逆地理编码
      [self addressCallBack:address];
    }
  }
  else {
    NSLog(@"抱歉，未找到结果");
    [self addressCallBack:@"抱歉，未找到结果"];
  }
}

/**
 * 路线规划
 */
-(void)setRoutePlan:(NSArray *)points
{
  if (points.count > 0) {
    CLAuthorizationStatus stateInfo = [CLLocationManager authorizationStatus];
    if (stateInfo == kCLAuthorizationStatusDenied) { // 拒绝获取定位
      if (self.onLocationStatusDenied) {
        self.onLocationStatusDenied(@{@"data": @"true"});
      }
    } else {
      AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      _planData = points;
      //初始化检索对象
      _routeSearch = [[BMKRouteSearch alloc] init];
      _routeSearch.delegate = self;
      
      BMKPlanNode* start = [[BMKPlanNode alloc]init];
      // NSDictionary *startPoint = [points objectAtIndex:0];
      // CLLocationCoordinate2D startPt = [self getCoorFromMarkerOption:startPoint];
      CLLocationCoordinate2D startPt = _currentLocation;
      // 导航起点经纬度
//      delegate.startNaviPoint = [self bdToGaodeWithLat:startPt.latitude andLon:startPt.longitude];// _currentLocation;
      start.pt = startPt;
      // start.name = @"北京";
      // start.cityName = @"天安门";
      
      BMKPlanNode* end = [[BMKPlanNode alloc]init];
      NSDictionary *endPoint = [points objectAtIndex:0];
      CLLocationCoordinate2D endPt = [self getCoorFromMarkerOption:endPoint];
      // 导航终点经纬度
      delegate.endNaviPoint = [self bdToGaodeWithLat:endPt.latitude andLon:endPt.longitude]; //endPt;
      end.pt = endPt;
      // end.name = @"天津";
      // end.cityName = @"天津站";
      
      BMKDrivingRoutePlanOption *drivingRouteSearchOption = [[BMKDrivingRoutePlanOption alloc] init];
      drivingRouteSearchOption.from = start;
      drivingRouteSearchOption.to = end;
      drivingRouteSearchOption.drivingRequestTrafficType = BMK_DRIVING_REQUEST_TRAFFICE_TYPE_NONE;//不获取路况信息
      
      BOOL flag = [_routeSearch drivingSearch:drivingRouteSearchOption];
      if(flag)
      {
        NSLog(@"car检索发送成功");
      }
      else
      {
        NSLog(@"car检索发送失败");
      }
    }
  }
}

/**
 *返回驾乘搜索结果
 *@param searcher 搜索对象
 *@param result 搜索结果，类型为BMKDrivingRouteResult
 *@param error 错误号，@see BMKSearchErrorCode
 */
- (void)onGetDrivingRouteResult:(BMKRouteSearch*)searcher result:(BMKDrivingRouteResult*)result errorCode:(BMKSearchErrorCode)error
{
  // NSLog(@"onGetDrivingRouteResult error:%d", (int)error);
  // 清空地图覆盖物
  // NSArray* array = [NSArray arrayWithArray:self.annotations];
  [self removeAnnotations:self.annotations];
//  array = [NSArray arrayWithArray:self.overlays];
  [self removeOverlays:self.overlays];
  
  if (error == BMK_SEARCH_NO_ERROR) {
    //成功获取结果
    //表示一条驾车路线
    BMKDrivingRouteLine* plan = (BMKDrivingRouteLine*)[result.routes objectAtIndex:0];
    
    // 返回给js端路线规划距离
    NSNumber *distance = [NSNumber numberWithInt:plan.distance];
    // int distance = plan.distance;
    if (self.onPlanDistance) {
      self.onPlanDistance(@{@"data": distance});
    }
    
    // 计算路线方案中的路段数目
    int size = (int)[plan.steps count];
    int planPointCounts = 0;
    for (int i = 0; i < size; i++) {
      //表示驾车路线中的一个路段
      BMKDrivingStep* transitStep = [plan.steps objectAtIndex:i];
      if(i == 0){
        SportBMKAnnotation *startPoint = [[SportBMKAnnotation alloc] init];
        startPoint.coordinate = _currentLocation; // plan.starting.location;
        startPoint.type = @"start";
        [self addAnnotation:startPoint];
      }else if(i == size-1){
        NSDictionary *planEndData = [_planData objectAtIndex:0];
        CLLocationCoordinate2D endLocation = [self getCoorFromMarkerOption:planEndData];
        
        SportBMKAnnotation *endPoint = [[SportBMKAnnotation alloc] init];
        endPoint.coordinate = endLocation;
        endPoint.type = @"end";
        [self addAnnotation:endPoint];
        
        // 创建监控对象标注物
        // SportBMKAnnotation *monitorPoint = [[SportBMKAnnotation alloc] init];
        
        CustomBMKAnnotation* monitorPoint = [[CustomBMKAnnotation alloc] init];
        
//        monitorPoint.coordinate = endLocation;
//        monitorPoint.type = @"monitor";
//        NSString *monitorIcon =[RCTConvert NSString:planEndData[@"ico"]];
//        monitorPoint.icon = monitorIcon;
//        [self addAnnotation:monitorPoint];
        
        
         [self addMarker:monitorPoint option:planEndData];
         monitorPoint.type = @"monitor";
         // monitorPoint.coordinate = endLocation;
      }
      //轨迹点总数累计
      planPointCounts += transitStep.pointsCount;
    }
    
    //轨迹点
    // BMKMapPoint * temppoints = new; BMKMapPoint[planPointCounts]; //文件后缀名改为mm
    BMKMapPoint* temppoints = malloc(sizeof(BMKMapPoint) * planPointCounts);
    
    int i = 0;
    for (int j = 0; j < size; j++) {
      BMKTransitStep *transitStep = [plan.steps objectAtIndex:j];
      int k = 0;
      for (k = 0; k < transitStep.pointsCount; k++) {
        temppoints[i].x = transitStep.points[k].x;
        temppoints[i].y = transitStep.points[k].y;
        i++;
      }
    }
    
    // 通过points构建BMKPolyline
    BMKPolyline* polyLine = [BMKPolyline polylineWithPoints:temppoints count:planPointCounts];
    [self addOverlay:polyLine]; // 添加路线overlay
    if (_trackPolyLineSpan) {
      [self mapViewFitPolyLine:polyLine bottomSpan:_trackPolyLineSpan];
    } else {
      [self mapViewFitPolyLine:polyLine bottomSpan: 250];
    }
    free(temppoints);
  } else {
    //检索失败
  }
}

/**
 * 定位
 */
-(void)setLocationManager:(BOOL)flag
{
  if (flag) {
    _userLocationState = NO;
    CLAuthorizationStatus stateInfo = [CLLocationManager authorizationStatus];
    if (stateInfo == kCLAuthorizationStatusDenied) { // 拒绝获取定位
      if (self.onLocationStatusDenied) {
        self.onLocationStatusDenied(@{@"data": @"true"});
      }
    }
//    else if (stateInfo == kCLAuthorizationStatusNotDetermined) {
//
//    }
    else {
      //自定义精度圈
      BMKLocationViewDisplayParam *param = [[BMKLocationViewDisplayParam alloc] init];
      //线
      param.accuracyCircleStrokeColor = [UIColor colorWithRed:0 green:0 blue:1 alpha:0.5];
      //圈
      //    param.accuracyCircleFillColor = [UIColor colorWithRed:0 green:0 blue:1 alpha:0.2];
      [self updateLocationViewWithParam:param];
      [self setZoomLevel:17];

      //初始化BMKLocationService
      _locService = [[BMKLocationManager alloc] init];
      _locService.delegate = self;
      
      
      //设置返回位置的坐标系类型
      _locService.coordinateType = BMKLocationCoordinateTypeBMK09LL;
      //设置距离过滤参数
      _locService.distanceFilter = kCLDistanceFilterNone;
      //设置预期精度参数
      _locService.desiredAccuracy = kCLLocationAccuracyBest;
      //设置应用位置类型
      _locService.activityType = CLActivityTypeAutomotiveNavigation;
      //设置是否自动停止位置更新
      _locService.pausesLocationUpdatesAutomatically = NO;
      //设置是否允许后台定位
      _locService.allowsBackgroundLocationUpdates = YES;
      //设置位置获取超时时间
      _locService.locationTimeout = 10;
      //设置获取地址信息超时时间
      _locService.reGeocodeTimeout = 10;
      
      
      //启动LocationService
      [_locService startUpdatingLocation];
      if ([BMKLocationManager headingAvailable]) {
        [_locService startUpdatingHeading];
      }
      self.showsUserLocation = NO;//先关闭显示的定位图层
      self.userTrackingMode = BMKUserTrackingModeHeading;//设置定位的状态
      self.showsUserLocation = YES;//显示定位图层
      // 取消聚焦跟踪
      [self cancelMonitorFocus:_centerPoint];
    }
  } else {
    if (_locService != nil) {
      [_locService stopUpdatingLocation];
    }
  }
}

/**
 *在地图View将要启动定位时，会调用此函数
 *地图View
 */
//- (void)willStartLocatingUser
//{
//  //    NSLog(@"start locate");
//}

/**
 *用户方向更新后，会调用此函数
 *@param userLocation 新的用户位置
 */
- (void)BMKLocationManager:(BMKLocationManager * _Nonnull)manager
          didUpdateHeading:(CLHeading * _Nullable)heading
{
   //NSLog(@"serial loc heading = %@", heading.description);
  _userHeading = heading;
//  CLLocation *cll = [[CLLocation alloc] initWithLatitude:_currentLocation.latitude longitude:_currentLocation.longitude];
//  MyLocation *loc = [[MyLocation alloc] initWithLocation:cll withHeading:_userHeading];
//  [self updateLocationData:loc];
}
//- (void)didUpdateUserHeading:(BMKUserLocation *)userLocation
//{
//  [self updateLocationData:userLocation];
//  //    NSLog(@"heading is %@",userLocation.heading);
//}

/**
 *用户位置更新后，会调用此函数
 *@param userLocation 新的用户位置
 */

- (void)BMKLocationManager:(BMKLocationManager * _Nonnull)manager didUpdateLocation:(BMKLocation * _Nullable)location orError:(NSError * _Nullable)error

{
  if (error)
  {
    //NSLog(@"locError:{%ld - %@};", (long)error.code, error.localizedDescription);
  } if (location) {//得到定位信息，添加annotation
    if (location.location) {
      //NSLog(@"LOC = %@",location.location);
    }
    if (location.rgcData) {
      //NSLog(@"rgc = %@",[location.rgcData description]);
    }
    MyLocation * loc = [[MyLocation alloc] initWithLocation:location.location withHeading:_userHeading];
    [self updateLocationData:loc];
    if (!_userLocationState) {
      [self setCenterCoordinate:loc.location.coordinate animated:YES];
      _userLocationState = YES;
    }
    
    // 定位成功后返回给js端
    if (self.onLocationSuccess) {
      NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
      NSNumber *lat = [[NSNumber alloc] initWithDouble:loc.location.coordinate.latitude];
      NSNumber *lng = [[NSNumber alloc] initWithDouble:loc.location.coordinate.longitude];
      [option setObject:lat forKey:@"latitude"];
      [option setObject:lng forKey:@"longitude"];
      [self getAddress:option];
      
      AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      delegate.startNaviPoint = [self bdToGaodeWithLat:loc.location.coordinate.latitude andLon:loc.location.coordinate.longitude];
      
      self.onLocationSuccess(@{@"data": @"true"});
    }
    
    _currentLocation = loc.location.coordinate;
  }
}
//- (void)didUpdateBMKUserLocation:(BMKUserLocation *)userLocation
//{
//  //    NSLog(@"didUpdateUserLocation lat %f,long %f",userLocation.location.coordinate.latitude,userLocation.location.coordinate.longitude);
//
//  //缺少会导致无法定位
//  [self updateLocationData:userLocation];
//  if (!_userLocationState) {
//    self.centerCoordinate = CLLocationCoordinate2DMake(userLocation.location.coordinate.latitude, userLocation.location.coordinate.longitude);
//    _userLocationState = YES;
//  }
//  // 定位成功后返回给js端
//  if (self.onLocationSuccess) {
//    NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
//    NSNumber *lat = [[NSNumber alloc] initWithDouble:userLocation.location.coordinate.latitude];
//    NSNumber *lng = [[NSNumber alloc] initWithDouble:userLocation.location.coordinate.longitude];
//    [option setObject:lat forKey:@"latitude"];
//    [option setObject:lng forKey:@"longitude"];
//    [self getAddress:option];
//    self.onLocationSuccess(@{@"data": @"true"});
//  }
//  _currentLocation = userLocation.location.coordinate;
//}

/**
 *在地图View停止定位后，会调用此函数
 * 地图View
 */
//- (void)didStopLocatingUser
//{
//  //    NSLog(@"stop locate");
//}

/**
 *定位失败后，会调用此函数
 *地图View
 *@param error 错误号，参考CLError.h中定义的错误号
 */
- (void)BMKLocationManager:(BMKLocationManager * _Nonnull)manager didFailWithError:(NSError * _Nullable)error
{
    //NSLog(@"location error");
    // 定位成功后返回给js端
    if (self.onLocationSuccess) {
      self.onLocationSuccess(@{@"data": @"false"});
    }
}
//- (void)didFailToLocateUserWithError:(NSError *)error
//{
//  NSLog(@"location error");
//  // 定位成功后返回给js端
//  if (self.onLocationSuccess) {
//    self.onLocationSuccess(@{@"data": @"false"});
//  }
//}

/**
 * 聚合
 */
-(void)createCluster
{
  if (_clusterManager == nil) {
    //初始化点聚合管理类
    _clusterManager = [[BMKClusterManager alloc] init];
  }
  [_clusterManager clearClusterItems];
  // 模拟创建点
  // _inAreaMarkers
  // NSArray *arr = [_inAreaMarkers allValues]; _markesInfo
  CGRect fRect = [self convertRect:self.frame toView:self];
  
  NSArray *arr = [_markesInfo allValues];
  for (int i = 0; i < arr.count; i++) {
//    NSDictionary *option = [arr[i] objectAtIndex:0];
    NSDictionary *option = arr[i];
    double lat = [RCTConvert double:option[@"latitude"]];
    double lng = [RCTConvert double:option[@"longitude"]];
    NSString *monitorId = [RCTConvert NSString:option[@"markerId"]];
    NSString *name = [RCTConvert NSString:option[@"title"]];
    int status = [RCTConvert int:option[@"status"]];
    
    CGPoint cRect = [self convertCoordinate:CLLocationCoordinate2DMake(lat, lng) toPointToView:self.mapView];
    
    if (CGRectContainsPoint(fRect, cRect)) {
      BMKClusterItem *clusterItem = [[BMKClusterItem alloc] init];
      clusterItem.coor = CLLocationCoordinate2DMake(lat, lng);
      clusterItem.monitorId = monitorId;
      clusterItem.name = name;
      clusterItem.status = status;
      [_clusterManager addClusterItem:clusterItem];
    }
  }
  
  
//  CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(39.90923, 116.397428);
//  //向点聚合管理类中添加标注
//  for (NSInteger i = 0; i < 20; i++) {
//    double lat =  (arc4random() % 100) * 0.001f;
//    double lon =  (arc4random() % 100) * 0.001f;
//    BMKClusterItem *clusterItem = [[BMKClusterItem alloc] init];
//    clusterItem.coor = CLLocationCoordinate2DMake(coor.latitude + lat, coor.longitude + lon);
//    [_clusterManager addClusterItem:clusterItem];
//  }

  [self removeAnnotations:self.annotations];
  // 获取聚合后的标注
  NSArray *array = [_clusterManager getClusters: self.zoomLevel];
//  NSMutableArray *clusters = [NSMutableArray array];
  for (BMKCluster *item in array) {
    NSMutableArray *clusters = item.clusterItems;
    NSMutableArray *clusterInfos = [[NSMutableArray alloc] init];
    for (int i = 0; i < clusters.count; i++) {
      BMKClusterItem *data = clusters[i];
      NSString *monitorId = data.monitorId;
      NSString *name = data.name;
      int status = data.status;
      NSDictionary *info = @{@"monitorId":monitorId, @"name": name, @"status": @(status) };
      [clusterInfos addObject:info];
    }
    
    ClusterAnnotation *annotation = [[ClusterAnnotation alloc] init];
    annotation.coordinate = item.coordinate;
    annotation.size = item.size;
    annotation.clusterPointsInfo = clusterInfos;
    // annotation.title = [NSString stringWithFormat:@"我是%ld个", item.size];
//    [clusters addObject:annotation];
    [self addAnnotation:annotation];
  }
//  [self removeAnnotations:self.annotations];
//  [self addAnnotations:clusters];
  
  // 清空保存点的数据
  [_realTimeAnnotations removeAllObjects];
  [_inAreaMarkers removeAllObjects];
  [_outAreaMarkers removeAllObjects];
}

/**
 * 初始化轨迹回放的点和路线
 */

-(void)setSportPath:(NSArray*)arr
{
  // 首先筛选组装轨迹点数据
  [self removeAnnotations:self.annotations];
  [self removeOverlays:self.overlays];
  
  // sportAnnotation = nil;
  if (arr.count > 0) {
    _sportPlayed = NO;
    // self.zoomLevel = 19;
    // self.centerCoordinate = CLLocationCoordinate2DMake(40.056898, 112.307626);
    // [self initSportNodes];
    if (arr != nil) {
      if (playBackTracking == nil) {
        playBackTracking =[NSMutableArray array];
      } else {
        [playBackTracking removeAllObjects];
      }
      for (NSDictionary *dic in arr) {
        TracingPoint * tp = [[TracingPoint alloc] init];
        tp.coordinate = CLLocationCoordinate2DMake([dic[@"latitude"] doubleValue], [dic[@"longitude"] doubleValue]);
        // tp.angle = [dic[@"angle"] doubleValue];
        // tp.distance = [dic[@"distance"] doubleValue];
        tp.speed = [dic[@"speed"] doubleValue];
        tp.icon = dic[@"icon"];
        // _playBackSpeed = [dic[@"speed"] doubleValue];
        [playBackTracking addObject:tp];
      }
      // 地图上添加轨迹线、起点、终点和监控对象图标
      // 创建轨迹线
      playBackSportNodeNum = [playBackTracking count];
      CLLocationCoordinate2D paths[playBackSportNodeNum];
      for (NSInteger i = 0; i < playBackSportNodeNum; i++) {
        TracingPoint * tp = playBackTracking[i];
        paths[i] = tp.coordinate;
      }
      BMKPolyline *polyLine = [BMKPolyline polylineWithCoordinates:paths count:playBackSportNodeNum];
      [self addOverlay:polyLine];
      // [self mapViewFitPolyLine:polyLine bottomSpan:_fSpan];
      
      TracingPoint *firstPoint = [playBackTracking firstObject];
      // 创建起点标注物
      SportBMKAnnotation *startPoint = [[SportBMKAnnotation alloc] init];
      NSString *monitorIcon =[RCTConvert NSString:arr[0][@"ico"]];
      startPoint.coordinate = firstPoint.coordinate;
      startPoint.type = @"start";
      startPoint.icon = monitorIcon;
      [self addAnnotation:startPoint];
      // 创建终点标注物
      TracingPoint *lastPoint = [playBackTracking lastObject];
      SportBMKAnnotation *endPoint = [[SportBMKAnnotation alloc] init];
      endPoint.coordinate = lastPoint.coordinate;
      endPoint.type = @"end";
      endPoint.icon = monitorIcon;
      [self addAnnotation:endPoint];
      // 创建监控对象标注物
      sportAnnotation = [[SportBMKAnnotation alloc] init];
      sportAnnotation.coordinate = firstPoint.coordinate;
      sportAnnotation.type = @"monitor";
      sportAnnotation.icon = monitorIcon;
      // sportAnnotation.hopsState = false;
      [self addAnnotation:sportAnnotation];
      sportState = true;
      
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self mapViewFitPolyLine:polyLine bottomSpan:_fSpan];
      });
    }
  }
}

/**
 * 根据地图上添加的覆盖物分布情况，自动缩放地图到合适的视野级别
 */
- (void)mapViewFitPolyLine:(BMKPolyline *) polyLine bottomSpan:(int) bSpan{
//  CGFloat ltX, ltY, rbX, rbY;
//  if (polyLine.pointCount < 1) {
//    return;
//  }
//  BMKMapPoint pt = polyLine.points[0];
//  ltX = pt.x, ltY = pt.y;
//  rbX = pt.x, rbY = pt.y;
//  for (int i = 1; i < polyLine.pointCount; i++) {
//    BMKMapPoint pt = polyLine.points[i];
//    if (pt.x < ltX) {
//      ltX = pt.x;
//    }
//    if (pt.x > rbX) {
//      rbX = pt.x;
//    }
//    if (pt.y > ltY) {
//      ltY = pt.y;
//    }
//    if (pt.y < rbY) {
//      rbY = pt.y;
//    }
//  }
//  BMKMapRect rect;
//  rect.origin = BMKMapPointMake(ltX , ltY);
//  rect.size = BMKMapSizeMake(rbX - ltX, rbY - ltY);
//  // [self setVisibleMapRect:rect];
//  [self setVisibleMapRect:rect animated:true];
//  self.zoomLevel =  self.zoomLevel - 0.2;
  CGFloat ltX, ltY, rbX, rbY;
  if (polyLine.pointCount < 1) {
    return;
  }
  BMKMapPoint pt = polyLine.points[0];
  ltX = pt.x, ltY = pt.y;
  //左上方的点lefttop坐标（ltX，ltY）
  rbX = pt.x, rbY = pt.y;
  //右底部的点rightbottom坐标（rbX，rbY）
  for (int i = 1; i < polyLine.pointCount; i++) {
    BMKMapPoint pt = polyLine.points[i];
    if (pt.x < ltX) {
      ltX = pt.x;
    }
    if (pt.x > rbX) {
      rbX = pt.x;
    }
    if (pt.y < ltY) {
      ltY = pt.y;
    }
    if (pt.y > rbY) {
      rbY = pt.y;
    }
  }
  BMKMapRect rect;
  rect.origin = BMKMapPointMake(ltX , ltY);
  rect.size = BMKMapSizeMake(rbX - ltX, rbY - ltY);
  UIEdgeInsets padding = UIEdgeInsetsMake(60, 20, bSpan, 20);
  // [self setVisibleMapRect:rect edgePadding:padding animated:YES];
  [self fitVisibleMapRect:rect edgePadding:padding withAnimated:YES];
}

/**
 * 设置轨迹回放播放速度
 */
-(void)setSportSpeed:(double)speedValue
{
  _playBackSpeed = speedValue;
}

/**
 * 轨迹回放播放控制
 */
-(void)setSportPathPlay:(BOOL)flag
{
  if (flag) {
    changeState = NO;
    [self sportPlay];
  } else {
    [self sportStop];
  }
}

/**
 * 轨迹播放
 */
-(void)sportPlay
{
  if (_sportPlayed == NO) {
    _sportPlayed = YES;
  }
  
  if (sportState) {
    currentIndex ++;
    if (currentIndex < playBackTracking.count) {
      TracingPoint *currentNode = [playBackTracking objectAtIndex:currentIndex];
      TracingPoint *beforeNode = [playBackTracking objectAtIndex:currentIndex - 1];
      TracingPoint *tempNode = [[TracingPoint alloc] init];
      tempNode.coordinate = sportAnnotation.coordinate;
//      tempNode.icon = sportAnnotation.icon;
//      tempNode.speed = 10;
      
      if (currentNode.coordinate.latitude == beforeNode.coordinate.latitude && currentNode.coordinate.longitude == beforeNode.coordinate.longitude) {
        // 当两个点的经纬度相等的时候
        // 定时执行移动函数
//        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(_playBackSpeed * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
//          [self sportPlay];
//        });
        [self performSelector:@selector(sportPlay) withObject:nil afterDelay:_playBackSpeed];
      } else {
        playBackSportNodes = [[NSMutableArray alloc] init];
        [playBackSportNodes addObject:tempNode];
        [playBackSportNodes addObject:currentNode];
         // NSArray *arr = [playBackTracking subarrayWithRange:NSMakeRange(currentIndex - 1, 2)];
        NSArray *arr = playBackSportNodes;
        CGFloat angle = [self getAngle:arr];
         playBackSportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(angle);
        [playBackSportAnnotationView addTrackingAnimationForPoints:playBackSportNodes duration:_playBackSpeed];
      }
    } else {
      currentIndex --;
    }
  } else {
    [playBackSportAnnotationView resumeLayer];
    sportState = true;
  }
}

/**
 * 轨迹回放暂停
 */
-(void)sportStop
{
  if (sportAnnotation != nil) {
    // [playBackSportAnnotationView removeLayer];
    // [playBackSportAnnotationView layerStop];
    [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(sportPlay) object:nil];
    // [playBackSportAnnotationView resumeLayer];
    // TracingPoint *node = [playBackTracking objectAtIndex:currentIndex];
    // NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
    // NSNumber *lat = [[NSNumber alloc] initWithDouble:node.coordinate.latitude];
    // NSNumber *lng = [[NSNumber alloc] initWithDouble:node.coordinate.longitude];
    // [option setObject:lat forKey:@"latitude"];
    // [option setObject:lng forKey:@"longitude"];
    // [self getAddress:option];
    // currentIndex --;
    // sportState = false;
    // CLLocationCoordinate2D coordinate = node.coordinate;
    // [sportAnnotation setCoordinate:coordinate];
  }
}

/**
 * 设置轨迹回放当前位置
 */
-(void)setSportIndex:(NSArray*)sportIndex
{
  if (sportIndex.count > 0) {
    NSDictionary* option = [sportIndex firstObject];
    BOOL flag = [[RCTConvert NSString:option[@"flag"]] isEqualToString: @"true"];
    if (!flag) {
      if (sportAnnotation != nil) {
        NSString *indexStr = [RCTConvert NSString:option[@"index"]];
        int index = [indexStr intValue];
        if (index <= [playBackTracking count]) {
          changeState = YES;
          currentIndex = index;
          // 已经播放过的标注物取消动画
          // 未播放过的直接设置经纬度坐标
          TracingPoint *point = [playBackTracking objectAtIndex:index];
          if (_sportPlayed) {
           // [playBackSportAnnotationView layerStop];
           // sportState = false;
            sportAnnotation.mapPointType = YES;
            // [playBackSportAnnotationView resumeLayer];
            [playBackSportAnnotationView removeLayer:point.coordinate];
            sportAnnotation.coordinate = point.coordinate;
          } else {
            sportAnnotation.coordinate = point.coordinate;
            sportAnnotation.mapPointType = YES;
            [playBackSportAnnotationView setMapPoint:point.coordinate];
//            static NSString *reuseIndetifier = @"sportsAnnotation";
//            playBackSportAnnotationView = (MovingAnnotationView*)[self.mapView dequeueReusableAnnotationViewWithIdentifier:reuseIndetifier];
//            if (playBackSportAnnotationView == nil)
//            {
//              playBackSportAnnotationView = [[MovingAnnotationView alloc] initWithAnnotation:sportAnnotation reuseIdentifier:reuseIndetifier];
//            }
          }
        }
      }
    }
  }
}

/**
 * 查询出来的位置信息返回给js端
 */
-(void)addressCallBack:(NSString*)addStr
{
  if (self.onAddress) {
    NSDictionary *address = @{@"data":addStr};
    self.onAddress(address);
  }
}

// 初始化轨迹点
//- (void)initSportNodes {
//  _tracking = [NSMutableArray array];
//  //读取数据
//  NSData *jsonData = [NSData dataWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"sport_path" ofType:@"json"]];
//  if (jsonData) {
//    NSArray *array = [jsonData objectFromJSONData];
//    for (NSDictionary *dic in array) {
//      TracingPoint * tp = [[TracingPoint alloc] init];
//      tp.coordinate = CLLocationCoordinate2DMake([dic[@"lat"] doubleValue], [dic[@"lon"] doubleValue]);
//      tp.angle = [dic[@"angle"] doubleValue];
//      tp.distance = [dic[@"distance"] doubleValue];
//      tp.speed = [dic[@"speed"] doubleValue];
//      [_tracking addObject:tp];
//    }
//    [self start];
//  }
//}

/**
 * 初始化轨迹点数据
 */
-(void)initSportNodes:(NSString*)id
{
  // 清空轨迹点数据
  if (_tracking == nil) {
    _tracking = [NSMutableDictionary dictionary];
    // _tracking = [NSMutableArray array];
  }
  // [_tracking removeAllObjects];
  [_tracking removeObjectForKey:id];
  NSMutableArray *values = [_inAreaMarkers objectForKey:id];
  NSMutableArray *info = [NSMutableArray array];
  
  if (values.count >= 2) {
    for (int i = 0; i < 2; i++) {
      NSDictionary *option = [values objectAtIndex:i];
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      TracingPoint * tp = [[TracingPoint alloc] init];
      tp.coordinate = CLLocationCoordinate2DMake(lat, lng);
      // tp.angle = [dic[@"angle"] doubleValue];
      // tp.distance = [dic[@"distance"] doubleValue];
      tp.speed = [option[@"speed"] doubleValue];
      
      tp.time = [option[@"time"] doubleValue];
      tp.angle = [option[@"angle"] doubleValue];
      // [_tracking addObject:tp];
      [info addObject:tp];
    }
    [_tracking setObject:info forKey:id];
    [self addPolyline:id];
  }
}

/**
 * 开始添加轨迹线和标注
 */
-(void)addPolyline:(NSString*)id
{
  NSMutableArray *value = [_tracking objectForKey:id];
  NSInteger sportNodeNum = [value count];
  CLLocationCoordinate2D paths[sportNodeNum];
  for (NSInteger i = 0; i < sportNodeNum; i++) {
    TracingPoint * tp = value[i];
    paths[i] = tp.coordinate;
  }
  
  // 如果是实时尾迹就显示轨迹线
  if (_wakeTyPe) {
    BMKPolyline *path = [BMKPolyline polylineWithCoordinates:paths count:sportNodeNum];
    [self addOverlay:path];
  }
  [self running:id];
}

//开始
//- (void)start {
//  // show route
//  sportNodeNum = [_tracking count];
//  CLLocationCoordinate2D paths[sportNodeNum];
//  for (NSInteger i = 0; i < sportNodeNum; i++) {
//    TracingPoint * tp = _tracking[i];
//    paths[i] = tp.coordinate;
//  }
//  BMKPolyline *path = [BMKPolyline polylineWithCoordinates:paths count:sportNodeNum];
//  [self addOverlay:path];
//
//  //show annotation
//  sportAnnotation = [[BMKPointAnnotation alloc] init];
//  TracingPoint * start = [_tracking firstObject];
//  sportAnnotation.coordinate = start.coordinate;
//  sportAnnotation.title = @"sport node";
//
////  RouteAnnotation *item = [[RouteAnnotation alloc] init];
////  TracingPoint * start = [_tracking firstObject];
////  item.coordinate = start.coordinate;
////  item.title = @"sport node";
//
//  [self addAnnotation:sportAnnotation];
//}

//runing
- (void)running:(NSString*)id
{
  /* Find annotation view for car annotation. */
  NSMutableArray *value = [_tracking objectForKey:id];
  // 上一点数据
  TracingPoint *currentNode = [value objectAtIndex:0];
  
  // 当前点数据
  TracingPoint *tempNode = [value objectAtIndex:1];
  
  // 速度值
  int speed = 10;
  if (currentNode.time != 0) {
    speed = tempNode.time - currentNode.time - 3;
    
//    if (speed - 3 > 0) {
//      speed = speed - 3;
//    }
//
//    if (speed <= 0) {
//      speed = 1;
//    }
    if (speed <= 0) {
      speed = 5;
    }
  }
  
  NSMutableArray *sportNodes = [[NSMutableArray alloc] init];
  
  [sportNodes addObject:currentNode];
  [sportNodes addObject:tempNode];
  MovingAnnotationView *sportAnnotationView = [_optionsIcon objectForKey:id];
  // 计算角度值
   NSArray *arr = [value subarrayWithRange:NSMakeRange(0, 2)];
   CGFloat angle = [self getAngle:arr];
  // CGFloat angle = [self angleConversion:tempNode.angle];
  sportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(angle);
  [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:speed];
}

/**
 * 计算两点间的旋转角度
 */
-(CGFloat)getAngle:(NSArray*)arr
{
  // CGFloat angle = 0.0;
  TracingPoint *startPoint = [arr objectAtIndex:0];
  TracingPoint *endPoint = [arr objectAtIndex:1];
  
  CGPoint start = [self convertCoordinate:startPoint.coordinate toPointToView:self.mapView];
  CGPoint end = [self convertCoordinate:endPoint.coordinate toPointToView:self.mapView];
  CGFloat height = end.y - start.y;
  CGFloat width = end.x - start.x;
  CGFloat rads = atan(height/width);
  
  if (end.y < start.y && end.x > start.x) { // 一区间 负数
    rads =  rads;  // 3.14159
  } else if (end.y <= start.y && end.x <= start.x) { // 二区间 正数
    rads = rads + 3.14159;
  } else if (end.y > start.y && end.x < start.x) { // 三区间 负数
    rads = rads - 3.14159;
  } else if (end.y > start.y && end.x > start.x) { // 四区间 正数
    rads = rads;
  }
  return rads;
  // return radiansToDegrees(rads);
  // degs = degrees(atan((top - bottom)/(right - left)))
  
  // return angle;
}

/**
 * 通过角度计算出旋转值
 */
-(CGFloat)angleConversion:(int)angle
{
  CGFloat transformValue = angle * 3.14159 / 180;
//  if (angle >= 0 && angle <= 90) {
//    transformValue = -transformValue;
//  } else if (angle > 90 && angle < 180) {
//    transformValue = transformValue;
//  } else if (angle >= 180 && angle < 270) {
//    transformValue = transformValue;
//  } else if (angle >= 270 && angle <= 360) {
//    transformValue = -transformValue;
//  }
  return transformValue;
}

// 根据anntation生成对应的View
- (BMKAnnotationView *)mapView:(BMKMapView *)mapView viewForAnnotation:(id <BMKAnnotation>)annotation
{
  if ([annotation isKindOfClass:[CustomBMKAnnotation class]]){
    CustomBMKAnnotation* customAnnotation = annotation;
    NSString *markerId = customAnnotation.markerId;
    static NSString *reuseIndetifier = @"sportsAnnotation";
    if (_optionsIcon == nil) {
      _optionsIcon = [NSMutableDictionary dictionary];
    }
    MovingAnnotationView *sportAnnotationView = (MovingAnnotationView*)[mapView dequeueReusableAnnotationViewWithIdentifier:reuseIndetifier];
    // if (sportAnnotationView == nil)
    // {
      sportAnnotationView = [[MovingAnnotationView alloc] initWithAnnotation:annotation
                                                             reuseIdentifier:reuseIndetifier];
      sportAnnotationView.animateDelegate = self;
      sportAnnotationView.canShowCallout = NO;
    // }
    
    
//    CGPoint centerPoint= CGPointMake(-sportAnnotationView.frame.size.width/2, -sportAnnotationView.frame.size.height/2);
    CGPoint centerPoint = CGPointMake(0, 0);
    [sportAnnotationView setCenterOffset:centerPoint];
    CGFloat angle = [self angleConversion:customAnnotation.angle];
    sportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(angle);
    [_optionsIcon setObject:sportAnnotationView forKey:markerId];
    // sportAnnotationView.backgroundColor = [UIColor blueColor];
    // sportAnnotationView.image = nil;
    if ([customAnnotation.pointType  isEqual: @"wake"]) {
      sportAnnotationView.image = nil;
    } else {
       UIView *viewForImage=[[UIView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
       sportAnnotationView.image=[self getImageFromView:viewForImage];
    }
    // sportAnnotationView.backgroundColor = [UIColor greenColor];
    
    
//    if(potionImage)
//    {
//      sportAnnotationView.image = potionImage;
//    }
    
    /**
     * 自定义paopaoview
     */
    UIImageView *backView = [[UIImageView alloc] init];
    if ([customAnnotation.pointType  isEqual: @"wake"]) {
      backView.frame = CGRectMake(-50, -55, 100, 45);
    } else {
      backView.frame = CGRectMake(-30, -40, 100, 45);
    }
    backView.image = [UIImage imageNamed:@"paopaoView.png"];
    backView.contentMode = UIViewContentModeScaleAspectFit;
    
    int status = customAnnotation.status;
    UIButton * button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    button.frame = CGRectMake(7.f, 13.f, 12.f, 12.f);
    button.layer.cornerRadius = 7;
    button.layer.masksToBounds = YES;
    button.layer.borderWidth = 0;
    button.layer.backgroundColor = [self getStatus:(int)status].CGColor;// [UIColor greenColor].CGColor;
    button.tag = 110;
    [backView addSubview:button];
    
    
    // 添加标题，监控对象名称
    UILabel *titleLabel = [[UILabel alloc] initWithFrame:CGRectMake(22 ,-1, 80, 40)];
    titleLabel.font = [UIFont boldSystemFontOfSize:12];
    titleLabel.textColor = [UIColor blackColor];
    titleLabel.text = customAnnotation.title; // @"渝A88888";
    [backView addSubview:titleLabel];
    
    backView.tag = 111;
    [sportAnnotationView addSubview:backView];
    
  
    UIButton *pointBtn = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 40, 40)];
//    pointBtn.backgroundColor = [UIColor redColor];
    sportAnnotationView.userInteractionEnabled = YES;
    pointBtn.enabled = YES;
    pointBtn.userInteractionEnabled = YES;
    
    // 监控对象标注物添加点击事件
    objc_setAssociatedObject(pointBtn, @"monitorId", markerId, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    [pointBtn addTarget:self action:@selector(pointClick:) forControlEvents:UIControlEventTouchUpInside];

    
    [sportAnnotationView addSubview:pointBtn];
    
    
    
    // 保存创建的paopaoview对象
    if (_paopaoViewInfo == nil) {
      _paopaoViewInfo = [NSMutableDictionary dictionary];
    }
    if ([_centerMonitorId isEqualToString:markerId]) {
      sportAnnotationView.displayPriority = BMKFeatureDisplayPriorityDefaultHigh;
    }
    [_paopaoViewInfo setObject:sportAnnotationView forKey:markerId];
    return sportAnnotationView;
  } else if ([annotation isKindOfClass:[SportBMKAnnotation class]]) {// 轨迹回放点
    // SportBMKAnnotation* sportAnnotation = annotation;
    static NSString *reuseIndetifier = @"sportsAnnotation";
    playBackSportAnnotationView = (MovingAnnotationView*)[mapView dequeueReusableAnnotationViewWithIdentifier:reuseIndetifier];
//    if (playBackSportAnnotationView == nil)
//    {
      playBackSportAnnotationView = [[MovingAnnotationView alloc] initWithAnnotation:annotation
                                                             reuseIdentifier:reuseIndetifier];
      playBackSportAnnotationView.animateDelegate = self;
      playBackSportAnnotationView.canShowCallout = NO;
//    }
    CGPoint centerPoint= CGPointZero;
    [playBackSportAnnotationView setCenterOffset:centerPoint];
    playBackSportAnnotationView.image = nil;
    return playBackSportAnnotationView;
  } else if ([annotation isKindOfClass:[ClusterAnnotation class]]) { // 聚合标注物
    static NSString *reuseIndetifier = @"clusterAnnotation";
    ClusterAnnotation *cAnnotation = annotation;
    BMKAnnotationView *annotationView = (BMKAnnotationView *)[mapView dequeueReusableAnnotationViewWithIdentifier:reuseIndetifier];
    //if (annotationView == nil)
    //{
      annotationView = [[BMKAnnotationView alloc] initWithAnnotation:annotation
                                                     reuseIdentifier:reuseIndetifier];
    //}
    annotationView.image = [UIImage imageNamed:@"cluster.png"];
    
    // 添加标题，聚合数量
    UIImageView *clusterView = [[UIImageView alloc] initWithFrame:CGRectMake(0, 5, 40, 20)];
    // clusterView.backgroundColor = [UIColor whiteColor];
    UILabel *titleLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 40, 20)];
    titleLabel.font = [UIFont boldSystemFontOfSize:16];
    titleLabel.textColor = [UIColor blackColor];
    titleLabel.text = [NSString stringWithFormat:@"%ld", (long)cAnnotation.size]; // @"渝A88888";
    titleLabel.textAlignment = NSTextAlignmentCenter;
    [clusterView addSubview:titleLabel];
    
    [annotationView addSubview:clusterView];
    annotationView.frame = CGRectMake(0, 0, 40, 40);
    annotationView.contentMode = UIViewContentModeScaleAspectFit;
    
    // 聚合物添加长按事件
    UIButton *pointBtn = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 40, 40)];
    annotationView.userInteractionEnabled = YES;
    pointBtn.enabled = YES;
    pointBtn.userInteractionEnabled = YES;
    [annotationView addSubview:pointBtn];
    
    NSMutableArray *clusters = cAnnotation.clusterPointsInfo;
    
    // 监控对象标注物添加点击事件
//    objc_setAssociatedObject(pointBtn, @"clusters", clusters, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
//    RCTLongPress *longPress = [[RCTLongPress alloc] initWithTarget:self action:@selector(clustersPointLongPress:)];
//    longPress.minimumPressDuration = 1;
//    longPress.data = clusters;
//    [pointBtn addGestureRecognizer:longPress];
    
    // 监控对象单击事件
    
    objc_setAssociatedObject(pointBtn, @"clusters", clusters, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    [pointBtn addTarget:self action:@selector(clustersPointClick:) forControlEvents:UIControlEventTouchUpInside];
    
    
    return annotationView;
  } else if ([annotation isKindOfClass:[BDStopAnnotation class]]) {
    static NSString *reuseIndetifier = @"stopAnnotation";
    BDStopAnnotation *stopAnnotation = annotation;
    BMKAnnotationView *stopAnnotationView = (BMKAnnotationView *)[mapView dequeueReusableAnnotationViewWithIdentifier:reuseIndetifier];
    if (stopAnnotationView == nil)
    {
      stopAnnotationView = [[BMKAnnotationView alloc] initWithAnnotation:annotation
                                                   reuseIdentifier:reuseIndetifier];
    }
    if ([stopAnnotation.type isEqualToString:@"active"]) {
      stopAnnotationView.image = [UIImage imageNamed:@"stopActive.png"];
    } else {
      stopAnnotationView.image = [UIImage imageNamed:@"stop.png"];
    }
    
    stopAnnotationView.frame = CGRectMake(0, 0, 25, 25);
    stopAnnotationView.contentMode = UIViewContentModeScaleAspectFit;
    
    // 停止点标注物添加点击事件
    UIButton *pointBtn = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 25, 25)];
    stopAnnotationView.userInteractionEnabled = YES;
    pointBtn.enabled = YES;
    pointBtn.userInteractionEnabled = YES;
//    pointBtn.backgroundColor = [UIColor blueColor];
    [stopAnnotationView addSubview:pointBtn];
    
    NSString *index = [NSString stringWithFormat:@"%d", stopAnnotation.index];
    objc_setAssociatedObject(pointBtn, @"index", index, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    [pointBtn addTarget:self action:@selector(stopPointClick:) forControlEvents:UIControlEventTouchUpInside];
    if (!self.stopAnnotationViews) {
      self.stopAnnotationViews = [[NSMutableDictionary alloc] init];
    }
    [self.stopAnnotationViews setObject:stopAnnotationView forKey:index];
    return stopAnnotationView;
  }
  return nil;
}

-(void)stopPointClick:(UIButton *)button
{
  int index = [objc_getAssociatedObject(button, @"index") intValue];
  [self setStopIndex:index];
  if (self.onStopPointIndexEvent) {
    self.onStopPointIndexEvent(@{@"index": @(index)});
  }
}

-(void)pointClick:(UIButton *)button
{
  NSLog(@"点击事件触发");
  NSString *mid = objc_getAssociatedObject(button, @"monitorId");
  [self cancelMonitorFocus:mid];
  if (self.onPointClickEvent) {
    self.onPointClickEvent(@{@"data": mid});
  }
}

/**
 * 聚合图标长按事件
 */
-(void)clustersPointLongPress:(RCTLongPress *)longPress
{
  if (longPress.state == UIGestureRecognizerStateBegan) {
//    NSMutableArray *clusters = objc_getAssociatedObject(longPress, @"clusters");
    NSMutableArray *data = longPress.data;
    if (self.onClustersClickEvent) {
      self.onClustersClickEvent(@{@"data": data});
    }
  }
}

/**
 * 聚合图标单击事件
 */
- (void)clustersPointClick:(UIButton *)btn
{
  NSMutableArray *clusters = objc_getAssociatedObject(btn, @"clusters");
  if (self.onClustersClickEvent) {
    self.onClustersClickEvent(@{@"data": clusters});
  }
}

-(UIImage *)getImageFromView:(UIView *)view{
  
  UIGraphicsBeginImageContext(view.bounds.size);
  
  [view.layer renderInContext:UIGraphicsGetCurrentContext()];
  
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  
  UIGraphicsEndImageContext();
  
  return image;
  
}

-(UIColor*)getStatus:(int)status
{
  UIColor *color = [UIColor whiteColor];
  if (status == 2) { // 未定位
    color = UIColorFromHex(0x754801);
  } else if (status == 3) { // 未上线
    color = UIColorFromHex(0xb6b6b6);
  } else if (status == 4) { // 停车
    color = UIColorFromHex(0xc80002);
  } else if (status == 5) { // 报警
    color = UIColorFromHex(0xffab2d);
  } else if (status == 9) { // 超速
    color = UIColorFromHex(0x960ba3);
  } else if (status == 10) { // 行驶
    color = UIColorFromHex(0x78af3a);
  } else if (status == 11) { // 心跳
    color = UIColorFromHex(0xfb8c96);
  }
  return color;
}

//- (void)mapView:(BMKMapView *)mapView didAddAnnotationViews:(NSArray *)views {
//  NSLog(@"sdsdsdsdsdsdsdsd");
//}

/**
 *点中底图空白处会回调此接口
 *@param mapview 地图View
 *@param coordinate 空白处坐标点的经纬度
 */
- (void)mapView:(BMKMapView *)mapView onClickedMapBlank:(CLLocationCoordinate2D)coordinate
{
  //NSLog(@"sdsdsdsdsdsdsdsd");
  if (self.onStopPointIndexEvent) {
    self.onStopPointIndexEvent(@{@"index": @(-1)});
  }
  if (!self.onMapClick) {
    return;
  }
  self.onMapClick(@{
   @"data": @"true"});
}

/**
 * 自定义标注物图标
 */
//- (BMKAnnotationView *)mapView:(BMKMapView *)mapView viewForAnnotation:(id <BMKAnnotation>)annotation
//{
//  /**
//   * app 主页创建自定义图标
//   */
//  if ([annotation isKindOfClass:[CustomBMKAnnotation class]])
//  {
//    CustomBMKAnnotation* customAnnotation = annotation;
//    static NSString *reuseIndetifier = @"annotationReuseIndetifier";
//    BMKAnnotationView *annotationView = (BMKAnnotationView *)[mapView dequeueReusableAnnotationViewWithIdentifier:reuseIndetifier];
//    if (annotationView == nil)
//    {
//      annotationView = [[BMKAnnotationView alloc] initWithAnnotation:annotation
//                                                     reuseIdentifier:reuseIndetifier];
//    }
//    NSLog(@"str是:%@", customAnnotation.icon);
//    NSData * data = [NSData dataWithContentsOfURL:[NSURL URLWithString:customAnnotation.icon]];
//    annotationView.image = [UIImage imageWithData:data];
//    return annotationView;
//  }
//  return nil;
//}

/**
 * 标注物移动结束
 */
- (void)movingAnnotationViewAnimationFinished:(BMKPointAnnotation*)annotation{
  /**
   * 删除移动后的标注物第一条数据
   * 删除数据后，如果数据数量大于等于2就进行移动
   */
  if (!changeState) {
    if ([annotation isKindOfClass:[CustomBMKAnnotation class]]){
      CustomBMKAnnotation* customAnnotation = (CustomBMKAnnotation*)annotation;
      NSString *markerId = customAnnotation.markerId;
      if (_wakeTyPe) {
        if(_wakeCoordinate.count > 0) {
          [_wakeCoordinate removeObjectAtIndex:0];
          if (_wakeCoordinate.count >= 2) {
            [self initWakeNodes:markerId];
          }
        }
      } else {
        NSArray *inAreaKeyArr = [_inAreaMarkers allKeys];
        if ([inAreaKeyArr containsObject:markerId]) {
          NSMutableArray *values = [_inAreaMarkers objectForKey:markerId];
//          [playBackSportAnnotationView removeLayer:customAnnotation.coordinate];
          if (values.count > 0) {
            // 判断保存的标注位置点是否保存为2个，如果是两个就进行移动
            [values removeObjectAtIndex:0];
            // [_inAreaMarkers setObject:values forKey:markerId];
            if (values.count >= 2) {
              [self initSportNodes:markerId];
//              dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
//                [self initSportNodes:markerId];
//              });
            }
          }
        }
      }
    } else if ([annotation isKindOfClass:[SportBMKAnnotation class]]) {
      [self sportPlay];
    }
  }
}

-(void)annotationHopsFinished:(BMKPointAnnotation*)annotation
{
  // changeState = NO;
  // sportAnnotation.hopsState = NO;
//  [self sportPlay];
  if ([annotation isKindOfClass:[CustomBMKAnnotation class]]){
    CustomBMKAnnotation* customAnnotation = (CustomBMKAnnotation*)annotation;
    if ([customAnnotation.pointType isEqual:@"wake"]) {
      CLLocationCoordinate2D coor[2] = {0};
      coor[0].latitude = customAnnotation.wakeLineStartLat;
      coor[0].longitude = customAnnotation.wakeLineStartLng;
      
      coor[1] = customAnnotation.coordinate;
      BMKPolyline *polyline = [BMKPolyline polylineWithCoordinates:coor count:2];
      polyline.title = @"wakeline";
      [self addOverlay:polyline];
      
      customAnnotation.wakeLineStartLat = customAnnotation.coordinate.latitude;
      customAnnotation.wakeLineStartLng = customAnnotation.coordinate.longitude;
      
      NSArray *arr = [self overlays];
      
      for (int i = 0; i < arr.count; i++) {
        BMKPolyline *line = arr[i];
        if (![line.title isEqual:@"wakeline"]) {
          [self removeOverlay:line];
        }
      }
    }
  }
}

/**
 * 设置需要在地图中心点显示标注点id
 */
-(void)setCenterPoint:(NSString*)monitorId
{
  if (monitorId != NULL) {
    // 将之前最高层级点设置为默认层级
    if (_centerMonitorId != nil) {
      MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:_centerMonitorId];
      if (sportAnnotationView != nil) {
        sportAnnotationView.displayPriority = BMKFeatureDisplayPriorityDefaultMiddle;
      }
    }
    
    if (![_pageDet  isEqual: @"monitorVideo"] ) {
      CGRect fRect = [self convertRect:self.frame toView:self];
      CGFloat width = fRect.size.width * 0.5;
      CGFloat height = fRect.size.height * 1 / 3;
      [self setMapCenterToScreenPt:CGPointMake(width, height)];
    }
    
    CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:monitorId];
    if (annotation != nil) {
      // self.centerCoordinate = annotation.coordinate;
      [self setCenterCoordinate:annotation.coordinate animated:YES];
      self.zoomLevel = 19;
      
      
//      MovingAnnotationView *annotationView = [_paopaoViewInfo objectForKey:monitorId];
//      if (annotationView != nil) {
//        annotationView.displayPriority = BMKFeatureDisplayPriorityDefaultHigh;
//        _centerMonitorId = monitorId;
//      }
      _centerMonitorId = monitorId;
      [self removeAnnotation:annotation];
      [_realTimeAnnotations removeObjectForKey:monitorId];
      
      NSDictionary* option = [_markesInfo objectForKey:monitorId];
      CustomBMKAnnotation* annotation = [[CustomBMKAnnotation alloc] init];
      [self addMarker:annotation option:option];
      [_realTimeAnnotations setObject:annotation forKey:monitorId];
      
    } else {
      NSDictionary *option = [_markesInfo objectForKey:monitorId];
      if (option != nil) {
        [self centerLatLng:option];
        _centerMonitorId = monitorId;
        self.zoomLevel = 19;
      }
    }
  }
}

-(void)setMonitorFocus:(NSArray*)info
{
  if (info != NULL) {
    NSDictionary *msg = [info firstObject];
    NSString *monitorId = [RCTConvert NSString:msg[@"monitorId"]];
    if (monitorId.length != 0) {
      CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:monitorId];
      if (annotation != nil) {
//        self.centerCoordinate = annotation.coordinate;
        [self setCenterCoordinate:annotation.coordinate animated:YES];
        self.zoomLevel = 19;
      } else {
        NSDictionary *option = [_markesInfo objectForKey:monitorId];
        if (option != nil) {
          [self centerLatLng:option];
        }
      }
    }
  }
}

/**
 * 删除指定id的监控对象
 */
-(void)setRemoveAnnotation:(NSString*)monitorId
{
  if (monitorId) {
    if (_realTimeAnnotations != nil) {
      CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:monitorId];
      if (annotation != nil) {
        [self removeAnnotation:annotation];
        [_realTimeAnnotations removeObjectForKey:monitorId];
        [_markesInfo removeObjectForKey:monitorId];
        [_inAreaMarkers removeObjectForKey:monitorId];
      }
    }
  }
}

/**
 * 设置聚焦跟踪标注物
 */
-(void)setPointTracking:(NSString*)id
{
  if (id) {
//    if (_trackingMonitorId != nil) {
//      CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:_trackingMonitorId];
//      if (annotation != nil) {
//        annotation.tracking = false;
//      }
//    }
    
    CustomBMKAnnotation* point = [_realTimeAnnotations objectForKey:id];
    if (point != nil) {
      point.tracking = true;
    }
  }
}

/**
 * 设置实时尾迹
 */
-(void)setRealTimeWake:(BOOL)flag
{
  _wakeTyPe = flag;
}

/**
 *地图初始化完毕时会调用此接口
 *@param mapview 地图View
 */
- (void)mapViewDidFinishLoading:(BMKMapView *)mapView
{
  //NSLog(@"地图加载完成");
  [self mapView:mapView openMapInertiaDragWithCoefficient:8];
//  [self setCompassImage:[UIImage imageNamed:@"cluster.png"]];
  if (_compassState) {
    if (_isHomeState) {
      [self setCompassPosition:CGPointMake(15, 90)];
    } else {
      [self setCompassPosition:CGPointMake(15, 20)];
    }
  }
  if (self.onMapInitFinish) {
    self.onMapInitFinish(@{@"data":@"true"});
  }
  
  // 开启地图比例尺
  self.showMapScaleBar = YES;
//  self.mapScaleBarPosition = CGPointMake(self.frame.size.width - 70, self.frame.size.height - 40);
//  [self tileLayer];
}

/**
 * 实时追踪当前定位
 */
-(void)setTrackCurrentLocation:(BOOL)flag
{
  if (flag) {
//    self.centerCoordinate = _currentLocation;
    [self setCenterCoordinate:_currentLocation animated:YES];
    self.zoomLevel = 19;
    // }
  } else {
    NSArray *overlayArr = [self overlays];
    if (overlayArr.count > 0) {
      [self mapViewFitPolyLine:[overlayArr firstObject] bottomSpan: _trackPolyLineSpan];
    }
  }
}

/**
 * 实时追踪目标定位
 */
-(void)setTrackTargetLocation:(BOOL)flag
{
  if (flag) {
    NSArray *arr = [self annotations];
    for (int i = 0; i < arr.count; i++) {
      SportBMKAnnotation *trackAnnotation = [arr objectAtIndex:i];
      if ([trackAnnotation.type  isEqual: @"monitor"]) {
//        self.centerCoordinate = trackAnnotation.coordinate;
        [self setCenterCoordinate:trackAnnotation.coordinate animated:YES];
        self.zoomLevel = 19;
      }
    }
  }
  else {
    NSArray *overlayArr = [self overlays];
    if (overlayArr.count > 0) {
      [self mapViewFitPolyLine:[overlayArr firstObject] bottomSpan:_trackPolyLineSpan];
    }
  }
}

/**
 * 实时尾迹当前定位
 */
-(void)setWakeCurrentLocation:(BOOL)flag
{
  NSArray *arr = [self annotations];
  for (int i = 0; i < arr.count; i++) {
    CustomBMKAnnotation *trackAnnotation = [arr objectAtIndex:i];
    if ([trackAnnotation.type  isEqual: @"monitor"]) {
      trackAnnotation.tracking = NO;
    }
  }
  if (flag) {
//    self.centerCoordinate = _currentLocation;
    [self setCenterCoordinate:_currentLocation animated:YES];
    self.zoomLevel = 19;
    // }
  } else {
    NSMutableArray *wakeTrack = [[NSMutableArray alloc] init];
    for (int i = 0; i < _wakeAllCoordinate.count; i++) {
      NSDictionary *option = [_wakeAllCoordinate objectAtIndex:i];
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      TracingPoint * tp = [[TracingPoint alloc] init];
      tp.coordinate = CLLocationCoordinate2DMake(lat, lng);
      // tp.speed = [option[@"speed"] doubleValue];
      // tp.monitorId = markerId;
      // [_tracking addObject:tp];
      [wakeTrack addObject:tp];
    }
    
    NSInteger sportNodeNum = [wakeTrack count];
    CLLocationCoordinate2D paths[sportNodeNum];
    for (NSInteger i = 0; i < sportNodeNum; i++) {
      TracingPoint * tp = wakeTrack[i];
      paths[i] = tp.coordinate;
    }
    
    // 如果是实时尾迹就显示轨迹线
    BMKPolyline *path = [BMKPolyline polylineWithCoordinates:paths count:sportNodeNum];
    [self addOverlay:path];
    NSArray *overlayArr = [self overlays];
    BOOL isThan2 = NO;
    for (int i = 0; i < overlayArr.count; i++) {
      BMKPolyline *line = overlayArr[i];
      if (line.pointCount > 2) {
        isThan2 = YES;
        [self mapViewFitPolyLine:line bottomSpan:250];
        [self removeOverlay:line];
      }
    }
    if (!isThan2) {
      BMKPolyline *line = overlayArr[0];
      [self mapViewFitPolyLine:line bottomSpan:250];
    }
  }
}

/**
 * 实时尾迹目标定位
 */
-(void)setWakeTargetLocation:(BOOL)flag
{
  if (flag) {
    NSArray *arr = [self annotations];
    for (int i = 0; i < arr.count; i++) {
      CustomBMKAnnotation *trackAnnotation = [arr objectAtIndex:i];
      if ([trackAnnotation.type  isEqual: @"monitor"]) {
        trackAnnotation.tracking = YES;
//        self.centerCoordinate = trackAnnotation.coordinate;
        [self setCenterCoordinate:trackAnnotation.coordinate animated:YES];
        self.zoomLevel = 19;
      }
    }
  }
  else {
    NSArray *arr = [self annotations];
    for (int i = 0; i < arr.count; i++) {
      CustomBMKAnnotation *trackAnnotation = [arr objectAtIndex:i];
      if ([trackAnnotation.type  isEqual: @"monitor"]) {
        trackAnnotation.tracking = NO;
      }
    }
    NSMutableArray *wakeTrack = [[NSMutableArray alloc] init];
    for (int i = 0; i < _wakeAllCoordinate.count; i++) {
      NSDictionary *option = [_wakeAllCoordinate objectAtIndex:i];
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      TracingPoint * tp = [[TracingPoint alloc] init];
      tp.coordinate = CLLocationCoordinate2DMake(lat, lng);
      // tp.speed = [option[@"speed"] doubleValue];
      // tp.monitorId = markerId;
      // [_tracking addObject:tp];
      [wakeTrack addObject:tp];
    }
    
    NSInteger sportNodeNum = [wakeTrack count];
    CLLocationCoordinate2D paths[sportNodeNum];
    for (NSInteger i = 0; i < sportNodeNum; i++) {
      TracingPoint * tp = wakeTrack[i];
      paths[i] = tp.coordinate;
    }
    
    // 如果是实时尾迹就显示轨迹线
    BMKPolyline *path = [BMKPolyline polylineWithCoordinates:paths count:sportNodeNum];
    [self addOverlay:path];
    NSArray *overlayArr = [self overlays];
    BOOL isThan2 = NO;
    for (int i = 0; i < overlayArr.count; i++) {
      BMKPolyline *line = overlayArr[i];
      if (line.pointCount > 2) {
        isThan2 = YES;
        [self mapViewFitPolyLine:line bottomSpan:250];
        [self removeOverlay:line];
      }
    }
    if (!isThan2) {
      BMKPolyline *line = overlayArr[0];
      [self mapViewFitPolyLine:line bottomSpan:250];
    }
  }
}

/**
 * 实时尾迹
 */
-(void)setWakeData:(NSArray*)wakeData
{
  if (wakeData.count > 0) {
    NSDictionary* option = [wakeData firstObject];
    NSString* markerId = [RCTConvert NSString:option[@"markerId"]];
    // [self centerLatLng:option];
    
    BOOL isResult = [_wakeMonitorId isEqualToString:markerId];
    
    // if (markerId != _wakeMonitorId) {
    if (isResult) {
      
    } else {
      // 清空地图的覆盖物
      [self removeAnnotations:self.annotations];
      [self removeOverlays:self.overlays];
      if (_wakeCoordinate != nil) {
        [_wakeCoordinate removeAllObjects];
      }
      if (_wakeAllCoordinate != nil) {
        [_wakeAllCoordinate removeAllObjects];
      }
    }
    _wakeMonitorId = markerId;
    
    if (_wakeCoordinate == nil || _wakeCoordinate.count == 0) {
      [self centerLatLng:option];
      // 创建起点标注物
      SportBMKAnnotation *startPoint = [[SportBMKAnnotation alloc] init];
      CLLocationCoordinate2D coor = [self getCoorFromMarkerOption:option];
      _currentLocation = coor;
      startPoint.coordinate = coor;
      startPoint.type = @"start";
      [self addAnnotation:startPoint];
      // 创建监控对象标注物
      CustomBMKAnnotation* annotation = [[CustomBMKAnnotation alloc] init];
      annotation.type = @"monitor";
      annotation.pointType = @"wake";
      annotation.wakeLat = coor.latitude;
      annotation.wakeLng = coor.longitude;
      annotation.wakeLineStartLat = coor.latitude;
      annotation.wakeLineStartLng = coor.longitude;
      // annotation.tracking = YES;
      [self addMarker:annotation option:option];
      annotation.tracking = true;
      if (_wakeCoordinate == nil) {
        _wakeCoordinate = [[NSMutableArray alloc] init];
      }
      if (_wakeAllCoordinate == nil) {
        _wakeAllCoordinate = [[NSMutableArray alloc] init];
      }
      // NSMutableArray *nsarr = [[NSMutableArray alloc] init];
      // [nsarr addObject:option];
      [_wakeCoordinate addObject:option];
      [_wakeAllCoordinate addObject:option];
    } else {
      NSDictionary *lastOption = [_wakeCoordinate lastObject];
      double lastLat = [RCTConvert double:lastOption[@"latitude"]];
      double lastLng = [RCTConvert double:lastOption[@"longitude"]];
      
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      
      if (!(lastLat == lat && lastLng == lng)) {
        
        if (self.latestPoins) {
          self.latestPoins = nil;
          
//          NSDictionary *firstOption = [_wakeCoordinate firstObject];
          [_wakeCoordinate removeAllObjects];
//          [_wakeCoordinate addObject:firstOption];
          [_wakeCoordinate addObject:option];
          
          // 删除对应标注物
          NSArray *arr = [self annotations];  
          for (int i = 0; i < arr.count; i++) {
            if ([arr[i] isKindOfClass:[CustomBMKAnnotation class]]) {
              CustomBMKAnnotation *annotation = arr[i];
              [self removeAnnotation:annotation];
              
              CLLocationCoordinate2D coor = [self getCoorFromMarkerOption:option];
              
//              MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:markerId];
//              [sportAnnotationView removeLayer:annotation.coordinate];
              
              [self setCenterCoordinate:coor animated:YES];
              CustomBMKAnnotation* newAnnotation = [[CustomBMKAnnotation alloc] init];
              newAnnotation.type = @"monitor";
              newAnnotation.pointType = @"wake";
              newAnnotation.wakeLat = coor.latitude;
              newAnnotation.wakeLng = coor.longitude;
              newAnnotation.wakeLineStartLat = coor.latitude;
              newAnnotation.wakeLineStartLng = coor.longitude;
              [self addMarker:annotation option:option];
              annotation.tracking = true;
              break;
            }
          }
        } else {
          [_wakeCoordinate addObject:option];
          [_wakeAllCoordinate addObject:option];
          
          if (_wakeCoordinate.count == 2) {
            [self initWakeNodes:markerId];
          }
        }
      }
      
      // 更新监控对象状态
      MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:markerId];
      UIView* button = [[sportAnnotationView viewWithTag:111] viewWithTag:110];
      int status = [RCTConvert int:option[@"status"]];
      button.layer.backgroundColor = [self getStatus:(int)status].CGColor;
    
    }
  }
}

/**
 * 初始化尾迹
 */
-(void)initWakeNodes:(NSString*)markerId{
  NSMutableArray *wakeTrack = [[NSMutableArray alloc] init];
  for (int i = 0; i < 2; i++) {
    NSDictionary *option = [_wakeCoordinate objectAtIndex:i];
    double lat = [RCTConvert double:option[@"latitude"]];
    double lng = [RCTConvert double:option[@"longitude"]];
    TracingPoint * tp = [[TracingPoint alloc] init];
    tp.coordinate = CLLocationCoordinate2DMake(lat, lng);
    tp.speed = [option[@"speed"] doubleValue];
    tp.monitorId = markerId;
    tp.time = [option[@"time"] doubleValue];
    // [_tracking addObject:tp];
    [wakeTrack addObject:tp];
  }
  [self addwakePolyline:wakeTrack];
}

-(void)addwakePolyline:(NSMutableArray*)arr
{
//  NSInteger sportNodeNum = [arr count];
//  CLLocationCoordinate2D paths[sportNodeNum];
//  for (NSInteger i = 0; i < sportNodeNum; i++) {
//    TracingPoint * tp = arr[i];
//    paths[i] = tp.coordinate;
//  }
//
//  // 如果是实时尾迹就显示轨迹线
//  BMKPolyline *path = [BMKPolyline polylineWithCoordinates:paths count:sportNodeNum];
//  [self addOverlay:path];
  [self wakeRunning:arr];
}

-(void)wakeRunning:(NSMutableArray*)value
{
  TracingPoint *startNode = [value objectAtIndex:0];
  
  TracingPoint *tempNode = [value objectAtIndex:1];
  
  int speed = tempNode.time - startNode.time;
  
  NSMutableArray *sportNodes = [[NSMutableArray alloc] init];
  
  [sportNodes addObject:startNode];
  [sportNodes addObject:tempNode];
  MovingAnnotationView *sportAnnotationView = [_optionsIcon objectForKey:tempNode.monitorId];
  // 计算角度值
  NSArray *arr = [value subarrayWithRange:NSMakeRange(0, 2)];
  CGFloat angle = [self getAngle:arr];
  sportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(angle);
  [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:speed];
}

/**
 * 位置信息查询
 */
-(void)setSearchAddress:(NSArray *)data
{
  if (data.count > 0) {
    NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
    NSDictionary* coorData = [data firstObject];
    NSNumber *lat = [[NSNumber alloc] initWithDouble:[RCTConvert double:coorData[@"latitude"]]];
    NSNumber *lng = [[NSNumber alloc] initWithDouble:[RCTConvert double:coorData[@"longitude"]]];
    [option setObject:lat forKey:@"latitude"];
    [option setObject:lng forKey:@"longitude"];
    [self getAddress:option];
  }
}

/**
 * 放大地图
 */
-(void)setMapAmplification:(NSArray *)data
{
  if (data.count > 0) {
    float zoomLevel = self.zoomLevel;
    if (zoomLevel < 21) {
      self.zoomLevel = zoomLevel + 1;
    }
  }
}

/**
 * 缩小地图
 */
-(void)setMapNarrow:(NSArray *)data
{
  if (data.count > 0) {
    float zoomlevel = self.zoomLevel;
    if (zoomlevel > 4) {
      self.zoomLevel = zoomlevel - 1;
    }
  }
}

/**
 * 聚合数量
 */
-(void)setAggrNum:(int)aggrNum
{
  if (aggrNum) {
    _clusterNumer = aggrNum;
  }
}

/**
 * 标明是否是主页
 */
-(void)setIsHome:(BOOL)isHome
{
  _isHomeState = isHome;
}

/**
 * 点名下发功能
 */
-(void)setLatestLocation:(NSDictionary*)info
{
  if (info) {
    double lat = [RCTConvert double:info[@"latitude"]];
    double lng = [RCTConvert double:info[@"longitude"]];
    NSString* markerId = [RCTConvert NSString:info[@"markerId"]];
    
    CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
    CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:markerId];
    if (annotation != nil) {
      [playBackSportAnnotationView removeLayer:point];
      // annotation.coordinate = point;
//      self.centerCoordinate = point;
      [self setCenterCoordinate:point animated:YES];
      NSString* title = annotation.title;
      NSString* ico = annotation.icon;
      int status = [RCTConvert int:info[@"status"]];
      int angle = [RCTConvert int:info[@"angle"]];
      int time = [RCTConvert int:info[@"time"]];
      NSDictionary* option = @{
       @"markerId":markerId,
       @"latitude":@(lat),
       @"longitude":@(lng),
       @"title": title,
       @"ico": ico,
       @"speed": @"10",
       @"status": @(status),
       @"angle": @(angle),
       @"time": @(time),
      };
      // 删除对应标注物
      [self removeAnnotation:annotation];
      [_realTimeAnnotations removeObjectForKey:markerId];
      
      [_markesInfo setObject:option forKey:markerId];
      NSMutableArray *values = [[NSMutableArray alloc] init];
      [values addObject:option];
      [_inAreaMarkers setObject:values forKey:markerId];
      // 重新创建标注物
      CustomBMKAnnotation *newAnnotation = [[CustomBMKAnnotation alloc] init];
      [self addMarker:newAnnotation option:option];
      [_realTimeAnnotations setObject:newAnnotation forKey:markerId];
    }
  }
}

/**
 * 是否开启指南针
 */
-(void)setCompassOpenState:(BOOL)compassOpenState
{
  _compassState = compassOpenState;
}

/**
 * 地图轨迹适配
 */
-(void)setFitPolyLineSpan:(NSString*)fitPolyLineSpan
{
  if (fitPolyLineSpan) {
    NSArray *arr = [fitPolyLineSpan componentsSeparatedByString:@"|"]; //从字符A中分隔成2个元素的数组
    NSString *str = [arr objectAtIndex:2];
    int span = [[arr firstObject] intValue];
    
    if (!([str isEqual: @"playing"] && span == _fSpan)) {
      _fSpan = [[arr firstObject] intValue];
      
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.25 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        NSArray* lines = self.overlays;
        BMKPolyline *polyLine = [lines firstObject];
        if (lines.count > 0) {
          [self mapViewFitPolyLine:polyLine bottomSpan:_fSpan];
        }
      });
    }
  }
}

/**
 * 实时追踪轨迹适配
 */
-(void)setTrackPolyLineSpan:(int)trackPolyLineSpan
{
  if (trackPolyLineSpan) {
    _trackPolyLineSpan = trackPolyLineSpan;
    NSArray* lines = self.overlays;
    if (lines.count > 0) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.25 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self mapViewFitPolyLine:[lines firstObject] bottomSpan:_trackPolyLineSpan];
      });
    }
  }
}


#pragma mark 开启地图的惯性缩放
- (void)mapView:(BMKMapView *)mapView openMapInertiaDragWithCoefficient:(float)inertiaCoefficient{
  /*惯性系数也就是方程的二次项系数*/
  [BMKMapViewAdapter mapView:mapView openInertiaDragWithCoefficient:inertiaCoefficient];
}

/**
 阻尼效果改变地图等级
 
 @param currentLevel  当前的等级
 @param settingLevel  要设定的等级
 */

- (void)dampZoomingMapLevelFromCurrentValue:(float)currentLevel ToSettingValue:(float)settingLevel{
  [BMKMapViewAdapter mapView:self.mapView dampZoomingMapLevelFromCurrentValue:currentLevel ToSettingValue:settingLevel];
}

-(void)mapView:(BMKMapView *)mapView didSelectAnnotationView:(BMKAnnotationView *)view
{
  //NSLog(@"2323232323");
  // [self deselectAnnotation:view animated:YES];
  [view setSelected:NO];
  // [self.annotations makeObjectsPerformSelector:@selector(setSelected:) withObject:@(NO)];

}

// 百度坐标转高德
-(AMapNaviPoint *)bdToGaodeWithLat:(double)lat andLon:(double)lon
{
  double bd_lon = lon - 0.0065;
  double bd_lat = lat - 0.006;
  return [AMapNaviPoint locationWithLatitude:bd_lat longitude:bd_lon];
}

// 动态控制地图比例尺位置
-(void)setBaiduMapScalePosition:(NSString *)value

{
  NSArray *arr = [value componentsSeparatedByString:@"|"];
  int x = [[arr firstObject] intValue];
  int y = [[arr lastObject] intValue];
  // self.showMapScaleBar = YES;
  self.mapScaleBarPosition = CGPointMake(x, self.frame.size.height - y);
}

// 监控对象设置聚焦跟踪
-(void)setMonitorFocusTrack:(NSString *)value
{
  NSArray *arr = [value componentsSeparatedByString:@"|"];
  NSString *monitorId = [arr firstObject];
  CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:monitorId];
  _centerPoint = monitorId;
  BOOL state = [[arr objectAtIndex:1] boolValue];
  if (annotation) {
    if (state) { // 开启聚焦跟踪
//      self.centerCoordinate = annotation.coordinate;
      [self setCenterCoordinate:annotation.coordinate animated:YES];
//      CLLocationCoordinate2D s = annotation.coordinate;
      self.zoomLevel = 19;
//      annotation.tracking = YES;
      [self createGCD:annotation];
    } else { // 关闭聚焦跟踪
//      annotation.tracking = NO;
      [self closeGCD];
    }
  } else {
    if (state) {
      NSDictionary *option = [_markesInfo objectForKey:monitorId];
      if (option != nil) {
        double lat = [RCTConvert double:option[@"latitude"]];
        double lng = [RCTConvert double:option[@"longitude"]];
        CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
//        self.centerCoordinate = point;
        [self setCenterCoordinate:point animated:YES];
        self.zoomLevel = 19;
        _monitorFocusId = monitorId;
      }
    }
  }
}

// 取消聚焦跟踪并通知到js端
-(void)cancelMonitorFocus:(NSString *)id
{
  if (self.onMonitorLoseFocus) {
    self.onMonitorLoseFocus(@{@"data": @"loseFocus"});
  }
  CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:id];
  if (annotation) {
    // annotation.tracking = NO;
    [self closeGCD];
  }
}

//
-(void)createGCD:(CustomBMKAnnotation *)annotation
{
  if (self.timer) {
    [self closeGCD];
  }
  
  dispatch_queue_t queue = dispatch_get_main_queue();
  //创建一个定时器（dispatch_source_t本质上还是一个OC对象）
  self.timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
  //设置定时器的各种属性
  dispatch_time_t start = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0*NSEC_PER_SEC));
  uint64_t interval = (uint64_t)(0.5*NSEC_PER_SEC);
  dispatch_source_set_timer(self.timer, start, interval, 0);
  //设置回调
  // __weak typeof(self) weakSelf = self;
  dispatch_source_set_event_handler(self.timer, ^{
    //定时器需要执行的操作
    [self isBeyondArea:annotation];
    
  });
  //启动定时器（默认是暂停）
  dispatch_resume(self.timer);
}

// 监听聚焦监控对象是否超出限定区域
-(void)isBeyondArea:(CustomBMKAnnotation *)annotation
{
  // CGRect bounds = self.bounds;
  CGPoint center = [self convertCoordinate:self.centerCoordinate toPointToView:self.mapView];
  CGPoint CGAnn = [self convertCoordinate:annotation.coordinate toPointToView:self.mapView];
  CGFloat width = fabs(center.x - CGAnn.x);
  CGFloat height = fabs(center.y - CGAnn.y);
  CGFloat value= sqrt(pow(width, 2) + pow(height, 2));
  if (value > 120) {
//    self.centerCoordinate = annotation.coordinate;
    [self setCenterCoordinate:annotation.coordinate animated:YES];
  }
}

// 结束GCD定时监听
-(void)closeGCD
{
  if (self.timer) {
    dispatch_cancel(self.timer);
    self.timer = nil;
  }
}

/**
 * 监控对象跳转到最新点
 */
-(void)setGoLatestPoin:(NSArray *)monitorIds
{
  if (monitorIds) {
//    if (self.onGoLatestPoinEvent) {
//      self.onGoLatestPoinEvent(@{@"data": @"success"});
//    }
    self.latestPoins = nil;
    self.latestPoins = [[NSMutableArray alloc] init];
    for (int i = 0; i < monitorIds.count; i += 1) {
      NSDictionary* info = [monitorIds objectAtIndex:i];
      NSString* markerId = [RCTConvert NSString:info[@"vehicleId"]];
      [self.latestPoins addObject:markerId];
    }
  }
}

-(void)setMonitorLatestPoint:(NSString *)markerId latestPosition:(NSDictionary *)option
{
  if (markerId && option) {
    CustomBMKAnnotation* annotation = [self.realTimeAnnotations objectForKey:markerId];
    [self removeAnnotation: annotation];
    [_realTimeAnnotations removeObjectForKey:markerId];
    [_markesInfo setObject:option forKey:markerId];
    NSMutableArray *values = [[NSMutableArray alloc] init];
    [values addObject:option];
    [_inAreaMarkers setObject:values forKey:markerId];
    // 重新创建标注物
    CustomBMKAnnotation *newAnnotation = [[CustomBMKAnnotation alloc] init];
    [self addMarker:newAnnotation option:option];
    [_realTimeAnnotations setObject:newAnnotation forKey:markerId];
//    if (annotation) {
//      // 设置监控对象经纬度
//      double lat = [RCTConvert double:position[@"latitude"]];
//      double lng = [RCTConvert double:position[@"longitude"]];
//      CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(lat, lng);
//      [annotation setCoordinate:coordinate];
//
//      // 更新监控对象状态
//      MovingAnnotationView *sportAnnotationView = [self.paopaoViewInfo objectForKey:markerId];
//      UIView* button = [[sportAnnotationView viewWithTag:111] viewWithTag:110];
//      int status = [RCTConvert int:position[@"status"]];
//      button.layer.backgroundColor = [self getStatus:(int)status].CGColor;
//
//      // 调整监控对象角度
//      int angle = [RCTConvert int:position[@"angle"]];
//      CGFloat cgAngle = [self angleConversion:angle];
//      sportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(cgAngle);
//
//      NSMutableArray *newValues = [[NSMutableArray alloc] init];
//      [newValues addObject:position];
//      [self.inAreaMarkers setObject:newValues forKey:markerId];
//    }
  }
}

-(void)tileLayer
{
//  BMKURLTileLayer *urlTileLayer = [[BMKURLTileLayer alloc] initWithURLTemplate:@"http://mt2.google.cn/vt/lyrs=s@167000000&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galil"];
//  urlTileLayer.maxZoom = 21;
//  urlTileLayer.minZoom = 6;
//  [self.mapView addOverlay:urlTileLayer];
  
  
  BMKLocalSyncTileLayer *syncTile = [[BMKLocalSyncTileLayer alloc] init];
  syncTile.maxZoom = 21;
  syncTile.minZoom = 3;
  [self addOverlay:syncTile];
}

/**
 * 历史数据停止点
 */
- (void)createStopPoint:(NSArray *)stopPointData
{
  if (stopPointData.count > 0) {
    /**
     * 删除和清空停止点图标和数据
     */
    if (self.stopAnnotations) {
      [self removeAnnotations:[self.stopAnnotations allValues]];
      [self.stopAnnotations removeAllObjects];
    }
    /**
     * 创建停止点图标
     */
    for (int i = 0; i < stopPointData.count; i++) {
      NSDictionary *dic = stopPointData[i];
      NSDictionary *location = [dic objectForKey:@"startLocation"];
      CLLocationCoordinate2D coor = CLLocationCoordinate2DMake([location[@"latitude"] doubleValue], [location[@"longitude"] doubleValue]);
      BDStopAnnotation *stopPoint = [[BDStopAnnotation alloc] init];
      stopPoint.coordinate = coor;
      stopPoint.index = i;
      stopPoint.type = @"default";
      [self addAnnotation:stopPoint];
      if (!self.stopAnnotations) {
        self.stopAnnotations = [[NSMutableDictionary alloc] init];
      }
      [self.stopAnnotations setObject:stopPoint forKey:@(i)];
    }
  };
}

/**
 * 地图历史数据停止点数据
 */
-(void)setStopPoints:(NSArray *)stopPoints
{
  if (stopPoints) {
    self.stopActiveIndex = -1;
    [self createStopPoint:stopPoints];
  }
}

/**
 * 地图历史数据停止点数据
 */
-(void)setStopIndex:(int)index
{
  if (index != -1 && index != self.stopActiveIndex) {
    if (self.stopAnnotations) {
      BDStopAnnotation *stopAnnotation = [self.stopAnnotations objectForKey:@(index)];
      if (stopAnnotation) {
        NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
        NSNumber *lat = [[NSNumber alloc] initWithDouble:stopAnnotation.coordinate.latitude];
        NSNumber *lng = [[NSNumber alloc] initWithDouble:stopAnnotation.coordinate.longitude];
        [option setObject:lat forKey:@"latitude"];
        [option setObject:lng forKey:@"longitude"];
        [option setObject:@"stopPoint" forKey:@"type"];
        [option setObject:@(index) forKey:@"index"];
        [self getAddress:option];
        /**
         * 删除高亮annotation
         */
        BDStopAnnotation *oldStopAnnotation = [self.stopAnnotations objectForKey:@(self.stopActiveIndex)];
        if (oldStopAnnotation != nil) {
          double latitude = oldStopAnnotation.coordinate.latitude;
          double longitude = oldStopAnnotation.coordinate.longitude;
          [self removeAnnotation:oldStopAnnotation];
          [self.stopAnnotationViews removeObjectForKey:@(self.stopActiveIndex)];
          [self.stopAnnotations removeObjectForKey:@(self.stopActiveIndex)];
          /**
           * 创建默认停止图标
           */
          
          CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(latitude, longitude);
          BDStopAnnotation *stopPoint = [[BDStopAnnotation alloc] init];
          stopPoint.coordinate = coor;
          stopPoint.index = self.stopActiveIndex;
          stopPoint.type = @"default";
          [self addAnnotation:stopPoint];
          [self.stopAnnotations setObject:stopPoint forKey:@(self.stopActiveIndex)];
        }
        self.stopActiveIndex = index;
        
        /**
         * 创建高亮停止图标
         */
        CLLocationCoordinate2D activeCoor = CLLocationCoordinate2DMake(stopAnnotation.coordinate.latitude, stopAnnotation.coordinate.longitude);
        [self removeAnnotation:stopAnnotation];
        [self.stopAnnotationViews removeObjectForKey:@(index)];
        BDStopAnnotation *stopActivePoint = [[BDStopAnnotation alloc] init];
        stopActivePoint.coordinate = activeCoor;
        stopActivePoint.index = index;
        stopActivePoint.type = @"active";
        [self addAnnotation:stopActivePoint];
        [self.stopAnnotations setObject:stopActivePoint forKey:@(index)];
      }
    }
  } else if (index == -1) {
    /**
     * 删除高亮annotation
     */
    BDStopAnnotation *oldStopAnnotation = [self.stopAnnotations objectForKey:@(self.stopActiveIndex)];
    double latitude = oldStopAnnotation.coordinate.latitude;
    double longitude = oldStopAnnotation.coordinate.longitude;
    [self removeAnnotation:oldStopAnnotation];
    [self.stopAnnotationViews removeObjectForKey:@(self.stopActiveIndex)];
    [self.stopAnnotations removeObjectForKey:@(self.stopActiveIndex)];
    /**
     * 创建默认停止图标
     */
    
    CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(latitude, longitude);
    BDStopAnnotation *stopPoint = [[BDStopAnnotation alloc] init];
    stopPoint.coordinate = coor;
    stopPoint.index = self.stopActiveIndex;
    stopPoint.type = @"default";
    [self addAnnotation:stopPoint];
    [self.stopAnnotations setObject:stopPoint forKey:@(self.stopActiveIndex)];
    self.stopActiveIndex = index;
  }
}

- (void)stopPointAddressCallBack:(NSDictionary *)data
{
  if (self.onStopPointDataEvent) {
//    NSDictionary *data = @{@"data":data};
    self.onStopPointDataEvent(data);
  }
}

@end
