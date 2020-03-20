/*
 * Copyright (C) 2015 Baidu, Inc. All Rights Reserved.
 */

package com.zwf3lbs.clusterutil.clustering;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.BitmapDescriptorFactory;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.MarkerOptions;
import com.baidu.mapapi.model.LatLng;
import com.baidu.mapapi.model.LatLngBounds;
import com.bumptech.glide.Glide;
import com.bumptech.glide.RequestManager;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.target.Target;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.uimanager.ThemedReactContext;
import com.zwf3lbs.baiduManage.CommonUtil;
import com.zwf3lbs.baiduManage.EventInitMethod;
import com.zwf3lbs.baiduManage.VehicleEntity;
import com.zwf3lbs.baiduManage.service.FocusListenerService;
import com.zwf3lbs.baiduManage.service.MyScaleService;
import com.zwf3lbs.clusterutil.MarkerManager;
import com.zwf3lbs.clusterutil.clustering.algo.Algorithm;
import com.zwf3lbs.clusterutil.clustering.algo.NonHierarchicalDistanceBasedAlgorithm;
import com.zwf3lbs.clusterutil.clustering.algo.PreCachingAlgorithmDecorator;
import com.zwf3lbs.clusterutil.clustering.view.ClusterRenderer;
import com.zwf3lbs.clusterutil.clustering.view.DefaultClusterRenderer;
import com.zwf3lbs.myview.MyScaleView;
import com.zwf3lbs.uitl.CommonMapUtil;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

import javax.annotation.Nullable;

/**
 * Groups many items on a map based on zoom level.
 * <p/>
 * ClusterManager should be added to the map
 * <li>
 */
public class ClusterManager<T extends ClusterItem> implements
        BaiduMap.OnMapStatusChangeListener, BaiduMap.OnMarkerClickListener, BaiduMap.OnMapLoadedCallback {
    private final static String TAG = "ClusterManager";
    private final MarkerManager mMarkerManager;
    private final MarkerManager.Collection mMarkers;
    private final MarkerManager.Collection mClusterMarkers;
    private MyScaleView scaleView;
    private Algorithm<T> mAlgorithm;
    private MyScaleService myScaleService;
    public Algorithm<T> getmAlgorithm() {
        return mAlgorithm;
    }

    public void setmAlgorithm(Algorithm<T> mAlgorithm) {
        this.mAlgorithm = mAlgorithm;
    }

    private final ReadWriteLock mAlgorithmLock = new ReentrantReadWriteLock();
    private ClusterRenderer<T> mRenderer;

    private BaiduMap mMap;
    private MapStatus mPreviousCameraPosition;
    private ClusterTask mClusterTask;
    private final ReadWriteLock mClusterTaskLock = new ReentrantReadWriteLock();

    private OnClusterItemClickListener<T> mOnClusterItemClickListener;
    private OnClusterInfoWindowClickListener<T> mOnClusterInfoWindowClickListener;
    private OnClusterItemInfoWindowClickListener<T> mOnClusterItemInfoWindowClickListener;
    private OnClusterClickListener<T> mOnClusterClickListener;
    private String markerId;
    private String centerMarketId;
    private Integer aggrNum = 50;
    private FocusListenerService focusListenerService;
    private boolean focusListenerServiceFlag = false;
    private Marker focusMarker = null;

    /**
     * 当前聚焦的markerId
     */
    private String focusMarkerId;
    private String focusMarkerIdV2;

    public String getFocusMarkerIdV2() {
        return focusMarkerIdV2;
    }

    public void setFocusMarkerIdV2(String focusMarkerIdV2) {
        this.focusMarkerIdV2 = focusMarkerIdV2;
    }

    public void setFocusMarkerId(String focusMarkerId) {
        this.focusMarkerId = focusMarkerId;
    }

    /**
     * 8
     * 是否聚合
     */
    private boolean cLusterFlag = false;

    public boolean iscLusterFlag() {
        return cLusterFlag;
    }

    public void setcLusterFlag(boolean cLusterFlag) {
        this.cLusterFlag = cLusterFlag;
    }

    public void setCenterMarketId(String centerMarketId) {
        this.centerMarketId = centerMarketId;
    }

    public String getCenterMarketId() {
        return centerMarketId;
    }

    public String getMarkerId() {
        return markerId;
    }

    public void setMarkerId(String markerId) {
        this.markerId = markerId;
    }

    private boolean centerFlag;

    public boolean isCurrentZoom() {
        return currentZoom;
    }

    public void setCurrentZoom(boolean currentZoom) {
        this.currentZoom = currentZoom;
    }

    private boolean currentZoom;


    public boolean isCenterFlag() {
        return centerFlag;
    }

    public void setCenterFlag(boolean centerFlag) {
        this.centerFlag = centerFlag;
    }

    /**
     * 车辆状态图标宽度
     */
    private int widthIco = 200;

    /**
     * 车辆状态图标高度
     */
    private int heightIco = 85;

    /**
     * react上下文
     */
    private ThemedReactContext mReactContext;

    /**
     * 当前动作状态 1:marker功能 2:定位 3:拖拽 4:缩放
     */
    private Integer actionStatus;

    /**
     * 屏幕中心点经纬度
     */
    private LatLng centreLatLng;

    /**
     * 车辆全局A对象
     */
    public static List<VehicleEntity> vehicleEntityListAll = new ArrayList<>();

    public void setMyScaleService(MyScaleService myScaleService) {
        this.myScaleService = myScaleService;
    }

    /**
     * 当前屏幕范围内B对象
     */
    public static HashMap<String, Object> vehicleEntityListScreen = new HashMap<>();

    /**
     * 当前页面 0:主页 1:历史轨迹 2:实时尾迹
     */
    private int currentView = 0;

    /**
     * markerHash数组
     */
    private HashMap<String, Object> markerHashMap = new HashMap<>();

    /**
     * markerHashTemp数组
     */
    private HashMap<String, Object> tempHashMap = new HashMap<>();

    public HashMap<String, Object> getTempHashMap() {
        return tempHashMap;
    }

    public void setTempHashMap(HashMap<String, Object> tempHashMap) {
        this.tempHashMap = tempHashMap;
    }

    /**
     * 应用上下文
     */
    private Context context;
    /**
     * 小车平滑移动线程
     */
    EventInitMethod eventInitMethod = null;

    private Float localZoom;

    /**
     * 视图view
     */
    private MapView mapView;

    private List<LatLng> listLatLng;

    public List<LatLng> getListLatLng() {
        return listLatLng;
    }

    public void setListLatLng(List<LatLng> listLatLng) {
        this.listLatLng = listLatLng;
    }

    public void setFocusListenerService(FocusListenerService focusListenerService) {
        this.focusListenerService = focusListenerService;
    }

    public int getWidthIco() {
        return widthIco;
    }

    public void setWidthIco(int widthIco) {
        this.widthIco = widthIco;
    }

    public int getHeightIco() {
        return heightIco;
    }

    public void setHeightIco(int heightIco) {
        this.heightIco = heightIco;
    }

    public ThemedReactContext getmReactContext() {
        return mReactContext;
    }

    public void setmReactContext(ThemedReactContext mReactContext) {
        this.mReactContext = mReactContext;
    }

    public Integer getActionStatus() {
        return actionStatus;
    }

    public void setActionStatus(Integer actionStatus) {
        this.actionStatus = actionStatus;
    }

    public LatLng getCentreLatLng() {
        return centreLatLng;
    }

    public void setCentreLatLng(LatLng centreLatLng) {
        this.centreLatLng = centreLatLng;
    }

    public List<VehicleEntity> getVehicleEntityListAll() {
        return vehicleEntityListAll;
    }

    public void setVehicleEntityListAll(List<VehicleEntity> vehicleEntityListAll) {
        this.vehicleEntityListAll = vehicleEntityListAll;
    }

    public HashMap<String, Object> getVehicleEntityListScreen() {
        return vehicleEntityListScreen;
    }

    public void setVehicleEntityListScreen(HashMap<String, Object> vehicleEntityListScreen) {
        this.vehicleEntityListScreen = vehicleEntityListScreen;
    }

    public int getCurrentView() {
        return currentView;
    }

    public void setCurrentView(int currentView) {
        this.currentView = currentView;
    }

    public HashMap<String, Object> getMarkerHashMap() {
        return markerHashMap;
    }

    public void setMarkerHashMap(HashMap<String, Object> markerHashMap) {
        this.markerHashMap = markerHashMap;
    }

    public Context getContext() {
        return context;
    }

    public void setContext(Context context) {
        this.context = context;
    }

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


    public ClusterManager(Context context, BaiduMap map) {
        this(context, map, new MarkerManager(map));
    }

    public ClusterManager(Context context, BaiduMap map, MarkerManager markerManager) {
        mMap = map;
        mMarkerManager = markerManager;
        mClusterMarkers = markerManager.newCollection();
        mMarkers = markerManager.newCollection();
        mRenderer = new DefaultClusterRenderer<T>(context, map, this);
        mAlgorithm = new PreCachingAlgorithmDecorator<T>(new NonHierarchicalDistanceBasedAlgorithm<T>());
        mClusterTask = new ClusterTask();
        mRenderer.onAdd();
    }

    public MarkerManager.Collection getMarkerCollection() {
        return mMarkers;
    }

    public MarkerManager.Collection getClusterMarkerCollection() {
        return mClusterMarkers;
    }

    public MarkerManager getMarkerManager() {
        return mMarkerManager;
    }

    public void setRenderer(ClusterRenderer<T> view) {
        mRenderer.setOnClusterClickListener(null);
        mRenderer.setOnClusterItemClickListener(null);
        mClusterMarkers.clear();
        mMarkers.clear();
        mRenderer.onRemove();
        mRenderer = view;
        mRenderer.onAdd();
        mRenderer.setOnClusterClickListener(mOnClusterClickListener);
        mRenderer.setOnClusterInfoWindowClickListener(mOnClusterInfoWindowClickListener);
        mRenderer.setOnClusterItemClickListener(mOnClusterItemClickListener);
        mRenderer.setOnClusterItemInfoWindowClickListener(mOnClusterItemInfoWindowClickListener);
        cluster();
    }

    public void setAlgorithm(Algorithm<T> algorithm) {
        mAlgorithmLock.writeLock().lock();
        try {
            if (mAlgorithm != null) {
                algorithm.addItems(mAlgorithm.getItems());
            }
            mAlgorithm = new PreCachingAlgorithmDecorator<T>(algorithm);
        } finally {
            mAlgorithmLock.writeLock().unlock();
        }
        cluster();
    }

    public void clearItems() {
        mAlgorithmLock.writeLock().lock();
        try {
            mAlgorithm.clearItems();
        } finally {
            mAlgorithmLock.writeLock().unlock();
        }
    }

    public void addItems(Collection<T> items) {
        mAlgorithmLock.writeLock().lock();
        try {
            mAlgorithm.addItems(items);
        } finally {
            mAlgorithmLock.writeLock().unlock();
        }

    }

    public void addItem(T myItem) {
        mAlgorithmLock.writeLock().lock();
        try {
            mAlgorithm.addItem(myItem);
        } finally {
            mAlgorithmLock.writeLock().unlock();
        }
    }

    public void removeItem(T item) {
        mAlgorithmLock.writeLock().lock();
        try {
            mAlgorithm.removeItem(item);
        } finally {
            mAlgorithmLock.writeLock().unlock();
        }
    }

    /**
     * Force a re-cluster. You may want to call this after adding new item(s).
     */
    public void cluster() {
        mClusterTaskLock.writeLock().lock();
        try {
            // Attempt to cancel the in-flight request.
            mClusterTask.cancel(true);
            mClusterTask = new ClusterTask();

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.HONEYCOMB) {
                mClusterTask.execute(mMap.getMapStatus().zoom);
            } else {
                mClusterTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, mMap.getMapStatus().zoom);
            }
        } finally {
            mClusterTaskLock.writeLock().unlock();
        }
    }


    @Override
    public void onMapStatusChangeStart(MapStatus mapStatus) {

    }

    @Override
    public void onMapStatusChangeStart(MapStatus status, int reason) {

    }

    @Override
    public void onMapStatusChange(MapStatus mapStatus) {
    }

    @Override
    public void onMapStatusChangeFinish(MapStatus mapStatus) {
        // 发送比例尺信息
        if(mapView.getMap().getMapStatus()!=null) {
            eventInitMethod.sendOnMyScale(mapView, myScaleService.getScaleInfo(mapView));
        }
        if (currentView == 0) {
            if (mapStatus.zoom <= 14 || loadScreen(mapStatus).size() > aggrNum) {
                cLusterFlag = true;
                Iterator<Map.Entry<String, Object>> iterator = markerHashMap.entrySet().iterator();
                while (iterator.hasNext()) {
                    Map.Entry<String, Object> next = iterator.next();
                    if (next.getValue().equals("temp")) {
                        continue;
                    }
                    List<Marker> value = (List<Marker>) next.getValue();
                    for (Marker marker : value) {
                        marker.setVisible(false);
                    }
                }
                Iterator<Map.Entry<String, Object>> tempIterator = tempHashMap.entrySet().iterator();
                while (tempIterator.hasNext()) {
                    Map.Entry<String, Object> next = tempIterator.next();
                    List<Marker> value = (List<Marker>) next.getValue();
                    for (Marker marker : value) {
                        marker.setVisible(false);
                    }
                }
                for (Marker marker : this.mClusterMarkers.getMarkers()) {
                    marker.setVisible(true);
                }
                if (mRenderer instanceof BaiduMap.OnMapStatusChangeListener) {
                    ((BaiduMap.OnMapStatusChangeListener) mRenderer).onMapStatusChange(mapStatus);
                }
                MapStatus position = mMap.getMapStatus();
                if (mPreviousCameraPosition != null && mPreviousCameraPosition.zoom == position.zoom) {
                    return;
                }
                mPreviousCameraPosition = mMap.getMapStatus();
                cluster();
                // 取消聚焦服务
                focusListenerService.stopFocus();
                // 取消聚焦服务后 取消页面聚焦状态
                eventInitMethod.sendOnMonitorLoseFocus(mapView,"true");
                return;
            }
            if (mapStatus.zoom > 14) {
                cLusterFlag = false;
                for (Marker marker : this.mClusterMarkers.getMarkers()) {
                    marker.setVisible(false);
                }
                Iterator<Map.Entry<String, Object>> iterators = markerHashMap.entrySet().iterator();
                while (iterators.hasNext()) {
                    Map.Entry<String, Object> next = iterators.next();
                    if (!next.getValue().equals("temp")) {
                        List<Marker> value = (List<Marker>) next.getValue();
                        for (Marker marker : value) {
                            marker.setVisible(true);
                        }
                    }
                }
                Iterator<Map.Entry<String, Object>> tempIterator = tempHashMap.entrySet().iterator();
                while (tempIterator.hasNext()) {
                    Map.Entry<String, Object> next = tempIterator.next();
                    List<Marker> value = (List<Marker>) next.getValue();
                    for (Marker marker : value) {
                        marker.setVisible(true);
                    }
                }
                Log.i(TAG, "onMapStatusChangeFinish:" + mapStatus);
                if (actionStatus == null) {
                    return;
                }
                centreLatLng = mapStatus.target;
                // 当前操作页是主页
                if (vehicleEntityListAll.size() != 0 && currentView == 0) {
                    // marker渲染引起的
                    if (actionStatus == 1) {
                        // 1.加载屏幕以及确定屏幕范围内的点
                        loadScreen(mapStatus);
                        // 2.加载屏幕marker
                        markerScreen();
                        // 3.事件推送
                        WritableArray writableArray = new WritableNativeArray();
                        Iterator<Map.Entry<String, Object>> iterator = vehicleEntityListScreen.entrySet().iterator();
                        while (iterator.hasNext()) {
                            Map.Entry<String, Object> next = iterator.next();
                            String key = next.getKey();
                            writableArray.pushString(key);
                            Log.i(TAG, "事件推送:" + key);
                        }
                        vehicleEntityListScreen.size();
                        eventInitMethod.sendOnInAreaOptions(mapView, writableArray, mReactContext);
                    }
                }
            }
            if(focusListenerServiceFlag){
                focusListenerServiceFlag =false;
                focusListenerService.setPoint(CommonMapUtil.getScreenPoint());
                focusListenerService.setMapView(mapView);
                focusListenerService.startFocus();
            }
        }
    }

    private void controlCenter() {
        LatLng center = mapView.getMap().getMapStatus().bound.getCenter();
        Point point = mapView.getMap().getProjection().toScreenLocation(center);
        System.out.println("--------------po:" + point);
        if (point.y >= 960) {
            point.y = point.y + 230;
            LatLng latLng = mapView.getMap().getProjection().fromScreenLocation(point);
            MapStatusUpdate statusUpdate = MapStatusUpdateFactory.newLatLng(latLng);
            mapView.getMap().setMapStatus(statusUpdate);

        }
    }

    @Override
    public boolean onMarkerClick(Marker marker) {
        return getMarkerManager().onMarkerClick(marker);
    }

    @Override
    public void onMapLoaded() {
//        mapView.setScaleControlPosition(new Point(500,500));
//        mapView.showScaleControl(true);
//        Log.i(TAG, "当前缩放级别c"+mapView.get);
        Log.i(TAG, "比例尺的高度,宽度:" + mapView.getScaleControlViewHeight()+":"+mapView.getScaleControlViewWidth()+":"+mapView.getMapLevel());
        EventInitMethod eventInitMethod = new EventInitMethod(mapView, mReactContext);
        eventInitMethod.sendOnMapInitFinsh(mapView, "");
}

    public void setAggrNum(Integer aggrNum) {
        this.aggrNum = aggrNum;
    }

    public void setMyScaleView(MyScaleView mScaleView) {
        this.scaleView = mScaleView;
    }

    public void startFocusListenerService(boolean flag) {
        this.focusListenerServiceFlag =flag;
    }

    /**
     * Runs the clustering algorithm in a background thread, then re-paints when results come back.
     */
    private class ClusterTask extends AsyncTask<Float, Void, Set<? extends Cluster<T>>> {
        @Override
        protected Set<? extends Cluster<T>> doInBackground(Float... zoom) {
            mAlgorithmLock.readLock().lock();
            try {
                return mAlgorithm.getClusters(zoom[0]);
            } finally {
                mAlgorithmLock.readLock().unlock();
            }
        }

        @Override
        protected void onPostExecute(Set<? extends Cluster<T>> clusters) {
            mRenderer.onClustersChanged(clusters);
        }
    }

    /**
     * Sets a callback that's invoked when a Cluster is tapped. Note: For this listener to function,
     * the ClusterManager must be added as a click listener to the map.
     */
    public void setOnClusterClickListener(OnClusterClickListener<T> listener) {
        mOnClusterClickListener = listener;
        mRenderer.setOnClusterClickListener(listener);
    }

    /**
     * Sets a callback that's invoked when a Cluster is tapped. Note: For this listener to function,
     * the ClusterManager must be added as a info window click listener to the map.
     */
    public void setOnClusterInfoWindowClickListener(OnClusterInfoWindowClickListener<T> listener) {
        mOnClusterInfoWindowClickListener = listener;
        mRenderer.setOnClusterInfoWindowClickListener(listener);
    }

    /**
     * Sets a callback that's invoked when an individual ClusterItem is tapped. Note: For this
     * listener to function, the ClusterManager must be added as a click listener to the map.
     */
    public void setOnClusterItemClickListener(OnClusterItemClickListener<T> listener) {
        mOnClusterItemClickListener = listener;
        mRenderer.setOnClusterItemClickListener(listener);
    }

    /**
     * Sets a callback that's invoked when an individual ClusterItem's Info Window is tapped. Note: For this
     * listener to function, the ClusterManager must be added as a info window click listener to the map.
     */
    public void setOnClusterItemInfoWindowClickListener(OnClusterItemInfoWindowClickListener<T> listener) {
        mOnClusterItemInfoWindowClickListener = listener;
        mRenderer.setOnClusterItemInfoWindowClickListener(listener);
    }

    /**
     * Called when a Cluster is clicked.
     */
    public interface OnClusterClickListener<T extends ClusterItem> {
        public boolean onClusterClick(Cluster<T> cluster);
    }

    /**
     * Called when a Cluster's Info Window is clicked.
     */
    public interface OnClusterInfoWindowClickListener<T extends ClusterItem> {
        public void onClusterInfoWindowClick(Cluster<T> cluster);
    }

    /**
     * Called when an individual ClusterItem is clicked.
     */
    public interface OnClusterItemClickListener<T extends ClusterItem> {
        public boolean onClusterItemClick(T item);
    }

    /**
     * Called when an individual ClusterItem's Info Window is clicked.
     */
    public interface OnClusterItemInfoWindowClickListener<T extends ClusterItem> {
        public void onClusterItemInfoWindowClick(T item);
    }

    /**
     * 获取当前屏幕范围内的点
     *
     * @param mapStatus
     */
    private HashMap<String, Object> loadScreen(MapStatus mapStatus) {
        vehicleEntityListScreen.clear();
        LatLngBounds bound = mapStatus.bound;
        Log.i(TAG, "获取到需要订阅的屏幕集合ALL:" + vehicleEntityListAll.size());
        for (VehicleEntity vehicleEntity : vehicleEntityListAll) {
            LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
            if (bound.contains(latLng)) {
                VehicleEntity vehicle = new VehicleEntity();
                vehicle.setTitle(vehicleEntity.getTitle());
                vehicle.setStatus(vehicleEntity.getStatus());
                vehicle.setSpeed(vehicleEntity.getSpeed());
                vehicle.setIco(vehicleEntity.getIco());
                vehicle.setMarkerId(vehicleEntity.getMarkerId());
                vehicle.setLatitude(vehicleEntity.getLatitude());
                vehicle.setLongitude(vehicleEntity.getLongitude());
                vehicle.setAngle(vehicleEntity.getAngle());
                vehicleEntityListScreen.put(vehicle.getMarkerId(), vehicle);
            }
            if(focusMarkerId!=null && vehicleEntity.getMarkerId().equals(focusMarkerId)){
                vehicleEntityListScreen.put(focusMarkerId,vehicleEntity);
            }
        }
        Iterator<Map.Entry<String, Object>> iterator = markerHashMap.entrySet().iterator();
        while (iterator.hasNext()) {
            if (vehicleEntityListScreen.size() == 0) {
                Map.Entry<String, Object> next = iterator.next();
                if (next.getValue().equals("temp")) {
                    continue;
                }
                for (Marker marker : ((List<Marker>) next.getValue())) {
                    marker.remove();
                }
                iterator.remove();
            } else {
                Map.Entry<String, Object> next = iterator.next();
                if (next.getValue().equals("temp")) {
                    continue;
                }
                if (vehicleEntityListScreen.get(next.getKey()) == null) {
                    for (Marker marker : ((List<Marker>) next.getValue())) {
                        if (!mapView.getMap().getMapStatus().bound.contains(marker.getPosition())) {
                            marker.remove();
                        }
                    }
                    iterator.remove();
                } else {
                    if (centerMarketId != null) {
                        if (next.getKey().equals(centerMarketId) && !next.getValue().equals("temp")) {
                            for (Marker marker : ((List<Marker>) next.getValue())) {
                                marker.setToTop();
                            }
                        }
                    }
                }
            }
        }
        Log.i(TAG, "获取到需要订阅的屏幕集合:" + vehicleEntityListScreen.size());
        return vehicleEntityListScreen;
    }

    /**
     * 打印当前屏幕上的点
     */
    private void markerScreen() {
        final ArrayList<VehicleEntity> vehicleEntities = new ArrayList<>();
        for (Map.Entry<String, Object> next : vehicleEntityListScreen.entrySet()) {
            if (!markerHashMap.containsKey(next.getKey())) {
                vehicleEntities.add((VehicleEntity) next.getValue());
            }
        }
        if (!isValidContextForGlide(mReactContext)) {
            Log.e(TAG, "markerScreen: mReactContext已经被销毁");
            return;
        }
        RequestManager requestManager = Glide.with(mReactContext);
        for (final VehicleEntity vehicleEntitys : vehicleEntities) {
            markerHashMap.put(vehicleEntitys.getMarkerId(), "temp");
            requestManager
                .load(vehicleEntitys.getIco())
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        View inflate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon_test, null);
                        Button button = (Button) inflate.findViewById(R.id.onButton);
                        TextView textView = (TextView) inflate.findViewById(R.id.onTextView);
                        final LatLng latLng = new LatLng(vehicleEntitys.getLatitude().doubleValue(), vehicleEntitys.getLongitude().doubleValue());
                        GradientDrawable background = (GradientDrawable) button.getBackground();
                        background.setColor(CommonUtil.statusToColour(vehicleEntitys.getStatus()));
                        textView.setText(vehicleEntitys.getTitle());
                        textView.getPaint().setFakeBoldText(true);
                        // 设置车辆
                        // 设置车辆的偏转方向
                        BitmapDescriptor textImg = BitmapDescriptorFactory.fromView(inflate);
                        View imgFlate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon, null);
                        BitmapDescriptor bitMap = CommonUtil.getBitMapV2(textImg);
                        ((ImageView) imgFlate.findViewById(R.id.imgTest)).setImageBitmap(resource);
                        BitmapDescriptor carImg = BitmapDescriptorFactory.fromView(imgFlate);
                        MarkerOptions textOptions = new MarkerOptions().icon(bitMap).position(latLng);
                        MarkerOptions carOptions = new MarkerOptions().icon(carImg).position(latLng).anchor(0.5f, 0.5f);
                        Marker textMarker = (Marker) mapView.getMap().addOverlay(textOptions);
                        Marker carMarker = (Marker) mapView.getMap().addOverlay(carOptions);
                        CommonUtil.routeCarMarker(carMarker, vehicleEntitys.getAngle());
                        Bundle bundle = new Bundle();
                        bundle.putString("marketId", vehicleEntitys.getMarkerId());
                        carMarker.setExtraInfo(bundle);
                        ArrayList<Marker> markers = new ArrayList<>();
                        if (centerMarketId != null && centerMarketId.equals(vehicleEntitys.getMarkerId())) {
                            textMarker.setToTop();
                            carMarker.setToTop();
                        }
                        markers.add(textMarker);
                        markers.add(carMarker);
                        if (markerId != null && !"".equals(markerId) && vehicleEntitys.getMarkerId().equals(markerId)) {
                            textMarker.setToTop();
                            carMarker.setToTop();
                        }
                        if(vehicleEntitys.getMarkerId().equals(focusMarkerIdV2)){
                            focusListenerService.setMarker(carMarker);
                        }
                        markerHashMap.put(vehicleEntitys.getMarkerId(), markers);
                    }
                });
        }
    }

    private static boolean isValidContextForGlide(final Context context) {
        if (context == null) {
            return false;
        }
        if (context instanceof Activity) {
            final Activity activity = (Activity) context;
            if (isAcitityDestroyed(activity)) {
                return false;
            }
        }

        if (context instanceof ThemedReactContext) {
            final Context baseContext = ((ThemedReactContext) context).getBaseContext();
            if (baseContext instanceof Activity) {
                final Activity baseActivity = (Activity) baseContext;
                if (isAcitityDestroyed(baseActivity)) {
                    return false;
                }
            }
        }

        return true;
    }

    private static boolean isAcitityDestroyed (Activity activity) {
        return activity.isDestroyed() || activity.isFinishing();
    }
}
