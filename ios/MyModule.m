//
//  MyModule.m
//  rnProject
//
//  Created by zwkj on 2019/2/18.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "MyModule.h"
#import "ViewController.h"

@implementation MyModule

RCT_EXPORT_MODULE();


RCT_EXPORT_METHOD(openVC:(NSString *)event)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [[NSNotificationCenter defaultCenter]postNotificationName:@"openVC" object:nil];
  });
}


@end
