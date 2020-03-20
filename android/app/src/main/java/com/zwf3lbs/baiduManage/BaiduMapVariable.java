package com.zwf3lbs.baiduManage;

import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Overlay;
import com.baidu.mapapi.model.LatLng;
import com.baidu.mapapi.model.LatLngBounds;

/**
 * 百度地图全局相关静态变量
 */
public class BaiduMapVariable {
    /**
     * 视图view
     */
    public static MapView MAPVIEW;

    /**
     * 视图状态
     */
    public static Integer num;

    public static LatLngBounds.Builder builder = new LatLngBounds.Builder();

    public static float footerHeight;

    public static Overlay lastMarker;

    public static LatLng latLng;
}
