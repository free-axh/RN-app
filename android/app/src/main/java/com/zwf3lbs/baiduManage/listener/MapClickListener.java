package com.zwf3lbs.baiduManage.listener;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.MapPoi;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.baiduManage.EventInitMethod;
import com.zwf3lbs.baiduManage.VehicleParkEntity;

public class MapClickListener extends MyListener implements BaiduMap.OnMapClickListener {
    private EventInitMethod eventInitMethod;
    private MapView mapView;

    public EventInitMethod getEventInitMethod() {
        return eventInitMethod;
    }

    public void setEventInitMethod(EventInitMethod eventInitMethod) {
        this.eventInitMethod = eventInitMethod;
    }

    public MapView getMapView() {
        return mapView;
    }

    public void setMapView(MapView mapView) {
        this.mapView = mapView;
    }

    @Override
    public void onMapClick(LatLng latLng) {
        eventInitMethod.sendOnMapClick(mapView,"json");
        //停止点点击地图时关闭
        VehicleParkEntity vehicleParkEntity = new VehicleParkEntity();
        vehicleParkEntity.setNumber(-1);
        eventInitMethod.onStopPointIndexEvent(mapView, vehicleParkEntity);
    }

    @Override
    public boolean onMapPoiClick(MapPoi mapPoi) {
        return false;
    }


}
