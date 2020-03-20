package com.zwf3lbs.baiduManage;

import android.util.Log;

import com.baidu.lbsapi.panoramaview.PanoramaView;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * 事件方法初始化
 */
public class EventInitMethod {

    private MapView mapView;

    private ThemedReactContext mReactContext;
    private ThemedReactContext mReactContext2;

    private PanoramaView panoramaView;

    public EventInitMethod(MapView mapView, ThemedReactContext mReactContext) {
        this.mapView = mapView;
        this.mReactContext = mReactContext;
    }
    public EventInitMethod(PanoramaView panoramaView,ThemedReactContext mReactContext) {
        this.panoramaView = panoramaView;
        this.mReactContext2 = mReactContext;
    }

    public ReactContext getReactContext(){
        return this.mReactContext;
    }

//    /**
//     * 事件发送v1 demo
//     */
//    public void onReceiveNativeEvent(MapView mapView) {
//        WritableMap event = Arguments.createMap();
//        event.putString("data", "MyMessage");
//        ReactContext reactContext = mReactContext;
//        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
//                mapView.getId(), "topChange", event);
//    }
    /**
     * 定位权限发送到页面
     */
    public void sendLocaionInfo(MapView mapView) {
        WritableMap event = Arguments.createMap();
        event.putString("data", "location");
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "location", event);
    }
    /**
     * 地图可视区域范围内的监控对象信息
     */
    public void sendOnInAreaOptions(MapView mapView, WritableArray json, ReactContext context) {
        WritableMap event = Arguments.createMap();
        event.putArray("data", json);
        ReactContext reactContext = context;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onInAreaOptionsAPP", event);
    }

    /**
     * 逆地址查询
     */
    public void sendOnAddress(MapView mapView,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onAddressAPP", event);
    }
    /**
     * 地图点击后触发事件
     */
    public void sendOnMapClick(MapView mapView, String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onMapClickAPP", event);
    }
    /**
     * 地图初始化成功事件
     */
    public void sendOnMapInitFinsh(MapView mapView ,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onMapInitFinshAPP", event);
    }
    /**
     * 路径规划距离返回
     */
    public void sendOnPlanDistance(MapView mapView ,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onPlanDistanceAPP", event);
    }
    /**
     * 定位成功或失败事件
     */
    public void sendOnLocationSuccess(MapView mapView, String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onLocationSuccessAPP", event);
    }
    /**
     * 地图标注物点击事件（返回当前点击的监控对象id）
     */
    public void sendOnPointClickEvent(MapView mapView,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onPointClickEventAPP", event);
    }

    /**
     * 地图聚合图标点击事件（返回当前点击的聚合的监控对象id，名字，状态）
     */
    public void onClustersClickEvent(MapView mapView,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onClustersClickEventAPP", event);
    }

    /**
     * 历史轨迹停止点点击事件（返回该停止点的数据）
     */
    public void onStopPointDataEvent(MapView mapView, VehicleParkEntity vehicleParkEntity, Marker marker) {
        WritableMap event = Arguments.createMap();
        event.putString("address", vehicleParkEntity.getAddress());
        event.putInt("index",vehicleParkEntity.getNumber());
        ReactContext reactContext = mReactContext;
        BaiduMapViewManager.parkIndex = vehicleParkEntity.getNumber();
        Log.e("onStopPointDataEvent: ", event.toString());
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onStopPointDataEventAPP", event);
    }

    /**
     * 历史轨迹停止点点击事件（返回该停止点的数据）
     */
    public void onStopPointIndexEvent(MapView mapView, VehicleParkEntity vehicleParkEntity) {
        WritableMap event = Arguments.createMap();
        ReactContext reactContext = mReactContext;
        event.putInt("index", vehicleParkEntity.getNumber());
        Log.e("onStopPointIndexEvent: ", event.toString());
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onStopPointIndexEventAPP", event);
    }

    /**
     * 取消聚焦
     */
    public void sendOnMonitorLoseFocus(MapView mapView,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onMonitorLoseFocusAPP", event);
    }
    /**
     * 比例尺相关信息
     */
    public void sendOnMyScale(MapView mapView,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                mapView.getId(), "onMyScaleAPP", event);
    }

    /**
     * 全景视图关闭
     * @param panoramaView
     * @param json
     */
    public void sendOnPanoramaClose(PanoramaView panoramaView,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext2;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                panoramaView.getId(), "onPanoramaCloseAPP", event);
    }
    /**
     * 全景视图加载成功
     * @param panoramaView
     * @param json
     */
    public void sendOnPanoramaSuccess(PanoramaView panoramaView,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext2;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                panoramaView.getId(), "onPanoramaSuccessAPP", event);
    }
    /**
     * 全景视图加载失败
     * @param panoramaView
     * @param json
     */
    public void sendnOnPanoramaFailed(PanoramaView panoramaView,String json) {
        WritableMap event = Arguments.createMap();
        event.putString("data", json);
        ReactContext reactContext = mReactContext2;
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                panoramaView.getId(), "onPanoramaFailedAPP", event);
    }
}
