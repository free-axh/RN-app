//
//  CACoordLayer.m
//

#import "CACoordLayer.h"

@implementation CACoordLayer

@dynamic mapx;
@dynamic mapy;

- (id)initWithLayer:(id)layer
{
    if ((self = [super initWithLayer:layer]))
    {
        if ([layer isKindOfClass:[CACoordLayer class]])
        {
            CACoordLayer * input = layer;
            self.mapx = input.mapx;
            self.mapy = input.mapy;
            [self setNeedsDisplay];
        }
    }
    return self;
}

+ (BOOL)needsDisplayForKey:(NSString *)key
{
    if ([@"mapx" isEqualToString:key])
    {
        return YES;
    }
    if ([@"mapy" isEqualToString:key])
    {
        return YES;
    }
    
    return [super needsDisplayForKey:key];
}

- (void)display
{
    CACoordLayer * layer = [self presentationLayer];
  // CACoordLayer * layer = self.presentationLayer;
    // if (layer.mapView) {
      if ([self.annotation isKindOfClass:[CustomBMKAnnotation class]]){
        CustomBMKAnnotation* annotation = self.annotation;
        // 判断是否为聚焦跟踪车辆
        if (annotation.tracking) {
          // CGRect rect = [self.mapView convertRect:self.frame toView:self.mapView];
          // CGRect rect2 = self.mapView.bounds;
          // rect2.size.height -= 100;
          // if (!CGRectContainsRect(rect2, rect)) {
            self.mapView.centerCoordinate = annotation.coordinate;
          // };
        }
        
        // 实时尾迹划线
        if ([annotation.pointType isEqual:@"wake"]) {
          
//          if (fabs(annotation.wakeLat - annotation.coordinate.latitude) > 0.005 || fabs(annotation.wakeLng - annotation.coordinate.longitude) > 0.005) {}
          
          CLLocationCoordinate2D coor[2] = {0};
          coor[0].latitude = annotation.wakeLat;
          coor[0].longitude = annotation.wakeLng;
          
          coor[1] = annotation.coordinate;
          
          BMKPolyline *polyline = [BMKPolyline polylineWithCoordinates:coor count:2];
          [self.mapView addOverlay:polyline];
          
          self.annotation.wakeLat = annotation.coordinate.latitude;
          self.annotation.wakeLng = annotation.coordinate.longitude;
        }

        if (!(isnan(layer.mapx) || isnan(layer.mapy))) {
          BMKMapPoint mappoint = BMKMapPointMake(layer.mapx, layer.mapy);
          //根据得到的坐标值，将其设置为annotation的经纬度
          self.annotation.coordinate = BMKCoordinateForMapPoint(mappoint);
          //设置layer的位置，显示动画
          CGPoint center = [self.mapView convertCoordinate:BMKCoordinateForMapPoint(mappoint) toPointToView:self.mapView];
         
          self.position = center;
        }
      } else if ([self.annotation isKindOfClass:[SportBMKAnnotation class]]) {
        SportBMKAnnotation* annotation = (SportBMKAnnotation*)self.annotation;
        if (!annotation.mapPointType) {
          //      if (!annotation.hopsState) {
          // SportBMKAnnotation* annotation = self.annotation;
          CGRect rect = [self.mapView convertRect:self.frame toView:self.mapView];
          CGRect rect2 = self.mapView.bounds;
          rect2.size.height -= 100;
          if (!CGRectContainsRect(rect2, rect)) {
            self.mapView.centerCoordinate = self.annotation.coordinate;
          };
          if (!(isnan(layer.mapx) || isnan(layer.mapy))) {
            BMKMapPoint mappoint = BMKMapPointMake(layer.mapx, layer.mapy);
            //根据得到的坐标值，将其设置为annotation的经纬度
            self.annotation.coordinate = BMKCoordinateForMapPoint(mappoint);
            //设置layer的位置，显示动画
            CGPoint center = [self.mapView convertCoordinate:BMKCoordinateForMapPoint(mappoint) toPointToView:self.mapView];
            self.position = center;
          }
        } else {
          annotation.mapPointType = NO;
        }
      }
    // }
}

@end


