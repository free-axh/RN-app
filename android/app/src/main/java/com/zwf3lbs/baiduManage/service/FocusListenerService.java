package com.zwf3lbs.baiduManage.service;

import android.graphics.Point;

import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.model.LatLng;

import java.util.Timer;
import java.util.TimerTask;

/**
 * 聚焦监听服务
 */
public class FocusListenerService {
    /**
     * 定时器
     */
    private Timer mTimer = null;
    /**
     * 定时器任务
     */
    private TimerTask mTimerTask = null;

    /**
     * 百度地图marker
     */
    private Marker marker = null;

    /**
     * 百度地图
     */
    private MapView mapView = null;

    /**
     * 范围
     */
    private double lengthLimit = 120*120d;

    /**
     * 起始点
     */
    private Point point = null;

    public void setMarker(Marker marker) {
        this.marker = marker;
    }

    public void setPoint(Point point) {
        this.point = point;
    }

    public void setMapView(MapView mapView) {
        this.mapView = mapView;
    }

    public void startFocus() {
        if (mTimer == null) {
            mTimer = new Timer();
        }
        if (mTimerTask == null) {
            mTimerTask = new TimerTask() {
                @Override
                public void run() {
                    if (marker != null && point!=null) {
                        if(includePoint(point)){
                            locationMapMarker();
                        }
                    }
                }
            };
        }

        if (mTimer != null && mTimerTask != null) {
            mTimer.schedule(mTimerTask, 0, 500);
        }
    }

    public void stopFocus() {
        if (mTimer != null) {
            mTimer.cancel();
            mTimer = null;
        }

        if (mTimerTask != null) {
            mTimerTask.cancel();
            mTimerTask = null;
        }
    }

    /**
     * 重新拉回定位使地图的中心定位marker的坐标位置
     */
    private void locationMapMarker(){
        LatLng position = marker.getPosition();
        MapStatus build = new MapStatus.Builder().zoom(mapView.getMap().getMapStatus().zoom).target(position).build();
        MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(build);
        mapView.getMap().animateMapStatus(mMapStatusUpdate);
    }


    /**
     * 判断是否超出范围之内
     * @return
     */
    private boolean includePoint(Point startPoint){
        int x = startPoint.x;
        int y = startPoint.y;
        int endX = mapView.getMap().getProjection().toScreenLocation(marker.getPosition()).x;
        int endY = mapView.getMap().getProjection().toScreenLocation(marker.getPosition()).y;
        double absX = Math.abs(endX - x);
        double absY = Math.abs(endY - y);
        double length = absX * absX + absY * absY;
        if(length>lengthLimit){
            return true;
        }else {
            return false;
        }
    }
}
