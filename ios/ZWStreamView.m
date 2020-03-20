//
//  ZWStreamView.mm
//  MetalYUV420P
//
//  Created by 改革丰富 on 2017/3/7.
//  Copyright © 2017年 改革丰富. All rights reserved.
//

#import "ZWStreamView.h"
#import <Metal/Metal.h>
#import <MetalKit/MetalKit.h>

static id<MTLDevice> device;
static id<MTLCommandQueue> commandQueue;
static id<MTLLibrary> library;
static id<MTLFunction> vertexFunction;
static id<MTLFunction> fragmentFunctionNV12;
static id<MTLRenderPipelineState> renderStateHard;
static id<MTLSamplerState> sampler;

static float32_t vertexData[16] = {0.0, 0.0, -1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 0.0, 1.0, -1.0, -1.0};
static int32_t indices[6] = {0, 1, 2, 0, 2, 3};
static float yuvFormulaData[12] = {1.0, 1.0, 1.0, 0.0, 0.0, -0.58060, 1.13983, 0.0, 2.03211, -0.39465, 0.0, 0.0};

static id<MTLBuffer> indexBuffer;
static id<MTLBuffer> vertexBuffer;
static id<MTLBuffer> yuvFormulaBuffer;

@interface ZWStreamView()
{
    CVMetalTextureRef yTextureRef;
    CVMetalTextureRef uvTextureRef;
    CVMetalTextureCacheRef metalTextureCache;

    id<MTLTexture> _yTexture;
    id<MTLTexture> _uvTexture;
    __weak CAMetalLayer* _metalLayer;
}

@end

@implementation ZWStreamView

+ (Class)layerClass
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        device = MTLCreateSystemDefaultDevice();
        commandQueue = [device newCommandQueue];
        library = [device newDefaultLibrary];
        vertexFunction = [library newFunctionWithName:@"texture_vertex"];
        fragmentFunctionNV12 = [library newFunctionWithName:@"texture_fragmentNV12"];

        MTLRenderPipelineDescriptor* renderPipelineDescriptor = [[MTLRenderPipelineDescriptor alloc] init];
        renderPipelineDescriptor.vertexFunction = vertexFunction;
        renderPipelineDescriptor.colorAttachments[0].pixelFormat = MTLPixelFormatBGRA8Unorm;

        NSError *errors = nil;
        renderPipelineDescriptor.fragmentFunction = fragmentFunctionNV12;
        renderStateHard = [device newRenderPipelineStateWithDescriptor:renderPipelineDescriptor error:&errors];
        assert(renderStateHard && !errors);

        MTLSamplerDescriptor* samplerDescriptor = [[MTLSamplerDescriptor alloc] init];
        samplerDescriptor.minFilter = MTLSamplerMinMagFilterLinear;
        samplerDescriptor.magFilter = MTLSamplerMinMagFilterLinear;
        samplerDescriptor.tAddressMode = MTLSamplerAddressModeRepeat;
        samplerDescriptor.sAddressMode = MTLSamplerAddressModeRepeat;

        sampler = [device newSamplerStateWithDescriptor:samplerDescriptor];
        indexBuffer = [device newBufferWithBytes:indices length:6 * 4 options:MTLResourceOptionCPUCacheModeDefault];
        vertexBuffer = [device newBufferWithBytes:vertexData length:16 * 4 options:MTLResourceOptionCPUCacheModeDefault];
        yuvFormulaBuffer = [device newBufferWithBytes:yuvFormulaData length:12 * 4 options:MTLResourceOptionCPUCacheModeDefault];
    });
    return [CAMetalLayer class];
}

-(instancetype)initWithFrame:(CGRect)frameRect
{
    self = [super initWithFrame:frameRect];
    if(self)
    {
        _metalLayer = (CAMetalLayer *)self.layer;
        _metalLayer.frame = self.layer.frame;
//      _metalLayer.backgroundColor = (__bridge CGColorRef _Nullable)([UIColor redColor]);
        _metalLayer.device = device;
        _metalLayer.framebufferOnly = YES;
        _metalLayer.presentsWithTransaction = NO;

        yTextureRef = NULL;
        uvTextureRef = NULL;
        CVMetalTextureCacheCreate(kCFAllocatorDefault, NULL, device, NULL, &metalTextureCache);
        CVMetalTextureCacheFlush(metalTextureCache, 0);
    }
    return self;
}

-(void)setFrame:(CGRect)frame
{
    [super setFrame:frame];
    _metalLayer.frame = self.layer.bounds;
}

-(void)metalDraw:(CVPixelBufferRef)pixelBuffer
{
    if(CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault, metalTextureCache, pixelBuffer,
       NULL, MTLPixelFormatR8Unorm, _textureSize.width, _textureSize.height, 0, &yTextureRef) ||
       CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault, metalTextureCache, pixelBuffer,
       NULL, MTLPixelFormatRG8Unorm, _textureSize.width / 2, _textureSize.height / 2, 1, &uvTextureRef))
    {
        return;
    }
    _yTexture = CVMetalTextureGetTexture(yTextureRef);
    _uvTexture = CVMetalTextureGetTexture(uvTextureRef);

    id<MTLCommandBuffer> commandBuffer = [commandQueue commandBuffer];

    id<CAMetalDrawable> drawable = [_metalLayer nextDrawable];
    MTLRenderPassDescriptor* passDescriptor = [MTLRenderPassDescriptor renderPassDescriptor];
    passDescriptor.colorAttachments[0].texture = drawable.texture;
    id <MTLRenderCommandEncoder> commandEncoder = [commandBuffer renderCommandEncoderWithDescriptor:passDescriptor];

    [commandEncoder setRenderPipelineState:renderStateHard];

    [commandEncoder setVertexBuffer:vertexBuffer offset:0 atIndex:0];
    [commandEncoder setFragmentSamplerState:sampler atIndex:0];

    [commandEncoder setFragmentTexture:_yTexture atIndex:0];
    [commandEncoder setFragmentTexture:_uvTexture atIndex:1];

    [commandEncoder setFragmentBuffer:yuvFormulaBuffer offset:0 atIndex:0];

    [commandEncoder drawIndexedPrimitives:MTLPrimitiveTypeTriangle indexCount:6 indexType:MTLIndexTypeUInt32 indexBuffer:indexBuffer indexBufferOffset:0];

    [commandEncoder endEncoding];
    [commandBuffer presentDrawable:drawable];
    [commandBuffer commit];
}

-(void)draw:(CVPixelBufferRef)pixelBuffer
{
    size_t width = CVPixelBufferGetWidth(pixelBuffer);
    size_t height = CVPixelBufferGetHeight(pixelBuffer);
    if(width > 0 && height > 0)
    {
        if(_textureSize.width != width || _textureSize.height != height)
        {
            _textureSize = CGSizeMake(width, height);
            _metalLayer.drawableSize = _textureSize;
        }
        @autoreleasepool
        {
            [self metalDraw: pixelBuffer];
            if(yTextureRef)
            {
                CFRelease(yTextureRef);
                yTextureRef = NULL;
            }
            if(uvTextureRef)
            {
                CFRelease(uvTextureRef);
                uvTextureRef = NULL;
            }
            CVMetalTextureCacheFlush(metalTextureCache, 0);
        }
    }
}

@end
