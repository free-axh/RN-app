package com.zwf3lbs.panorama;

import android.content.Context;
import android.util.Log;
import android.view.View;

import com.baidu.lbsapi.BMapManager;
import com.baidu.lbsapi.panoramaview.PanoramaView;
import com.baidu.lbsapi.panoramaview.PanoramaViewListener;
import com.baidu.mapapi.SDKInitializer;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.zwf3lbs.baiduManage.EventInitMethod;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.Map;

public class MyPanoramaView extends SimpleViewManager<MyInstanceView> {
    public BMapManager mBMapManager = null;
    /**
     * 全景地图view
     */
    private PanoramaView mPanoView;
    /**
     * 应用上下文
     */
    private Context context;
    /**
     * react类标记
     */
    private static final String REACT_CLASS = "BaiduPanoView";

    /**
     * 日志tag
     */
    private static final String TAG = "BaiduMapViewManager";

    private MyInstanceView myInstanceView;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    /**
     * 事件方法初始化
     */
    private EventInitMethod eventInitMethod;

    /**
     * 上下文初始化
     *
     * @param context
     */
    public void initSDK(Context context) {
        Log.i(TAG, "context初始化:" + context);
        this.context = context;
        if (mBMapManager == null) {
            mBMapManager = new BMapManager(context);
        }
        SDKInitializer.initialize(context);
    }

    @Override
    protected MyInstanceView createViewInstance(ThemedReactContext mReactContext) {
        Log.i(TAG, "customPanoView初始化:" + context);
        mPanoView = new PanoramaView(context);
        myInstanceView = new MyInstanceView(context);
        eventInitMethod = new EventInitMethod(mPanoView, mReactContext);
        myInstanceView.initView();
        return myInstanceView;
    }

    /**
     * 初始化全景地图
     */
    @ReactProp(name = "customPanoView")
    public void setCustomPanoView(final PanoramaView panoramaView, ReadableMap readableMap){
        Log.i(TAG, "customPanoView"+readableMap);
        if(readableMap ==null){
            return;
        }
        PanoramaView mPanoView = myInstanceView.findViewById(R.id.panorama);
        double lat = readableMap.getDouble("latitude");
        double lon = readableMap.getDouble("longitude");
        String title = readableMap.getString("title");
        if(title !=null){
            myInstanceView.setTextViewContent(title);
        }
        mPanoView.setPanoramaImageLevel(PanoramaView.ImageDefinition.ImageDefinitionHigh);
        mPanoView.setPanorama(lon, lat, PanoramaView.COORDTYPE_BD09LL);
        myInstanceView.getView().findViewById(R.id.bt1).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.i(TAG, "customPanoView点击事件V:" );
                myInstanceView.destroy();
                eventInitMethod.sendOnPanoramaClose(panoramaView,"true");
            }
        });
        mPanoView.setPanoramaViewListener(new PanoramaViewListener() {
            @Override
            public void onDescriptionLoadEnd(String s) {

            }

            @Override
            public void onLoadPanoramaBegin() {

            }

            @Override
            public void onLoadPanoramaEnd(String s) {
                eventInitMethod.sendOnPanoramaSuccess(panoramaView,"true");
            }

            @Override
            public void onLoadPanoramaError(String s) {
                eventInitMethod.sendnOnPanoramaFailed(panoramaView,"true");
            }

            @Override
            public void onMessage(String s, int i) {

            }

            @Override
            public void onCustomMarkerClick(String s) {

            }

            @Override
            public void onMoveStart() {

            }

            @Override
            public void onMoveEnd() {

            }
        });
    }
    /**
     * 构建事件交互信息
     *
     * @return
     */
    public Map getExportedCustomBubblingEventTypeConstants() {
        Map<Object, Object> build = MapBuilder.builder()
                .put(
                        "onPanoramaCloseAPP",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onPanoramaClose")))
                .build();
        /**
         * 返回地图可视区域范围内的监控对象信息
         */
        build.put("onPanoramaFailedAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onPanoramaFailed")));
        /**
         * 返回地图可视区域范围内的监控对象信息
         */
        build.put("onPanoramaSuccessAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onPanoramaSuccess")));
        return build;
    }

}
