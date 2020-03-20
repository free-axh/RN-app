package com.zwf3lbs.baiduManage.listener;

import android.os.Bundle;
import android.util.Log;

import com.alibaba.fastjson.JSON;
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.zwf3lbs.baiduManage.BaiduMapViewManager;
import com.zwf3lbs.baiduManage.CommonUtil;
import com.zwf3lbs.baiduManage.EventInitMethod;
import com.zwf3lbs.baiduManage.VehicleParkEntity;

public class MarkerClickListener extends MyListener implements BaiduMap.OnMarkerClickListener {
    private MapView mapView;
    private EventInitMethod eventInitMethod;

    public MapView getMapView() {
        return mapView;
    }

    public void setMapView(MapView mapView) {
        this.mapView = mapView;
    }

    public EventInitMethod getEventInitMethod() {
        return eventInitMethod;
    }

    public void setEventInitMethod(EventInitMethod eventInitMethod) {
        this.eventInitMethod = eventInitMethod;
    }

    @Override
    public boolean onMarkerClick(Marker marker) {
        Bundle extraInfo = marker.getExtraInfo();
        if(extraInfo==null){
            return false;
        }
        String monitorInfos = extraInfo.getString("monitorInfos");
        String markerId = extraInfo.getString("marketId");
        String vehicleParkEntityStr = extraInfo.getString("vehicleParkEntity");
        if(markerId!=null && !markerId.equals("")){
            Log.e("markerId", markerId );
            eventInitMethod.sendOnPointClickEvent(mapView,markerId);
        }

        if (monitorInfos != null && !monitorInfos.equals("")) {
            Log.e("monitorInfos", monitorInfos);
            eventInitMethod.onClustersClickEvent(mapView,monitorInfos);
        }

        if(vehicleParkEntityStr !=null && !vehicleParkEntityStr.equals("")){

            Marker oldMarker =  BaiduMapViewManager.historyParkMap.get(BaiduMapViewManager.parkIndex);
            if (oldMarker != null) {
                oldMarker.setIcon(CommonUtil.createParkIco(eventInitMethod.getReactContext()));
            }
            marker.setIcon(CommonUtil.createCheckParkIco(eventInitMethod.getReactContext()));
            marker.setToTop();

            Log.e("vehicleParkEntityStr", vehicleParkEntityStr);
            VehicleParkEntity vehicleParkEntity = JSON.parseObject(vehicleParkEntityStr, VehicleParkEntity.class);
            CommonUtil commonUtil = new CommonUtil();
            String location = "&location=" + vehicleParkEntity.getLatitude() + "," + vehicleParkEntity.getLongitude();
            commonUtil.setLatLng(location);
            commonUtil.setMapView(mapView);
            commonUtil.stopPoint(eventInitMethod,vehicleParkEntity,marker);
            eventInitMethod.onStopPointIndexEvent(mapView, vehicleParkEntity);
        }

        return false;
    }
}
