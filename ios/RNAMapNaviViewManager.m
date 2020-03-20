//
//  RNAMapNaviViewManager.m
//  rnProject
//
//  Created by zwkj on 2019/2/18.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "RNAMapNaviViewManager.h"
#import "React/RCTUIManager.h"
#import "RNAMapNaviView.h"

@implementation RNAMapNaviViewManager

RCT_EXPORT_MODULE()

-(UIView *)view
{
  RNAMapNaviView *naviView = [[RNAMapNaviView alloc] init];
  return naviView;
}

@end
