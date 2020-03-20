package com.zwf3lbs.uitl;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Point;
import android.location.Location;
import android.location.LocationManager;
import android.support.v4.app.ActivityCompat;

import com.baidu.location.LocationClient;
import com.baidu.location.LocationClientOption;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.model.LatLng;
import com.blankj.utilcode.util.ScreenUtils;
import com.zwf3lbs.baiduManage.BaiduMapVariable;
import com.zwf3lbs.baiduManage.MyItem;
import com.zwf3lbs.baiduManage.listener.MapClickListener;
import com.zwf3lbs.baiduManage.listener.MarkerClickListener;
import com.zwf3lbs.clusterutil.clustering.ClusterManager;

import java.util.List;

/**
 * 地图通用处理方法
 */
public class CommonMapUtil {
    /**
     * 北京经度
     */
    private static double lat = 39.914884096217335;
    /**
     * 北京维度
     */
    private static double lng = 116.40388321804957;

    /**
     * 初始化定位信息参数
     */
    public static void initLocationParam(LocationClient mLocationClient) {
        LocationClientOption option = new LocationClientOption();
        option.setLocationMode(LocationClientOption.LocationMode.Hight_Accuracy);//可选，默认高精度，设置定位模式，高精度，低功耗，仅设备
        option.setCoorType("bd09ll");//可选，默认gcj02，设置返回的定位结果坐标系
        int span = 0;
        option.setScanSpan(span);//可选，默认0，即仅定位一次，设置发起定位请求的间隔需要大于等于1000ms才是有效的
        option.setIsNeedAddress(true);//可选，设置是否需要地址信息，默认不需要
        option.setOpenGps(true);//可选，默认false,设置是否使用gps
        option.setLocationNotify(true);//可选，默认false，设置是否当GPS有效时按照1S/1次频率输出GPS结果
        option.setIsNeedLocationDescribe(true);//可选，默认false，设置是否需要位置语义化结果，可以在BDLocation
        // .getLocationDescribe里得到，结果类似于“在北京天安门附近”
        option.setIsNeedLocationPoiList(true);//可选，默认false，设置是否需要POI结果，可以在BDLocation.getPoiList里得到
        option.setIgnoreKillProcess(false);
        option.setOpenGps(true); // 打开gps
        //可选，默认true，定位SDK内部是一个SERVICE，并放到了独立进程，设置是否在stop的时候杀死这个进程，默认不杀死
        option.SetIgnoreCacheException(false);//可选，默认false，设置是否收集CRASH信息，默认收集
        option.setEnableSimulateGps(false);//可选，默认false，设置是否需要过滤GPS仿真结果，默认需要
        mLocationClient.setLocOption(option);
    }

    /**
     * 初始化地图监听器
     * @param mapView
     * @param mClusterManager
     * @param markerClickListener
     * @param mapClickListener
     */
    public static void initMapListener(MapView mapView, ClusterManager<MyItem> mClusterManager,
                                       MarkerClickListener markerClickListener,
                                       MapClickListener mapClickListener){
        // 地图状态变化监听
        mapView.getMap().setOnMapStatusChangeListener(mClusterManager);
        // 地图加载完成监听
        mapView.getMap().setOnMapLoadedCallback(mClusterManager);
        // 地图marker点击事件监听
        mapView.getMap().setOnMarkerClickListener(markerClickListener);
        // 地图点击事件监听
        mapView.getMap().setOnMapClickListener(mapClickListener);

    }
    /**
     * 地图ui组件初始化
     */
    public static void initMapController(MapView mapView, boolean flag){
        mapView.showZoomControls(flag);
        mapView.showScaleControl(flag);
    }
    /**
     * 默认位置初始化
     * @param mapView
     * @param locationLatLng
     */
    public static void initDefaultLocation(MapView mapView,LatLng locationLatLng) {
        if (locationLatLng == null || locationLatLng.equals("")) {
            return;
        }
        localCenterPoint(mapView,locationLatLng,18);
    }
    /**
     * 是否marker开启近大远小效果
     * @param mapView
     * @param flag true:开启 false:关闭
     */
    public static void initMarkerEffect(MapView mapView,boolean flag){
        mapView.getMap().getUiSettings().setOverlookingGesturesEnabled(flag);
    }
    /**
     * 初始化罗盘位置
     * @param mapView
     */
    public static void initCompassLocation(MapView mapView,Point point) {
        if(point==null) {
            int screenWidth = ScreenUtils.getScreenWidth();
            int screenHeight = ScreenUtils.getScreenHeight();
            Point defaultPoint = new Point(screenWidth / 10, screenHeight / 6);
            mapView.getMap().setCompassPosition(defaultPoint);
        }else {
            mapView.getMap().setCompassPosition(point);
        }
    }
    /**
     * 重设地图位置北京
     * @param mapView
     */
    public static void resetLocation(MapView mapView, Context context) {
        LatLng latLng1;
        //1.获取位置管理器
        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        //2.获取位置提供器，GPS或是NetWork
        List<String> providers = locationManager.getProviders(true);
        String locationProvider = null;
        if (providers.contains(LocationManager.NETWORK_PROVIDER)) {
            //如果是网络定位
            locationProvider = LocationManager.NETWORK_PROVIDER;
        } else if (providers.contains(LocationManager.GPS_PROVIDER)) {
            //如果是GPS定位
            locationProvider = LocationManager.GPS_PROVIDER;
        } else if (providers.contains(LocationManager.PASSIVE_PROVIDER)) {
            //如果是PASSIVE定位
            locationProvider = LocationManager.PASSIVE_PROVIDER;
        }
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            latLng1 = new LatLng(lat, lng);
        } else {
            Location location = locationManager.getLastKnownLocation(locationProvider);
            if (location != null) {
                latLng1 = new LatLng(location.getLatitude(), location.getLongitude());
            } else {
                latLng1 = new LatLng(lat, lng);
            }
        }
        MapStatus mMapStatus = new MapStatus.Builder()
                //要移动的点
                .target(latLng1)
                //放大地图到20倍
                .zoom(12)
                .build();
        //定义MapStatusUpdate对象，以便描述地图状态将要发生的变化
        MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(mMapStatus);
        //改变地图状态
        mapView.getMap().animateMapStatus(mMapStatusUpdate);
    }

    /**
     * 初始化地图在2/3的位置
     * @param mapView
     * @param latLng
     * @param currentZoomSize
     */
    public static void localCenterPoint(MapView mapView, LatLng latLng, float currentZoomSize) {
        MapStatus.Builder builder = new MapStatus.Builder();
        builder.targetScreen(getScreenPoint());
        mapView.getMap().setMapStatus(MapStatusUpdateFactory.newMapStatus(builder.build()));
        MapStatusUpdate u = MapStatusUpdateFactory.newLatLng(latLng);
        mapView.getMap().setMapStatus(u);
        MapStatus mMapStatus = new MapStatus.Builder()
                //要移动的点
                .target(latLng)
                //放大地图到20倍
                .zoom(currentZoomSize)
                .build();
        //定义MapStatusUpdate对象，以便描述地图状态将要发生的变化
        MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(mMapStatus);
        //改变地图状态
        mapView.getMap().animateMapStatus(mMapStatusUpdate);
    }
    /**
     * 获得屏幕中心点
     *
     * @return
     */
    public static Point getScreenPoint() {
        int screenHeight = ScreenUtils.getScreenHeight();
        int screenWidth = ScreenUtils.getScreenWidth();
        Point point = new Point(screenWidth / 2, screenHeight / 3);
        return point;
    }

    /**
     * 定位屏幕中心点
     * @param mapView
     * @param latLng
     * @param zoomLimit
     */
    public static void locationCenter(MapView mapView, LatLng latLng, float zoomLimit) {
        MapStatus mMapStatus = new MapStatus.Builder()
                //要移动的点
                .target(latLng)
                //放大地图到20倍
                .zoom(zoomLimit)
                .build();
        //定义MapStatusUpdate对象，以便描述地图状态将要发生的变化
        MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(mMapStatus);
        //改变地图状态
        mapView.getMap().animateMapStatus(mMapStatusUpdate);
    }

    /**
     * 适应屏幕
     * @param mapView
     */
    public static void adaptScreen(MapView mapView) {
        if (BaiduMapVariable.builder != null) {
            MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(BaiduMapVariable.builder.build(), ScreenUtils.getScreenWidth(), ScreenUtils.getScreenHeight());
            mapView.getMap().setMapStatus(mapStatusUpdate);
        }
    }
}
