package com.zwf3lbs.baiduManage.listener;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.search.core.SearchResult;
import com.baidu.mapapi.search.route.BikingRouteResult;
import com.baidu.mapapi.search.route.DrivingRouteLine;
import com.baidu.mapapi.search.route.DrivingRouteResult;
import com.baidu.mapapi.search.route.IndoorRouteResult;
import com.baidu.mapapi.search.route.MassTransitRouteResult;
import com.baidu.mapapi.search.route.OnGetRoutePlanResultListener;
import com.baidu.mapapi.search.route.TransitRouteResult;
import com.baidu.mapapi.search.route.WalkingRouteResult;
import com.zwf3lbs.baiduManage.EventInitMethod;
import com.zwf3lbs.baiduManage.overLine.DrivingRouteOverlay;

public class RoutePlanResultListener implements OnGetRoutePlanResultListener {
    private MapView mapView;
    private BaiduMap mBaidumap;
    boolean useDefaultIcon = false;
    private EventInitMethod eventInitMethod;

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
    public void onGetWalkingRouteResult(WalkingRouteResult walkingRouteResult) {

    }

    @Override
    public void onGetTransitRouteResult(TransitRouteResult transitRouteResult) {

    }

    @Override
    public void onGetMassTransitRouteResult(MassTransitRouteResult massTransitRouteResult) {

    }

    /**
     * 驾车路线规划
     *
     * @param result
     */
    @Override
    public void onGetDrivingRouteResult(DrivingRouteResult result) {
        if (result!=null&&result.error== SearchResult.ERRORNO.NO_ERROR) {
            DrivingRouteLine drivingRouteLine = result.getRouteLines().get(0);
            mBaidumap=mapView.getMap();
            DrivingRouteOverlay overlay = new MyDrivingRouteOverlay(mBaidumap);
            overlay.setData(result.getRouteLines().get(0));
            overlay.addToMap();
            overlay.zoomToSpan();
            int distance = drivingRouteLine.getDistance();
            eventInitMethod.sendOnPlanDistance(mapView,distance+"");
        }
    }

    @Override
    public void onGetIndoorRouteResult(IndoorRouteResult indoorRouteResult) {

    }

    @Override
    public void onGetBikingRouteResult(BikingRouteResult bikingRouteResult) {

    }

    // 定制RouteOverly
    private class MyDrivingRouteOverlay extends DrivingRouteOverlay {

        public MyDrivingRouteOverlay(BaiduMap baiduMap) {
            super(baiduMap);
        }

        @Override
        public BitmapDescriptor getStartMarker() {
            return super.getStartMarker();
        }

        @Override
        public BitmapDescriptor getTerminalMarker() {
            return super.getTerminalMarker();
        }
    }
}
