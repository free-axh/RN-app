//
//  ViewController.m
//  rnProject
//
//  Created by zwkj on 2019/2/18.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  
  self.view.backgroundColor = [UIColor lightGrayColor];
  
  
  UIButton*btn = [UIButton buttonWithType:UIButtonTypeCustom];
  btn.frame = CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height);
  [btn addTarget:self action:@selector(touchAction) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:btn];
}

-(void)touchAction{
  [self.navigationController popViewControllerAnimated:true];
}

@end
