//

//  Created by 改革丰富 on 2018/7/26.
//  Copyright © 2018年 改革丰富. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ZWStreamView.h"

@protocol ZWStreamPlayerDelegate;

@interface ZWStreamPlayer : NSObject

@property(nonatomic, weak) id<ZWStreamPlayerDelegate> delegate;

@property (nonatomic, copy, readonly) NSString* uri;

-(instancetype)initWithUri:(NSString*)uri view:(ZWStreamView*)view delegate:(id<ZWStreamPlayerDelegate>)delegate sampleRate:(int)sampleRate enableAudio:(bool)enableAudio;

-(void)playAudio;

-(void)closeAudio;

-(void)close;

@end

@protocol ZWStreamPlayerDelegate <NSObject>

-(void)onState:(int)state;

@end
