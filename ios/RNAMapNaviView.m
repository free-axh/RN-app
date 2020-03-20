//
//  RNAMapNaviView.m
//  rnProject
//
//  Created by zwkj on 2019/2/18.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "RNAMapNaviView.h"
#import "RNAMapNavi.h"

@implementation RNAMapNaviView

- (instancetype)init
{
  self = [super init];
  if (self) {
    RNAMapNavi *navi = [[RNAMapNavi alloc] init];
    [navi viewDidLoad];
  }
  return self;
}

@end
