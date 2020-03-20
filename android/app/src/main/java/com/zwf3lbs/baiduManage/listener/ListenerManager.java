package com.zwf3lbs.baiduManage.listener;

import com.baidu.mapapi.map.MapView;
import com.zwf3lbs.baiduManage.EventInitMethod;

public class ListenerManager  {
    /**
     * marker监听器
     */
    private String markerListener = "marker";
    /**
     * map监听器
     */
    private String mapListener = "map";
    /**
     * nativeLocation 原生定位监听器
     */
    private String nativeLocationListener = "nativeLocation";
    private EventInitMethod eventInitMethod;
    private MapView mapView;
    public void  init(EventInitMethod eventInitMethod,MapView mapView){
        this.eventInitMethod = eventInitMethod;
        this.mapView = mapView;
    }

    /**
     * 获取监听器
     * @param listener
     * @return
     */
    public  <T extends MyListener> T getListener(String listener){
        if(listener.equals(markerListener)){
            return getMarkerClickListener();
        }else if(listener.equals(mapListener)){
            return getMapClickListener();
        }else if(listener.equals(nativeLocationListener)){
            return getNativeListener();
        }
        return null;

    }


    /**
     * 获取marker点击监听
     * @param <T>
     * @return
     */
    private <T extends MyListener> T getMarkerClickListener() {
        MarkerClickListener markerClickListener = new MarkerClickListener();
        markerClickListener.setMapView(mapView);
        markerClickListener.setEventInitMethod(eventInitMethod);
        return (T)markerClickListener;
    }

    /**
     * 获取地图点击监听
     * @param <T>
     * @return
     */
    private <T extends MyListener> T getMapClickListener() {
        MapClickListener mapClickListener = new MapClickListener();
        mapClickListener.setEventInitMethod(eventInitMethod);
        mapClickListener.setMapView(mapView);
        return (T)mapClickListener;
    }
    /**
     * 获取地图点击监听
     * @param <T>
     * @return
     */
    private <T extends MyListener> T getNativeListener() {
        NativeLocationListener nativeLocationListener = new NativeLocationListener();
        return (T)nativeLocationListener;
    }
}
