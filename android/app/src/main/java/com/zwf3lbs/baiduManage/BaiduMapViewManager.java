package com.zwf3lbs.baiduManage;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baidu.location.BDAbstractLocationListener;
import com.baidu.location.BDLocation;
import com.baidu.location.LocationClient;
import com.baidu.mapapi.SDKInitializer;
import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.BitmapDescriptorFactory;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.MarkerOptions;
import com.baidu.mapapi.map.MyLocationConfiguration;
import com.baidu.mapapi.map.MyLocationData;
import com.baidu.mapapi.map.OverlayOptions;
import com.baidu.mapapi.map.Polyline;
import com.baidu.mapapi.map.PolylineOptions;
import com.baidu.mapapi.model.LatLng;
import com.baidu.mapapi.model.LatLngBounds;
import com.baidu.mapapi.search.route.DrivingRoutePlanOption;
import com.baidu.mapapi.search.route.PlanNode;
import com.baidu.mapapi.search.route.RoutePlanSearch;
import com.blankj.utilcode.util.ScreenUtils;
import com.blankj.utilcode.util.SizeUtils;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.target.Target;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.zwf3lbs.baiduManage.listener.ListenerManager;
import com.zwf3lbs.baiduManage.listener.MapClickListener;
import com.zwf3lbs.baiduManage.listener.MarkerClickListener;
import com.zwf3lbs.baiduManage.listener.NativeLocationListener;
import com.zwf3lbs.baiduManage.listener.RoutePlanResultListener;
import com.zwf3lbs.baiduManage.navigation.NavigationModule;
import com.zwf3lbs.baiduManage.service.FocusListenerService;
import com.zwf3lbs.baiduManage.service.MyScaleService;
import com.zwf3lbs.baiduManage.service.NativeLocationService;
import com.zwf3lbs.baiduManage.thread.BaiduMoveCarThread;
import com.zwf3lbs.baiduManage.thread.HistoryMoveCarThread;
import com.zwf3lbs.baiduManage.thread.VedioMoveCarThread;
import com.zwf3lbs.baiduManage.thread.WakeDataMoveCarThread;
import com.zwf3lbs.baiduManage.thread.WakeDataRealTimeThread;
import com.zwf3lbs.clusterutil.clustering.ClusterManager;
import com.zwf3lbs.entity.NativeLocationEntity;
import com.zwf3lbs.uitl.CommonMapUtil;
import com.zwf3lbs.zwf3lbsapp.R;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Queue;

public class BaiduMapViewManager extends SimpleViewManager<MapView> {

    private static final String REACT_CLASS = "RCTBaiduMap";
    private static final String TAG = "BaiduMapViewManager";
    private ThemedReactContext mReactContext;
    private Handler mHandler;
    /**
     * 定位图层
     */
    private LocationClient mLocationClient;
    private ClusterManager<MyItem> mClusterManager;

    /**
     * 初始化经纬度坐标
     */
    private LatLng defaultLatLng;

    public ClusterManager<MyItem> getmClusterManager() {
        return mClusterManager;
    }

    public void destroy() {
        this.wakeStartLatLng = null;
        if (wakeList != null) {
            wakeList.clear();
        }
        this.mClusterManager = null;
        if (this.mapView != null) {
            this.mapView.getMap().clear();
        }
        this.listAllTemp.clear();
        this.vehicleEntityListAll.clear();
        this.vehicleEntityListScreen.clear();
        this.markerHashMap.clear();
        Iterator<Map.Entry<String, Object>> iterator = wakeMap.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Object> next = iterator.next();
            ((Marker) next.getValue()).remove();
        }
        if (routePlanSearch != null) {
            routePlanSearch.destroy();
        }
        activeFlag = true;
        listMap.clear();
        vedioFlag = true;
        listVideo.clear();
        // 历史轨迹
        historyMoveCarThread = null;
        historyMap.clear();
        historyParkMap.clear();
        // 实时尾迹
        wakeDataMarkerId = null;
        wakeStartLatLng = null;
        wakeVehicleEntity = null;
        wakeDataMoveCarThread = null;
        wakeAll.clear();
        wakeList.clear();
        WakeDataRealTimeThread.clearThread();
    }

    /**
     * 应用上下文
     */
    private Context context;
    /**
     * 百度位置监听器
     */
    public BDAbstractLocationListener myListener = new MyLocationListener();
    /**
     * 视图view
     */
    private MapView mapView;
    /**
     * 百度地图MAP
     */
    private BaiduMap mBaiduMap;

    /**
     * 屏幕中心点经纬度
     */
    private LatLng centreLatLng;

    /**
     * 当前地图缩放级别
     */
    private float currentZoomSize = 15f;

    /**
     * 历史轨迹页面小车平滑移动
     */
    private HistoryMoveCarThread historyMoveCarThread;

    /**
     * 历史轨迹相关信息
     */
    private final HashMap<String, Object> historyMap = new HashMap<>();

    /**
     * 开始位置
     */
    private int startIndex = 0;

    /**
     * 历史轨迹停止点信息
     */
    public static final HashMap<Integer, Marker> historyParkMap = new HashMap<>();

    /**
     * 停止点选中位置
     */
    public static int parkIndex = -1;


    /**
     * 当前页面 0:主页 1:历史轨迹 2:实时尾迹 3:实时追踪
     */
    private int currentView = 0;

    private RoutePlanSearch routePlanSearch;

    private MyScaleService myScaleService;


    EventInitMethod eventInitMethod = null;

    /**
     * markerHash数组
     */
    private HashMap<String, Object> markerHashMap = new HashMap<>();

    private BaiduMoveCarThread moveCarThread;

    /**
     * 车辆全局A对象
     */
    private List<VehicleEntity> vehicleEntityListAll = ClusterManager.vehicleEntityListAll;

    /**
     * 当前屏幕范围内B对象
     */
    private HashMap<String, Object> vehicleEntityListScreen = ClusterManager.vehicleEntityListScreen;


    /**
     * 实时定位的具体坐标
     */
    private LatLng locationLatLng;


    private FocusListenerService focusListenerService;
    /**
     * 路线监听器
     *
     * @return
     */
    private RoutePlanResultListener listener = new RoutePlanResultListener();

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    /**
     * 上下文初始化
     *
     * @param context
     */
    public void initSDK(Context context) {
        Log.i(TAG, "context初始化:" + context);
        this.context = context;
        SDKInitializer.initialize(context);
    }

    /**
     * 创建react实例
     *
     * @param reactContext
     * @return
     */
    @Override
    protected MapView createViewInstance(ThemedReactContext reactContext) {
        Log.i(TAG, "创建react实例:" + context);
        destroy();
        CommonUtil.baiduMapViewManager = this;
        BaiduMapVariable.num = -1;
        // react --> 初始化
        this.mReactContext = reactContext;
        this.mapView = new MapView(reactContext);
        this.mBaiduMap = mapView.getMap();
        //  isFirstLoc = true;
        BaiduMapVariable.MAPVIEW = this.mapView;
        // js交互事件 --> 初始化
        eventInitMethod = new EventInitMethod(mapView, mReactContext);
        // 小车平滑移动线程 --> 初始化
        mHandler = new Handler(Looper.getMainLooper());
        // 初始化聚焦服务
        focusListenerService = new FocusListenerService();
        focusListenerService.setMapView(mapView);
        // 初始化比例尺服务
        myScaleService = new MyScaleService();
        myScaleService.setMapView(mapView);
        // 点聚合工具类 --> 初始化
        mClusterManager = new ClusterManager<MyItem>(mReactContext, mBaiduMap);
        mClusterManager.setContext(context);
        mClusterManager.setmReactContext(mReactContext);
        mClusterManager.setEventInitMethod(eventInitMethod);
        mClusterManager.setMapView(mapView);
        mClusterManager.setFocusListenerService(focusListenerService);
        mClusterManager.setMyScaleService(myScaleService);
        NativeLocationService locationService = new NativeLocationService();
        NativeLocationEntity entity = new NativeLocationEntity();
        // 监听器管理类
        ListenerManager listenerManager = new ListenerManager();
        // 初始化监听器管理类
        listenerManager.init(eventInitMethod, mapView);
        // 指南针位置    --> 初始化
        CommonMapUtil.initCompassLocation(mapView, null);
        // 近大远小效果   --> 初始化
        CommonMapUtil.initMarkerEffect(mapView, false);

        locationService.locaiton(mReactContext, (NativeLocationListener) listenerManager.getListener("nativeLocation"), entity);
        // 地图监听初始化
        CommonMapUtil.initMapListener(mapView, mClusterManager,
                (MarkerClickListener) listenerManager.getListener("marker")
                , (MapClickListener) listenerManager.getListener("map"));
        // 地图初始位置   --> 初始化
        CommonMapUtil.initDefaultLocation(mapView, entity.getInitLocationLatLng());
        // 地图ui组件   --> 初始化
        CommonMapUtil.initMapController(mapView, false);
        return mapView;
    }

    /**
     * 创建地图标记物 这个接口处理对集合的控制
     *
     * @param mapView
     * @param array
     */
    private Queue<Map> mainQueue = new LinkedList<>();
    private Map<String, VehicleEntity> listAllTemp = new HashMap<>();

    @ReactProp(name = "markers")
    public void setMarkers(final MapView mapView, ReadableArray array) {
        Log.i(TAG, "创建地图标记物:" + array);
        // JS端初始化处理 直接返回信息
        if (array == null || array.size() == 0) {
            return;
        }
        mClusterManager.setActionStatus(1);
        int size = array.size();
        if (size == 1 && vehicleEntityListAll.size() != 0 && !dealNewArray(array)) {
            return;
        }
        if (size == 1 && vehicleEntityListAll.size() != 0 && !array.isNull(0)) {
            if (mClusterManager.iscLusterFlag()) {
                return;
            }
            VehicleEntity vehicleEntity = VehicleEntity.fromReadableMap(array.getMap(0));
            Object o = vehicleEntityListScreen.get(vehicleEntity.getMarkerId());
            if (o == null) {
                return;
            }
            //进行状态处理
            HashMap<String, Object> markerHashMap = mClusterManager.getMarkerHashMap();
            Object markerObj = markerHashMap.get(vehicleEntity.getMarkerId());
            if (markerObj == null || Objects.equals(markerObj, "temp")) {
                return;
            }
            List<Marker> markers = (List<Marker>) markerObj;
            if (markers.size() == 0) {
                return;
            }
            Marker marker = markers.get(0);
            View inflate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon_test, null);
            Button button = inflate.findViewById(R.id.onButton);
            TextView textView = inflate.findViewById(R.id.onTextView);
            GradientDrawable background = (GradientDrawable) button.getBackground();
            background.setColor(CommonUtil.statusToColour(vehicleEntity.getStatus()));
            textView.setText(vehicleEntity.getTitle());
            textView.getPaint().setFakeBoldText(true);
            BitmapDescriptor newBitMap = CommonUtil.getBitMapV2(BitmapDescriptorFactory.fromView(inflate));
            marker.setIcon(newBitMap);
            // 设置车辆
            // 设置车辆的偏转方向
            LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
            if (markers.get(1).getPosition().longitude == latLng.longitude && markers.get(1).getPosition().latitude == latLng.latitude) {
                return;
            }
            Collection<MyItem> items = mClusterManager.getmAlgorithm().getItems();
            Iterator<MyItem> itemIterator = items.iterator();
            while (itemIterator.hasNext()) {
                MyItem next = itemIterator.next();
                if (vehicleEntity.getMarkerId().equals(next.getMarkerId())) {
                    itemIterator.remove();
                    break;
                }
            }
            MyItem myItem = new MyItem(latLng);
            MonitorInfo monitorInfo = new MonitorInfo();
            monitorInfo.setMonitorId(vehicleEntity.getMarkerId());
            monitorInfo.setName(vehicleEntity.getTitle());
            monitorInfo.setStatus(vehicleEntity.getStatus());
            myItem.setMarkerId(vehicleEntity.getMarkerId());
            myItem.setMonitorInfo(monitorInfo);
            mClusterManager.clearItems();
            items.add(myItem);
            mClusterManager.addItems(items);
            Iterator<VehicleEntity> iterator = vehicleEntityListAll.iterator();
            while (iterator.hasNext()) {
                VehicleEntity r = iterator.next();
                if (r.getMarkerId().equals(vehicleEntity.getMarkerId())) {
                    iterator.remove();
                    break;
                }
            }
            if (!mClusterManager.iscLusterFlag()) {
                mClusterManager.getMarkerHashMap().remove(vehicleEntity.getMarkerId());
                mClusterManager.getTempHashMap().put(vehicleEntity.getMarkerId(), markers);
                BitmapDescriptor textImg = BitmapDescriptorFactory.fromView(inflate);
                BitmapDescriptor bitMap = CommonUtil.getBitMapV2(textImg);
                marker.setIcon(bitMap);
                HashMap<Object, Object> mainHashMap = new HashMap<>();
                mainHashMap.put("markers", markers);
                mainHashMap.put("entity", vehicleEntity);
                mainHashMap.put("latlng", latLng);
                mainHashMap.put("list", vehicleEntityListAll);
                mainQueue.offer(mainHashMap);
                moveCarLoop(mapView, mainQueue, mClusterManager);
            }
        } else {
            fillVehicleEntityList(array, size);
            // 获取屏幕中心点
            VehicleEntity vty = vehicleEntityListAll.get(0);
            // 地图中心点
            centreLatLng = new LatLng(vty.getLatitude().doubleValue(), vty.getLongitude().doubleValue());
            List<MyItem> listItems = new ArrayList<>();
            for (VehicleEntity vehicleEntity : vehicleEntityListAll) {
                MyItem myItem = new MyItem(new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue()));
                myItem.setMarkerId(vehicleEntity.getMarkerId());
                MonitorInfo monitorInfo = new MonitorInfo();
                monitorInfo.setMonitorId(vehicleEntity.getMarkerId());
                monitorInfo.setName(vehicleEntity.getTitle());
                monitorInfo.setStatus(vehicleEntity.getStatus());
                myItem.setMonitorInfo(monitorInfo);
                listItems.add(myItem);
            }
            for (VehicleEntity vehicleEntity : vehicleEntityListAll) {
                listAllTemp.put(vehicleEntity.getMarkerId(), vehicleEntity);
            }
            mClusterManager.addItems(listItems);
            BaiduMapVariable.num = 0;
            CommonMapUtil.localCenterPoint(mapView, centreLatLng, 19);
        }
//        else {
//            MyItem myItem = new MyItem(new LatLng(vehicleT.getLatitude().doubleValue(), vehicleT.getLongitude().doubleValue()));
//            mClusterManager.getmAlgorithm().addItem(myItem);
//            vehicleEntityListAll.add(vehicleT);
//        }
    }

    private boolean dealNewArray(ReadableArray array) {
        boolean flag = false;
        VehicleEntity vehicleT = VehicleEntity.fromReadableMap(array.getMap(0));
        if (listAllTemp.containsKey(vehicleT.getMarkerId())) {
            flag = true;
        }
        if (!flag) {
            vehicleEntityListAll.add(vehicleT);
            MyItem myItem = new MyItem(new LatLng(vehicleT.getLatitude().doubleValue(), vehicleT.getLongitude().doubleValue()));
            mClusterManager.getmAlgorithm().addItem(myItem);
            listAllTemp.put(vehicleT.getMarkerId(), vehicleT);
        }

        return flag;
    }

    private void fillVehicleEntityList(ReadableArray array, int size) {
        VehicleEntity vehicleEntity;
        for (int num = 0; num < size; num++) {
            Log.d(TAG, "marker对象" + array.getMap(num));
            if (array.isNull(num)) {
                Log.d(TAG, "空的marker对象");
                continue;
            }

            vehicleEntity = VehicleEntity.fromReadableMap(array.getMap(num));
            if (vehicleEntity == null) {
                continue;
            }
            if (vehicleEntity.getLongitude() != null && vehicleEntity.getLatitude() != null) {
                vehicleEntityListAll.add(vehicleEntity);
            }
        }
    }

    /**
     * 地图模式
     *
     * @param mapView
     * @param type    1. 标准地图 2.卫星地图
     */
    @ReactProp(name = "bMapType", defaultInt = 1)
    public void setBMapType(MapView mapView, int type) {
        Log.i(TAG, "地图类型:" + type);
        if (type == 0) {
            return;
        }
        mapView.getMap().setMapType(type);
    }


    /**
     * 开启定位
     *
     * @param mapView
     * @param isEnabled
     */
    @ReactProp(name = "locationManager", defaultBoolean = false)
    public void setLocationManager(MapView mapView, boolean isEnabled) {
        Log.i(TAG, "手动开启定位:" + isEnabled);
        mapView.getMap().setMyLocationEnabled(isEnabled);
        if (isEnabled) {
            // 定位权限判断
            boolean flag = CommonUtil.lackPermisson(mReactContext, "location");
            if (!flag) {
                eventInitMethod.sendLocaionInfo(mapView);
                eventInitMethod.sendOnLocationSuccess(mapView, "false");
                return;
            }
        }
        // 开启定位
        if (isEnabled) {
            Log.i(TAG, "开启监听:" + isEnabled);
            // 声明locationClient类
            mLocationClient = new LocationClient(context);
            // 配置定位参数
            CommonMapUtil.initLocationParam(mLocationClient);
            // 注册监听函数
            mLocationClient.registerLocationListener(myListener);
            mLocationClient.start();

        } else if (!isEnabled) {
            if (mLocationClient != null) {
                mLocationClient.unRegisterLocationListener(myListener);
            }
        }
        // 首次初始化 isEnabled 默认值为false
        if (focusListenerService != null) {
            focusListenerService.stopFocus();
        }
    }

    /**
     * 当前是否是主页
     *
     * @param mapView
     * @param flag
     */
    @ReactProp(name = "isHome")
    public void setIsHome(final MapView mapView, boolean flag) {
        Log.i(TAG, "是否主页:" + flag);
        if (flag) {
            currentView = 0;
        }
    }

    /**
     * 聚合最大数限制
     *
     * @param mapView
     * @param aggrNum
     */
    @ReactProp(name = "aggrNum")
    public void serAgrNum(final MapView mapView, Integer aggrNum) {
        Log.i(TAG, "聚合最大数限制:" + aggrNum);
        if (aggrNum == null || aggrNum == 0) {
            return;
        }
        mClusterManager.setAggrNum(aggrNum);
    }

    /**
     * 实时路况
     *
     * @param mapView
     * @param isEnabled true:开启 false:关闭
     */
    @ReactProp(name = "trafficEnabled", defaultBoolean = false)
    public void setTrafficEnabled(MapView mapView, boolean isEnabled) {
        Log.i(TAG, "实时路况:" + isEnabled);
        mapView.getMap().setTrafficEnabled(isEnabled);
    }


    /**
     * 监控对象切换
     *
     * @param mapView
     * @param marketId 监控对象id
     */
    @ReactProp(name = "centerPoint")
    public void setCenterPoint(final MapView mapView, String marketId) {
        Log.i(TAG, "切换监控对象:" + marketId);
        currentZoomSize = 19;
        if (vehicleEntityListAll.size() == 0) {
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        if (marketId != null && !"".equals(marketId)) {
            for (VehicleEntity vehicleEntity : vehicleEntityListAll) {
                if (vehicleEntity.getMarkerId().equals(marketId)) {
                    LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
                    if (vehicleEntity.getLongitude().toString().equals("1000") || vehicleEntity.getLatitude().equals("1000")) {
                        CommonMapUtil.resetLocation(mapView, mReactContext);
                        return;
                    }
                    centreLatLng = latLng;
                    mClusterManager.setMarkerId(marketId);
                    mClusterManager.setCenterMarketId(marketId);
                    mClusterManager.setActionStatus(1);
                    CommonMapUtil.localCenterPoint(mapView, latLng, currentZoomSize);
                    break;
                }
            }
        }
        // 取消监控
        focusListenerService.stopFocus();

    }

    private LatLng dealLatLng(MapView mapView, LatLng latLng) {
        Point point1 = mapView.getMap().getProjection().toScreenLocation(latLng);
        point1.y = point1.y + 400;
        return mapView.getMap().getProjection().fromScreenLocation(point1);
    }

    /**
     * 底部聚焦监控对象
     *
     * @param mapView
     * @param array
     */
    @ReactProp(name = "monitorFocus")
    public void setMonitorFocus(final MapView mapView, ReadableArray array) {
        Log.i(TAG, "底部聚焦监控对象:" + array);
        if (array == null || array.size() == 0 || array.isNull(0)) {
            return;
        }
        ReadableMap map = array.getMap(0);
        String marketId = map.getString("monitorId");
        currentZoomSize = 19;
        focusListenerService.stopFocus();
        if (mClusterManager.getTempHashMap().get(marketId) != null) {
            List<Marker> markers = (List<Marker>) mClusterManager.getTempHashMap().get(marketId);
            LatLng position = markers.get(1).getPosition();
            if(position.latitude == 1000.0 || position.longitude == 1000.0) {
                return;
            }
            mClusterManager.setMarkerId(marketId);
            mClusterManager.setActionStatus(1);
            CommonMapUtil.localCenterPoint(mapView, position, currentZoomSize);
            return;
        }
        if (marketId != null && !"".equals(marketId)) {
            for (VehicleEntity vehicleEntity : vehicleEntityListAll) {
                if (vehicleEntity.getMarkerId().equals(marketId)) {
                    if(vehicleEntity.getLatitude().toString().equals("1000") || vehicleEntity.getLongitude().toString().equals("1000")) {
                        break;
                    }
                    LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
                    centreLatLng = latLng;
                    mClusterManager.setMarkerId(marketId);
                    mClusterManager.setActionStatus(1);
                    CommonMapUtil.localCenterPoint(mapView, latLng, currentZoomSize);
                    break;
                }
            }
        } else {
            // 从其它页面跳转回主页时，监控对象为空，恢复缩放等级至默认值
            MapStatus mapStatus = new MapStatus.Builder().zoom(currentZoomSize).build();
            mapView.getMap().setMapStatus(MapStatusUpdateFactory.newMapStatus(mapStatus));
        }


    }


    /**
     * 地图放大
     *
     * @param mapView
     * @param array
     */
    @ReactProp(name = "mapAmplification")
    public void setMapAmplification(final MapView mapView, ReadableArray array) {
        //Log.i(TAG, "地图放大:" + JSON.toJSONString(array));
        BigDecimal zoom = new BigDecimal(mapView.getMap().getMapStatus().zoom);
        if (new BigDecimal("4").compareTo(zoom) <= 0
                && new BigDecimal("21").compareTo(zoom) > 0) {
            currentZoomSize = zoom.floatValue() + 1;
            if (currentZoomSize > 21) {
                currentZoomSize = 21;
            }
            CommonMapUtil.locationCenter(mapView, mapView.getMap().getMapStatus().target, currentZoomSize);
            mClusterManager.setActionStatus(1);
        }
        Log.i(TAG, "当前屏幕缩放级别放大:" + currentZoomSize);
    }


    /**
     * 地图缩小
     */
    @ReactProp(name = "mapNarrow")
    public void setMapNarrow(final MapView mapView, ReadableArray array) {
        //Log.i(TAG, "地图缩小:" + JSON.toJSONString(array));
        BigDecimal zoom = new BigDecimal(mapView.getMap().getMapStatus().zoom);
        if (new BigDecimal("4").compareTo(zoom) < 0
                && new BigDecimal("21").compareTo(zoom) >= 0) {
            currentZoomSize = zoom.floatValue() - 1;
            if (currentZoomSize < 4) {
                currentZoomSize = 4;
            }
            CommonMapUtil.locationCenter(mapView, mapView.getMap().getMapStatus().target, currentZoomSize);
            mClusterManager.setActionStatus(1);
        }
        Log.i(TAG, "当前屏幕缩放级别缩小:" + currentZoomSize);
    }

    private List<LatLng> wakeList = new ArrayList<>();

    private HashMap<String, Object> wakeMap = new HashMap<>();

    /***
     * 实时尾迹
     * @param mapView
     * @param array
     */
    private LatLng wakeStartLatLng;
    private VehicleEntity wakeVehicleEntity;
    private List<LatLng> wakeAll = new ArrayList<>();
    private String wakeDataMarkerId;
    private WakeDataMoveCarThread wakeDataMoveCarThread;

    @ReactProp(name = "wakeData")
    public void setWakeData(final MapView mapView, ReadableArray array) {
        //Log.i(TAG, "实时尾迹" + array);
        if (array == null || array.size() == 0 || array.isNull(0)) {
            Log.d(TAG, "实时尾迹参数为空");
            return;
        }
        mClusterManager.setCurrentView(2);
        HashMap<String, Object> map = array.getMap(0).toHashMap();
        final VehicleEntity vehicleEntity = JSONObject.parseObject(JSON.toJSONString(map), VehicleEntity.class);
        wakeVehicleEntity = VehicleEntity.fromVehicleEntity(vehicleEntity);
        final LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
        if (wakeDataMarkerId != null && wakeDataMarkerId.equals(wakeVehicleEntity.getMarkerId())) {
            // 平滑移动
            LatLng latLngs = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
            wakeList.add(latLngs);
            wakeAll.add(latLng);
            Bundle bundle = new Bundle();
            bundle.putInt("angle", vehicleEntity.getAngle());
            Marker carMarker = (Marker) wakeMap.get("carMarker");
            carMarker.setExtraInfo(bundle);
            wakeMap.put("carMarker", carMarker);
            wakeDataMoveLoop(wakeList, mapView, wakeMap);
        } else {
            mapView.getMap().clear();
            wakeDataMarkerId = null;
            wakeStartLatLng = null;
            wakeAll.clear();
            wakeList.clear();
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread = null;
            }
            wakeStartLatLng = new LatLng(wakeVehicleEntity.getLatitude().doubleValue(), wakeVehicleEntity.getLongitude().doubleValue());
            Glide.with(mReactContext)
                    .load(vehicleEntity.getIco())
                    .asBitmap()
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            final View inflate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon_test, null);
                            Button button = (Button) inflate.findViewById(R.id.onButton);
                            TextView textView = (TextView) inflate.findViewById(R.id.onTextView);
                            wakeList.add(latLng);
                            wakeAll.add(latLng);
                            GradientDrawable background = (GradientDrawable) button.getBackground();
                            background.setColor(CommonUtil.statusToColour(vehicleEntity.getStatus()));
                            textView.setText(vehicleEntity.getTitle());
                            textView.getPaint().setFakeBoldText(true);
                            Log.i(TAG, "imgView:");
                            // 设置车辆
                            // 设置车辆的偏转方向
                            BitmapDescriptor textImg = BitmapDescriptorFactory.fromView(inflate);
                            BitmapDescriptor bitMap = CommonUtil.getBitMapV2(textImg);
                            View imgFlate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon, null);
                            ((ImageView) imgFlate.findViewById(R.id.imgTest)).setImageBitmap(resource);
                            BitmapDescriptor carImg = BitmapDescriptorFactory.fromView(imgFlate);
                            MarkerOptions textOptions = new MarkerOptions().icon(bitMap).position(latLng);
                            MarkerOptions carOptions = new MarkerOptions().icon(carImg).position(latLng).anchor(0.5f, 0.5f);
                            int angle = 0;
                            if (vehicleEntity.getAngle() > 360) {
                                angle = vehicleEntity.getAngle() - 360;
                            } else {
                                angle = vehicleEntity.getAngle() - 360;
                            }
                            RotateAnimation rotateAnimation = new RotateAnimation(0, 360 - angle);
                            rotateAnimation.setDuration(5);
                            rotateAnimation.setRepeatCount(0);
                            rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
                            Marker textMarker = (Marker) mapView.getMap().addOverlay(textOptions);
                            Marker carMarker = (Marker) mapView.getMap().addOverlay(carOptions);
                            Bundle bundle = new Bundle();
                            bundle.putInt("angle", vehicleEntity.getAngle());
                            carMarker.setExtraInfo(bundle);
                            carMarker.setAnimation(rotateAnimation);
                            carMarker.startAnimation();
                            textMarker.setToTop();
                            carMarker.setToTop();
                            wakeMap.put("textMarker", textMarker);
                            wakeMap.put("carMarker", carMarker);
                        }
                    });
            wakeDataMarkerId = wakeVehicleEntity.getMarkerId();
            MarkerOptions draggable = new MarkerOptions().icon(CommonUtil.createStartIco()).position(latLng);
            Marker overlay = (Marker) mapView.getMap().addOverlay(draggable);
            wakeMap.put("overlay", overlay);
            CommonMapUtil.localCenterPoint(mapView, latLng, 19);
        }
    }

    /**
     * 初始数据
     *
     * @param mapView
     * @param flag
     */
    @ReactProp(name = "wakeCurrentLocation")
    public void setWakeCurrentLocation(final MapView mapView, boolean flag) {
        Log.i(TAG, "初始数据:------------" + flag);
        if (flag) {
            LatLng latLng = wakeStartLatLng;
            // 表示定位到起点
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setMapFlag(false);
                wakeDataMoveCarThread.setTempMarker(false);
                wakeDataMoveCarThread.setRealMarker(true);
            }
            CommonMapUtil.locationCenter(mapView, latLng, 19);
        } else {
//            适应屏幕
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setMapFlag(false);
                wakeDataMoveCarThread.setRealMarker(true);
                wakeDataMoveCarThread.setTempMarker(false);
            }
            zoomToSpan();
        }
    }

    public void wakeDataMoveLoop(List<LatLng> wakeList, MapView mapView, HashMap<String, Object> wakeMap) {
        if (wakeDataMoveCarThread == null) {
            wakeDataMoveCarThread = new WakeDataMoveCarThread(wakeList, mapView, wakeMap);
            wakeDataMoveCarThread.start();
        } else if (Thread.State.TERMINATED.equals(wakeDataMoveCarThread.getState())) {
            wakeDataMoveCarThread = new WakeDataMoveCarThread(wakeList, mapView, wakeMap);
            wakeDataMoveCarThread.start();
        }
    }


    /**
     * 实时位置
     *
     * @param mapView
     * @param flag
     */
    @ReactProp(name = "wakeTargetLocation")
    public void setWakeTargetLocation(final MapView mapView, boolean flag) {
        Log.i(TAG, "实时位置:---------------" + flag);
        Log.i(TAG, "初始数据:" + flag);
        if (flag) {
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setMapFlag(true);
                wakeDataMoveCarThread.setRealMarker(false);
                wakeDataMoveCarThread.setTempMarker(true);
            }
            LatLng latLng = new LatLng(wakeVehicleEntity.getLatitude().doubleValue(), wakeVehicleEntity.getLongitude().doubleValue());
            CommonMapUtil.locationCenter(mapView, latLng, 19);
        } else {
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setMapFlag(false);
                wakeDataMoveCarThread.setRealMarker(true);
                wakeDataMoveCarThread.setTempMarker(false);
            }
            zoomToSpan();
        }
    }

    private LatLng targetLatLng;

    /**
     * 实时追踪
     *
     * @param mapView
     * @param array
     */
    private boolean activeFlag = true;

    private Marker activeMarker;

    @ReactProp(name = "routePlan")
    public void setRoutePlan(final MapView mapView, ReadableArray array) {
        Log.i(TAG, "实时追踪:" + array);
        if (array == null || array.size() == 0) {
            return;
        }
        currentView = 3;
        mClusterManager.setCurrentView(currentView);
//        if(activeFlag){
//            mapView.getMap().clear();
//            activeFlag=false;
//        }else {
//            if(activeMarker!=null) {
//                activeMarker.remove();
//            }
//        }
        mapView.getMap().clear();
        ArrayList<Object> objects = array.toArrayList();
        //绘制终点
        final VehicleEntity vehicleEntity = JSON.parseObject(JSON.toJSONString(objects.get(0)), VehicleEntity.class);
        final LatLng endLatLng = new LatLng(vehicleEntity.getLatitude().setScale(6, BigDecimal.ROUND_HALF_UP).doubleValue(), vehicleEntity.getLongitude().setScale(6, BigDecimal.ROUND_HALF_UP).doubleValue());
        targetLatLng = endLatLng;
        NavigationModule.getInstance().dealEndLatLng(endLatLng);
        makerCarRoutePlan(mapView, locationLatLng, endLatLng);
        Glide.with(mReactContext)
                .load(vehicleEntity.getIco())
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        final View inflate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon_test, null);
                        Button button = inflate.findViewById(R.id.onButton);
                        TextView textView = inflate.findViewById(R.id.onTextView);
                        GradientDrawable background = (GradientDrawable) button.getBackground();
                        background.setColor(CommonUtil.statusToColour(vehicleEntity.getStatus()));
                        textView.setText(vehicleEntity.getTitle());
                        textView.getPaint().setFakeBoldText(true);
                        BitmapDescriptor textImg = BitmapDescriptorFactory.fromView(inflate);
                        BitmapDescriptor bitMap = CommonUtil.getBitMapV2(textImg);
                        MarkerOptions textOptions = new MarkerOptions().icon(bitMap).position(endLatLng);
                        View imgFlate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon, null);
                        ((ImageView) imgFlate.findViewById(R.id.imgTest)).setImageBitmap(resource);
                        BitmapDescriptor bitmapDescriptor = BitmapDescriptorFactory.fromView(imgFlate);
                        MarkerOptions vehicle = new MarkerOptions().position(endLatLng).icon(bitmapDescriptor).anchor(0.5f, 0.5f);
                        activeMarker = (Marker) mapView.getMap().addOverlay(vehicle);
                        Marker textMarker = (Marker) mapView.getMap().addOverlay(textOptions);
                        textMarker.setToTop();
                        textMarker.setZIndex(0);
                    }

                });
        CommonUtil commonUtil = new CommonUtil();
        String location = "&location=" + locationLatLng.latitude + "," + locationLatLng.longitude;
        commonUtil.setLatLng(location);
        commonUtil.setMapView(mapView);
        commonUtil.setmReactContext(mReactContext);
        commonUtil.getHttp();
    }

    /**
     * 实时追踪页面高度调整
     *
     * @param mapView
     * @param footerHeight
     */
    @ReactProp(name = "trackPolyLineSpan")
    public void setTrackPolyLineSpan(final MapView mapView, final float footerHeight) {
        Log.i(TAG, "实时追踪页面高度调整:" + footerHeight);
        if (footerHeight == 0) {
            return;
        }
        BaiduMapVariable.footerHeight = footerHeight;
        int screenWidth = ScreenUtils.getScreenWidth();
        int mapHeight = ScreenUtils.getScreenHeight() - SizeUtils.dp2px(50) - SizeUtils.dp2px(footerHeight);
        // 移动中心点
        MapStatus mapStatus = new MapStatus.Builder()
                .targetScreen(new Point(screenWidth / 2, mapHeight / 2))
                .build();
        mBaiduMap.setMapStatus(MapStatusUpdateFactory.newMapStatus(mapStatus));
        MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(BaiduMapVariable.builder.build(), ScreenUtils.getScreenWidth(), mapHeight);
        mBaiduMap.animateMapStatus(mapStatusUpdate);
    }

    /**
     * 第一下定位到起始位置 第二下适屏
     *
     * @param mapView
     * @param flag
     */
    @ReactProp(name = "trackCurrentLocation")
    public void setTrackCurrentLocation(final MapView mapView, final Boolean flag) {
        Log.i(TAG, "定位到起始位置:" + flag);
        if (flag == null) {
            return;
        }
        if (flag) {
            CommonMapUtil.locationCenter(mapView, locationLatLng, 19);
        } else {
            CommonMapUtil.adaptScreen(mapView);
        }
    }

    /**
     * 定位到终点位置
     */
    @ReactProp(name = "trackTargetLocation")
    public void setTrackTargetLocation(final MapView mapView, final Boolean flag) {
        Log.i(TAG, "定位到终点位置:" + flag);
        if (flag == null) {
            return;
        }
        if (flag) {
            CommonMapUtil.locationCenter(mapView, targetLatLng, 19);
        } else {
            CommonMapUtil.adaptScreen(mapView);
        }
    }

    /**
     * 公交路线规划方案
     *
     * @param mapView
     * @param startLatLng
     * @param endLatLng
     */
    public void makerCarRoutePlan(MapView mapView, LatLng startLatLng, LatLng endLatLng) {
        if (routePlanSearch == null) {
            routePlanSearch = RoutePlanSearch.newInstance();
        }
        listener.setMapView(mapView);
        listener.setEventInitMethod(eventInitMethod);
        routePlanSearch.setOnGetRoutePlanResultListener(listener);
        PlanNode startNode = PlanNode.withLocation(startLatLng);
        PlanNode endNode = PlanNode.withLocation(endLatLng);
        routePlanSearch.drivingSearch((new DrivingRoutePlanOption()).from(startNode).to(endNode));
    }

    /**
     * 轨迹回放
     */
    private List<LatLng> sportList = new ArrayList<>();

    @ReactProp(name = "sportPath")
    public void setSportPath(final MapView mapView, ReadableArray array) {
        if (array == null || array.size() == 0) {
            if(this.sportList!=null) {
                this.sportList.clear();
                mapView.getMap().clear();
            }
            return;
        }
        Log.i(TAG, "轨迹回放时间:" + array);
        this.sportList.clear();
        mClusterManager.setCurrentView(1);
        BaiduMap map = mapView.getMap();
        ArrayList<VehicleEntity> vehicleList = new ArrayList<>();
        HashMap<String, Object> stringObjectHashMap;
        VehicleEntity vehicleEntity;
        for (int num = 0; num < array.size(); num++) {
            if (array.isNull(num)) {
                continue;
            }
            stringObjectHashMap = array.getMap(num).toHashMap();
            vehicleEntity = JSON.parseObject(JSON.toJSONString(stringObjectHashMap), VehicleEntity.class);
            vehicleList.add(vehicleEntity);
        }
        int size = vehicleList.size();
        List<LatLng> list = new ArrayList<>();
        for (VehicleEntity vty : vehicleList) {
            list.add(new LatLng(vty.getLatitude().doubleValue(), vty.getLongitude().doubleValue()));
        }
        if (size < 2) {
            list.add(list.get(0));
        }
        // 存放历史轨迹
        historyMap.put("markerList", list);
        // 存放对应轨迹索引
        historyMap.put("markerIndex", 0);
        OverlayOptions ooPolyline = new PolylineOptions().width(5)
                .color(0xFF0000FF).points(list);
        Polyline polyline = (Polyline) map.addOverlay(ooPolyline);
        historyMap.put("polyline", polyline);
        Log.i(TAG, "list大小:" + list.size());
        mClusterManager.setListLatLng(list);
        mClusterManager.setMapView(mapView);
        // 起点             // 终点
        VehicleEntity vehicleStart = vehicleList.get(0);
        final LatLng startLng = new LatLng(vehicleStart.getLatitude().doubleValue(), vehicleStart.getLongitude().doubleValue());
        MarkerOptions startOptions = new MarkerOptions().position(startLng).icon(CommonUtil.createStartIco());
        map.addOverlay(startOptions);
        final View viewById = LayoutInflater.from(context).inflate(R.layout.vehicle_icon, null);
        final ImageView viewById1 = (ImageView) viewById.findViewById(R.id.imgTest);
        historyMap.put("num", 0);
        Glide.with(mReactContext)
                .load(vehicleStart.getIco())
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        viewById1.setImageBitmap(resource);
                        historyMap.put("imgView", viewById1);
                        BitmapDescriptor bitmapDescriptor1 = BitmapDescriptorFactory.fromView(viewById);
                        MarkerOptions vehicle = new MarkerOptions().position(startLng).icon(bitmapDescriptor1).anchor(0.5f, 0.5f);
                        Marker newMarker = (Marker) mapView.getMap().addOverlay(vehicle);
                        historyMap.put("newMarker", newMarker);
                        if(historyMoveCarThread != null && !Thread.State.TERMINATED.equals(historyMoveCarThread.getState())){
                            historyMoveCarThread.interrupt();
                        }
                    }

            });
        VehicleEntity vehicleEnd = vehicleList.get(size - 1);
        LatLng endLng = new LatLng(vehicleEnd.getLatitude().doubleValue(), vehicleEnd.getLongitude().doubleValue());
        MarkerOptions endOptions = new MarkerOptions().position(endLng).icon(CommonUtil.createEndIco());
        map.addOverlay(endOptions);
        sportList.addAll(list);
        zoomSpanHis(mapView, sportList, "220", 1920);
    }

    /**
     * 停止点
     * @param mapView
     * @param array
     */
    @ReactProp(name = "stopPoints")
    public void setParkOptions(final MapView mapView, ReadableArray array) {
        Log.e(TAG, "停止点数据" + array);
        if (array == null ) {
            return;
        }
        BaiduMap map = mapView.getMap();
        map.clear();
        List<OverlayOptions> markerOptions = new ArrayList<>();
        MarkerOptions markerOptions1;
        JSONArray re = JSON.parseArray(array.toString());
        VehicleParkEntity vehicleParkEntity = new VehicleParkEntity();
        for (int num = 0; num < re.size(); num++) {
            if (array.isNull(num)) {
                continue;
            }
            JSONObject startLocation = JSONObject.parseObject(re.getString(num)).getJSONObject("startLocation");
            Double latitude = Double.parseDouble(startLocation.getString("latitude"));
            Double longitude = Double.parseDouble(startLocation.getString("longitude"));
            LatLng latLng = new LatLng(latitude, longitude);
            markerOptions1 = new MarkerOptions().position(latLng).icon(CommonUtil.createParkIco(context)).anchor(0.5f, 0.5f);
            Bundle bundle = new Bundle();
            vehicleParkEntity.setLatitude(latitude);
            vehicleParkEntity.setLongitude(longitude);
            vehicleParkEntity.setNumber(num);
            bundle.putCharSequence("vehicleParkEntity", JSONObject.toJSONString(vehicleParkEntity));
            markerOptions1.extraInfo(bundle);
            markerOptions.add(markerOptions1);
            Marker marker = (Marker)map.addOverlay(markerOptions1);
            marker.setToTop();
            historyParkMap.put(num,marker);
        }
    }

    /**
     * 下一个停止点
     * @param mapView
     * @param index
     */
    @ReactProp(name = "stopIndex")
    public void stopIndex(final MapView mapView, Integer index) {
        Log.e(TAG, "停止点序号" + index);
        if (index == null) {
            return;
        }
        //index为-1将选中的点还原
        if (index < 0) {
            Marker oldMarker =  BaiduMapViewManager.historyParkMap.get(BaiduMapViewManager.parkIndex);
            if (oldMarker != null) {
                oldMarker.setIcon(CommonUtil.createParkIco(context));
            }
            return;
        }

        Marker marker = historyParkMap.get(index);
        Bundle extraInfo = marker == null ? null : marker.getExtraInfo();
        if(extraInfo==null){
            return ;
        }
        String vehicleParkEntity = extraInfo.getString("vehicleParkEntity");
        if(vehicleParkEntity !=null && !vehicleParkEntity.equals("")){
            Log.e("vehicleParkEntity", vehicleParkEntity);
            Marker oldMarker =  BaiduMapViewManager.historyParkMap.get(BaiduMapViewManager.parkIndex);
            if (oldMarker != null) {
                oldMarker.setIcon(CommonUtil.createParkIco(eventInitMethod.getReactContext()));
            }
            marker.setIcon(CommonUtil.createCheckParkIco(eventInitMethod.getReactContext()));
            marker.setToTop();
            VehicleParkEntity vehicleParkEntity1 = JSON.parseObject(vehicleParkEntity, VehicleParkEntity.class);
            CommonUtil commonUtil = new CommonUtil();
            String location = "&location=" + vehicleParkEntity1.getLatitude() + "," + vehicleParkEntity1.getLongitude();
            commonUtil.setLatLng(location);
            commonUtil.setMapView(mapView);
            commonUtil.stopPoint(eventInitMethod,vehicleParkEntity1,marker);
        }
    }


    private Integer numi2 = 0;

    public void zoomSpanHis(MapView mapView, List<LatLng> list, String heightLength, int allHeight) {
        if (list.isEmpty()) {
            return;
        }
        LatLngBounds.Builder builder = new LatLngBounds.Builder();
        for (LatLng latLng : list) {
            // polyline 中的点可能太多，只按marker 缩放
            builder.include(latLng);
        }
        int bottomPadding = Double.valueOf(heightLength).intValue();
        int bottomPaddingPx = SizeUtils.dp2px(bottomPadding);
        int screenWidth = ScreenUtils.getScreenWidth();
        if (numi2 != 0 && numi2 == bottomPaddingPx) {
            return;
        }
        LatLngBounds bounds = builder.build();

        //int headerHeight = SizeUtils.dp2px(50);
        //
        int headerHeight = 0;
        int mapHeight = allHeight - bottomPaddingPx - headerHeight;

        Log.e("手机型号", Build.MODEL + "  " +  heightLength + "  " +  allHeight);

        // 移动中心点
        MapStatus mapStatus = new MapStatus.Builder()
                .targetScreen(new Point(screenWidth /2 , mapHeight/2))
                .build();
        mapView.getMap().setMapStatus(MapStatusUpdateFactory.newMapStatus(mapStatus));

        // 屏幕自动适配
        MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(bounds, screenWidth, mapHeight);
        mapView.getMap().animateMapStatus(mapStatusUpdate);
    }

    /**
     * 逆地址
     *
     * @param mapView
     * @param array
     */
    @ReactProp(name = "searchAddress")
    public void setSearchAddress(final MapView mapView, ReadableArray array) {
        Log.i(TAG, "逆地址:" + array);
        if (array == null || array.size() == 0 || array.isNull(0)) {
            return;
        }
        ReadableMap map = array.getMap(0);
        LatLng latLng = new LatLng(map.getDouble("latitude"), map.getDouble("longitude"));
        CommonUtil commonUtil = new CommonUtil();
        String location = "&location=" + latLng.latitude + "," + latLng.longitude;
        commonUtil.setLatLng(location);
        commonUtil.setMapView(mapView);
        commonUtil.setmReactContext(mReactContext);
        commonUtil.getHttp();
    }

    /**
     * 音视频监控 地图markers
     *
     * @param mapView
     * @param array
     */
    private HashMap<String, Object> histMap = new HashMap<>();

    /**
     * 音视频监控
     *
     * @param mapView
     * @param array
     */
    private List<Map> listVideo = new ArrayList<>();
    private VedioMoveCarThread vedioMoveCarThread;
    private boolean vedioFlag = true;
    private Queue<Map> queue = new LinkedList<>();

    @ReactProp(name = "videoMarker")
    public void setVideoMarker(final MapView mapView, final ReadableArray array) {
        if (array == null || array.size() == 0 || array.isNull(0)) {
            Log.i(TAG, "音视频监控参数错误");
            return;
        }
        HashMap<String, Object> map = array.getMap(0).toHashMap();
        final VehicleEntity vcEntitys = JSONObject.parseObject(JSON.toJSONString(map), VehicleEntity.class);
        final LatLng latLng = new LatLng(vcEntitys.getLatitude().doubleValue(), vcEntitys.getLongitude().doubleValue());
        Log.i(TAG, "Glide加载:" + JSON.toJSONString(vcEntitys));
        if (vedioFlag) {
            vedioFlag = false;
            Glide.with(mReactContext)
                    .load(vcEntitys.getIco())
                    .asBitmap()
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            final View inflate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon_test, null);
                            Button button = (Button) inflate.findViewById(R.id.onButton);
                            TextView textView = (TextView) inflate.findViewById(R.id.onTextView);
                            GradientDrawable background = (GradientDrawable) button.getBackground();
                            background.setColor(CommonUtil.statusToColour(vcEntitys.getStatus()));
                            textView.setText(vcEntitys.getTitle());
                            textView.getPaint().setFakeBoldText(true);
                            Log.i(TAG, "imgView:");
                            BitmapDescriptor textImg = BitmapDescriptorFactory.fromView(inflate);
                            View imgFlate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon, null);
                            BitmapDescriptor bitMap = CommonUtil.getBitMapV2(textImg);
                            ((ImageView) imgFlate.findViewById(R.id.imgTest)).setImageBitmap(resource);
                            BitmapDescriptor carImg = BitmapDescriptorFactory.fromView(imgFlate);
                            MarkerOptions textOptions = new MarkerOptions().icon(bitMap).position(latLng);
                            MarkerOptions carOptions = new MarkerOptions().icon(carImg).position(latLng).anchor(0.5f, 0.5f);
                            Marker textMarker = (Marker) mapView.getMap().addOverlay(textOptions);
                            Marker carMarker = (Marker) mapView.getMap().addOverlay(carOptions);
                            CommonUtil.routeCarMarker(carMarker, vcEntitys.getAngle());
                            ArrayList<Marker> markers = new ArrayList<>();
                            markers.add(textMarker);
                            markers.add(carMarker);
                            histMap.put("textMarker", textMarker);
                            histMap.put("carMarker", carMarker);
                        }
                    });
            CommonMapUtil.locationCenter(mapView, latLng, 15);
        } else {
            histMap.put("latlng", latLng);
            queue.offer(histMap);
//            vedioFlag=true;
//            Map map1 = listVideo.get(0);
//            ArrayList<Marker> marker = (ArrayList<Marker>) (map1.get(vcEntitys.getMarkerId()));
//            ArrayList<LatLng> list = new ArrayList<>();
//            if(marker.get(0).getPosition().latitude==latLng.latitude&&marker.get(0).getPosition().longitude==latLng.longitude){
//                return;
//            }
//            list.add(marker.get(0).getPosition());
//            list.add(new LatLng(vcEntitys.getLatitude().doubleValue(), vcEntitys.getLongitude().doubleValue()));
//            map1.put("list", list);
//            listVideo.add(map1);
            vedioMoveLoop(mapView, listVideo, queue);
        }
    }

    private void vedioMoveLoop(MapView mapView, List<Map> listVideo, Queue<Map> queue) {
        if (vedioMoveCarThread == null || vedioMoveCarThread.getState().equals(Thread.State.TERMINATED)) {
            vedioMoveCarThread = new VedioMoveCarThread();
            vedioMoveCarThread.setListMap(listVideo);
            vedioMoveCarThread.setMapView(mapView);
            vedioMoveCarThread.setQueue(queue);
            vedioMoveCarThread.start();
        } else {
            vedioMoveCarThread.setQueue(queue);
        }
    }

    /**
     * 设置轨迹回放播放速度
     *
     * @param mapView
     * @param speed
     */
    @ReactProp(name = "sportSpeed")
    public void setSportSpeed(final MapView mapView, double speed) {
        Log.i(TAG, "sportSpeed:" + speed);
        historyMap.put("sportSpeed", speed);
        if (historyMoveCarThread != null) {
            historyMoveCarThread.setSpeed(speed);
        }
    }

    /**
     * 轨迹回放点击播放 0:准备播放 1:开始播放 2:播放暂停 3:播放完成
     *
     * @param mapView
     * @param flag
     */
    @ReactProp(name = "sportPathPlay")
    public void setSportPathPlay(final MapView mapView, final Boolean flag) {
        // 点击播放
        if (flag) {
            Integer num = (Integer) historyMap.get("num");
            Polyline polyline = (Polyline) historyMap.get("polyline");
            Marker newMarker = (Marker) historyMap.get("newMarker");
            double speed = (Double) historyMap.get("sportSpeed");
            List<LatLng> markerList = (List<LatLng>) historyMap.get("markerList");
            if (historyMoveCarThread == null || Thread.State.TERMINATED.equals(historyMoveCarThread.getState())) {
                historyMoveCarThread = new HistoryMoveCarThread(newMarker, polyline, mapView);
                historyMoveCarThread.setLatlngs(markerList);
                historyMoveCarThread.setSpeed(speed);
                historyMoveCarThread.setNum(num);
                historyMoveCarThread.start();
            } else {
                if (historyMoveCarThread.getStatus() == 0) {
                    historyMoveCarThread.setNum(num);
                    historyMoveCarThread.reStartMy();
                }
            }
        } else {
            if (historyMoveCarThread != null) {
                if (historyMoveCarThread.getStatus() == 0) {
                    historyMoveCarThread.stopMy();
                }
            }
        }
    }

    /**
     * 运动轨迹调整 适配
     *
     * @param mapView
     * @param string
     */
    private String heightLength;

    @ReactProp(name = "fitPolyLineSpan")
    public void setFitPolyLineSpan(final MapView mapView, final String stirng) {
        Log.i(TAG, "fitPolyLineSpan:" + stirng);
        if (stirng == null) {
            return;
        }
        String[] split = stirng.split("\\|");
        String height = split[0];
        String paus = split[2];
        String allHeight = split[3];
        if (height != null && !"".equals(height) && sportList.size() != 0) {
            if (!paus.equals("playing")) {
                heightLength = height;
                int heightInt = SizeUtils.dp2px(Double.valueOf(allHeight).intValue());
                zoomSpanHis(mapView, sportList, heightLength, heightInt);
            } else if (paus.equals("playing")) {
                if (heightLength != null && !heightLength.equals(height)) {
                    heightLength = height;
                    int heightInt = SizeUtils.dp2px(Double.valueOf(allHeight).intValue());
                    zoomSpanHis(mapView, sportList, heightLength, heightInt);
                }
            }
        }
    }

    /**
     * 轨迹回放跳点
     *
     * @param mapView
     * @param array
     */
    @ReactProp(name = "sportIndex")
    public void setSportIndex(final MapView mapView, ReadableArray array) {
        Log.i(TAG, "sportIndex:" + array);
        if (array == null || array.size() == 0 || array.isNull(0)) {
            return;
        }
        ArrayList<Object> objects = array.toArrayList();
        JSONObject jsonObject = JSONObject.parseObject(JSON.toJSONString(objects.get(0)));
        startIndex = Integer.valueOf(jsonObject.get("index").toString());
        String flag = jsonObject.get("flag").toString();
        if (flag.equals("false")) {
            // 手动拖拽
            if (historyMoveCarThread != null) {
                if ("WAITING".equals(historyMoveCarThread.getState().name())) {
                    Marker newMarker = (Marker) historyMap.get("newMarker");
                    List<LatLng> markerList = (List<LatLng>) historyMap.get("markerList");
                    LatLng latLng = markerList.get(startIndex);
                    newMarker.setPosition(latLng);
                    historyMap.put("newMarker", newMarker);
                    historyMap.put("num", startIndex);
                } else if (Thread.State.TERMINATED.equals(historyMoveCarThread.getState())) {
                    Marker newMarker = (Marker) historyMap.get("newMarker");
                    List<LatLng> markerList = (List<LatLng>) historyMap.get("markerList");
                    if (markerList==null)
                        return;
                    LatLng latLng = markerList.get(startIndex);
                    newMarker.setPosition(latLng);
                    historyMap.put("newMarker", newMarker);
                    historyMap.put("num", startIndex);
                }
            } else {
                if (historyMap.size() > 1 && historyMap.get("newMarker") != null) {
                    Marker newMarker = (Marker) historyMap.get("newMarker");
                    List<LatLng> markerList = (List<LatLng>) historyMap.get("markerList");
                    LatLng latLng = null;
                    try {
                        latLng = markerList.get(startIndex);
                    } catch (Exception e) {
                        Log.e("setSportIndex", startIndex + " ------ " +  markerList.size() + "  -------" + array);
                    }
                    newMarker.setPosition(latLng);
                    historyMap.put("newMarker", newMarker);
                    historyMap.put("num", startIndex);
                }
            }
        }

    }

    /**
     * 打开关闭罗盘
     *
     * @param mapView
     * @param flag
     */
    @ReactProp(name = "compassOpenState")
    public void isOpenCompass(MapView mapView, boolean flag) {
        mapView.getMap().setCompassEnable(flag);
    }

    /**
     * 比例尺信息
     *
     * @param mapView
     * @param scale
     */
    @ReactProp(name = "baiduMapScalePosition")
    public void setBaiduMapScalePosition(MapView mapView, final String scale) {
        if (scale == null || "".equals(scale)) {
            return;
        }
//        mapView.showScaleControl(true);
////        Log.i(TAG, "比例尺信息:" + scale);
////        String point[] = scale.split("\\|");
//        Point scalePoint = new Point(20, 20);
//////        LatLng scaleLatLng = mapView.getMap().getProjection().fromScreenLocation(scalePoint);
//        mapView.setScaleControlPosition(scalePoint);

    }

    /**
     * 点名下发功能
     *
     * @param mapView
     * @param readableMap
     */
    @ReactProp(name = "latestLocation")
    public void setLatestLocation(final MapView mapView, ReadableMap readableMap) {
        Log.i(TAG, "点名下发功能:" + readableMap);
        if (readableMap == null) {
            return;
        }
        VehicleEntity vehi = JSON.parseObject(JSON.toJSONString(readableMap.toHashMap()), VehicleEntity.class);
        if (vehi.getMarkerId() == null || "".equals(vehi.getMarkerId())) {
            return;
        }
        LatLng latLng;
        for (VehicleEntity vehicleEntity : vehicleEntityListAll) {
            if (vehicleEntity.getMarkerId().equals(vehi.getMarkerId())) {
                latLng = new LatLng(vehi.getLatitude().doubleValue(), vehi.getLongitude().doubleValue());
                centreLatLng = latLng;
                CommonMapUtil.locationCenter(mapView, latLng, currentZoomSize);
                if (mClusterManager.getMarkerHashMap().size() != 0) {
                    Object markers = mClusterManager.getMarkerHashMap().get(vehi.getMarkerId());
                    if (markers != null) {
                        for (Marker marker : ((List<Marker>) markers)) {
                            marker.setPosition(latLng);
                        }
                    }
                }
                mClusterManager.setActionStatus(1);
            }
        }
    }

    /**
     * 聚焦功能
     *
     * @param mapView 地图view
     * @param string
     */
    @ReactProp(name = "monitorFocusTrack")
    public void setMonitorFocusTrack(final MapView mapView, String string) {
        Log.i("monitorFocusTrack", string + "");
        if (null == string) {
            return;
        } else {
            String[] split = string.split("\\|");
            String markerId = split[0];
            Marker marker = getMarker(markerId);
            if (marker == null) {
                currentZoomSize = 19;
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                for (VehicleEntity vehicleEntity : vehicleEntityListAll) {
                    if (vehicleEntity.getMarkerId().equals(markerId)) {
                        BigDecimal lat = vehicleEntity.getLatitude();
                        BigDecimal lon = vehicleEntity.getLongitude();
                        if (lat.toString().equals("1000") || lon.equals("1000")) {
                            if ("true".equals(split[1])) {
                                mClusterManager.startFocusListenerService(true);
                            }
                            return;
                        }
                        LatLng  latLng = new LatLng(lat.doubleValue(), lon.doubleValue());
                        centreLatLng = latLng;
                        mClusterManager.setMarkerId(markerId);
                        mClusterManager.setActionStatus(1);
                        mClusterManager.setFocusMarkerIdV2(markerId);
                        if ("true".equals(split[1])) {
                            mClusterManager.startFocusListenerService(true);
                        }
                        CommonMapUtil.localCenterPoint(mapView,latLng,currentZoomSize);
                        break;
                    }
                }
                return;
            }
            // 若当前是聚合状态 定位位置
            if ("true".equals(split[1])) {
                Log.i("monitorFocusTrackLog", split[1] + "");
                focusListenerService.setMarker(marker);
                focusListenerService.setPoint(CommonMapUtil.getScreenPoint());
                focusListenerService.startFocus();
                mClusterManager.setFocusMarkerId(markerId);
                for (VehicleEntity vehicleEntity : vehicleEntityListAll) {
                    if (vehicleEntity.getMarkerId().equals(markerId)) {
                        if(vehicleEntity.getLatitude().toString().equals("1000") || vehicleEntity.getLongitude().toString().equals("1000")) {
                            break;
                        }
                        LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
                        centreLatLng = latLng;
                        mClusterManager.setMarkerId(markerId);
                        mClusterManager.setActionStatus(1);
                        CommonMapUtil.localCenterPoint(mapView, latLng, 15);
                        break;
                    }

                }
            } else {
                Log.i("monitorFocusTrackLog", split[1] + "");
                mClusterManager.setFocusMarkerId(null);
                mClusterManager.startFocusListenerService(false);
                focusListenerService.stopFocus();
            }

        }
    }


    /**
     * 根据markerId获取markerId
     *
     * @param markerId
     * @return
     */
    private Marker getMarker(String markerId) {
        if (mClusterManager.getMarkerHashMap().isEmpty() && mClusterManager.getTempHashMap().isEmpty()) {
            return null;
        }
        HashMap<String, Object> hashMap = mClusterManager.getMarkerHashMap();
        if (hashMap.isEmpty()) {
            hashMap = mClusterManager.getTempHashMap();
        }
        Object markerObj = hashMap.get(markerId);
        if (markerObj == null || Objects.equals(markerObj, "temp")) {
            return null;
        }
        List<Marker> markers = (List<Marker>) markerObj;
        return markers.get(0);
    }


    /**
     * 监听器
     */
    public class MyLocationListener extends BDAbstractLocationListener {
        @Override
        public void onReceiveLocation(BDLocation location) {
            MyLocationData locData = new MyLocationData.Builder()
                    .accuracy(location.getRadius())
                    // 此处设置开发者获取到的方向信息，顺时针0-360
                    .direction(100).latitude(location.getLatitude())
                    .longitude(location.getLongitude()).build();
            // 设置定位数据
            mBaiduMap.setMyLocationData(locData);
            // 当不需要定位图层时关闭定位图层
            locationLatLng = new LatLng(location.getLatitude(),
                    location.getLongitude());
            //mBaiduMap.setMyLocationEnabled(false);
            LatLng ll = new LatLng(location.getLatitude(),
                    location.getLongitude());
            NavigationModule.getInstance().dealStartLatLng(ll);
            MapStatus.Builder builder = new MapStatus.Builder();
            builder.target(ll).zoom(18.0f);
            MyLocationConfiguration config = new MyLocationConfiguration(MyLocationConfiguration.LocationMode.NORMAL, false, null);
            mBaiduMap.setMyLocationConfiguration(config);
            mBaiduMap.animateMapStatus(MapStatusUpdateFactory.newMapStatus(builder.build()));
            // 定位成功后修改聚焦状态
            eventInitMethod.sendOnMonitorLoseFocus(mapView, "true");
            Log.i(TAG, "创建location.getLocType():" + location.getLocType());
            if (location.getLocType() == BDLocation.TypeGpsLocation) {
                // GPS定位结果
//                    Toast.makeText(context, location.getAddrStr(), Toast.LENGTH_SHORT).show();
                eventInitMethod.sendOnLocationSuccess(mapView, "true");
            } else if (location.getLocType() == BDLocation.TypeNetWorkLocation) {
                // 网络定位结果
//                    Toast.makeText(context, location.getAddrStr(), Toast.LENGTH_SHORT).show();
                eventInitMethod.sendOnLocationSuccess(mapView, "true");
            } else if (location.getLocType() == BDLocation.TypeOffLineLocation) {
                // 离线定位结果
//                    Toast.makeText(context, location.getAddrStr(), Toast.LENGTH_SHORT).show();
                eventInitMethod.sendOnLocationSuccess(mapView, "true");
            } else if (location.getLocType() == BDLocation.TypeServerError) {
                Toast.makeText(context, "服务器错误，请检查", Toast.LENGTH_SHORT).show();
            } else if (location.getLocType() == BDLocation.TypeNetWorkException) {
                Toast.makeText(context, "网络错误，请检查", Toast.LENGTH_SHORT).show();
            } else if (location.getLocType() == BDLocation.TypeCriteriaException) {
                Toast.makeText(context, "请检查定位是否打开", Toast.LENGTH_SHORT).show();
            }
        }

    }

    /**
     * 构建事件交互信息
     *
     * @return
     */
    public Map getExportedCustomBubblingEventTypeConstants() {
        Map<Object, Object> build = MapBuilder.builder()
                .put(
                        "onInAreaOptionsAPP",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onInAreaOptions")))
                .build();
        /**
         * 返回地图可视区域范围内的监控对象信息
         */
        build.put("topChange", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onChange")));
        /**
         * 返回地图可视区域范围内的监控对象信息
         */
        build.put("location", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onLocationStatusDenied")));
        /**
         * 地图点击后触发事件
         */
        build.put("onMapClickAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMapClick")));
        /**
         * 地图初始化成功事件
         */
        build.put("onMapInitFinshAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMapInitFinish")));
        /**
         * 路径规划距离返回
         */
        build.put("onPlanDistanceAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onPlanDistance")));
        /**
         * 定位成功或失败事件
         */
        build.put("onLocationSuccessAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onLocationSuccess")));
        /**
         * 地图标注物点击事件（返回当前点击的监控对象id）
         */
        build.put("onPointClickEventAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onPointClickEvent")));

        /**
         * 地图聚合点击事件（返回当前点击的监控对象id）
         */
        build.put("onClustersClickEventAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onClustersClickEvent")));

        /**
         * 历史轨迹停止点点击（返回当前停止点信息）
         */
        build.put("onStopPointDataEventAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onStopPointDataEvent")));

        /**
         * 历史轨迹停止点点击（返回当前停止点序号）
         */
        build.put("onStopPointIndexEventAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onStopPointIndexEvent")));


        /**
         * 逆地址 轨迹回放暂停后，返回查询的位置信息
         */
        build.put("onAddressAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onAddress")));
        /**
         * 原生端通知jsTimer关闭
         */
        build.put("onMonitorLoseFocusAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMonitorLoseFocus")));
        /**
         * 原生端通知js端scaleView
         */
        build.put("onMyScaleAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMyScale")));
        return build;
    }

    /**
     * 主页车辆移动
     *
     * @param mapView
     * @param vehicleEntity
     */
    private List<Map> listMap = new ArrayList<>();

    public void moveCarLoop(MapView mapView, Queue<Map> queue, ClusterManager clusterManager) {
        if (moveCarThread == null || moveCarThread.getState().equals(Thread.State.TERMINATED)) {
            moveCarThread = new BaiduMoveCarThread();
            moveCarThread.setQueue(queue);
            moveCarThread.setClusterManager(clusterManager);
            moveCarThread.setMapView(mapView);
            moveCarThread.start();
        } else {
            moveCarThread.setClusterManager(clusterManager);
            moveCarThread.setQueue(queue);
        }
        if(moveCarThread != null && !Thread.State.TERMINATED.equals(moveCarThread.getState())){
            moveCarThread.interrupt();
        }
    }
//    public void moveCarLoop(final MapView mapView, VehicleEntity vehicleEntity) {
//        LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
//        // 更新全局对象
//        for (VehicleEntity entity : vehicleEntityListAll) {
//            if (entity.getMarkerId().equals(vehicleEntity.getMarkerId())) {
//                entity.setTitle(vehicleEntity.getTitle());
//                entity.setStatus(vehicleEntity.getStatus());
//                entity.setSpeed(vehicleEntity.getSpeed());
//                entity.setLongitude(vehicleEntity.getLongitude());
//                entity.setLatitude(vehicleEntity.getLatitude());
//                entity.setIco(vehicleEntity.getIco());
//                break;
//            }
//        }
//        Collection<MyItem> items = mClusterManager.getmAlgorithm().getItems();
//        Iterator<MyItem> itemIterator = items.iterator();
//        while (itemIterator.hasNext()) {
//            MyItem next = itemIterator.next();
//            if (next.getMarkerId().equals(vehicleEntity.getMarkerId())) {
//                itemIterator.remove();
//                break;
//            }
//        }
//        MyItem myItem = new MyItem(latLng);
//        myItem.setMarkerId(vehicleEntity.getMarkerId());
//        mClusterManager.clearItems();
//        items.add(myItem);
//        mClusterManager.addItems(items);
//        List<LatLng> latLangList = new ArrayList<>();
//        if (latLangList.size() == 0) {
//            if (vehicleEntityListScreen.get(vehicleEntity.getMarkerId()) != null) {
//                VehicleEntity entity = (VehicleEntity) (vehicleEntityListScreen.get(vehicleEntity.getMarkerId()));
//                LatLng testLatLng = new LatLng(entity.getLatitude().doubleValue(), entity.getLongitude().doubleValue());
//                latLangList.add(testLatLng);
//            }
////            Iterator<Map.Entry<String, Object>> iterator = vehicleEntityListScreen.entrySet().iterator();
////            while (iterator.hasNext()) {
////                Map.Entry<String, Object> next = iterator.next();
////                VehicleEntity entity = (VehicleEntity) next.getValue();
////                if (next.getKey().equals(vehicleEntity.getMarkerId())) {
////                    LatLng testLatLng = new LatLng(entity.getLatitude().doubleValue(), entity.getLongitude().doubleValue());
////                    latLangList.add(testLatLng);
////                    break;
////                }
////            }
//        }
//        latLangList.add(latLng);
//        if (latLangList.size() < 2) {
//            return;
//        }
//        LatLng latLng1 = latLangList.get(0);
//        LatLng latLng2 = latLangList.get(1);
//        if (latLng1.latitude == latLng2.latitude && latLng2.longitude == latLng2.longitude) {
//            latLangList.remove(0);
//            return;
//        }
//        mainHashmap.put(vehicleEntity.getMarkerId(), mClusterManager.getMarkerHashMap().get(vehicleEntity.getMarkerId()));
//        mainHashmap.put("markerId", vehicleEntity.getMarkerId());
//        mainHashmap.put("listMap", latLangList);
//        listMap.add(mainHashmap);
//        if (vehicleEntityListScreen != null) {
//            if (latLangList.size() != 0) {
//                if (moveCarThread == null || moveCarThread.getState().equals(Thread.State.TERMINATED)) {
//                    moveCarThread = new BaiduMoveCarThread();
//                    moveCarThread.setListMap(listMap);
//                    moveCarThread.setLatLangList(latLangList);
//                    moveCarThread.setMapView(mapView);
//                    moveCarThread.setmHandler(mHandler);
//                    moveCarThread.setEnd(latLng);
//                    moveCarThread.start();
//                } else {
//                    moveCarThread.setListMap(listMap);
//                    moveCarThread.setLatLangList(latLangList);
//                }
//            }
//        }
//    }

    public void zoomToSpan() {
        if (mBaiduMap == null) {
            return;
        }
        if (wakeAll.size() > 0) {
            LatLngBounds.Builder builder = new LatLngBounds.Builder();
            for (LatLng latLng : wakeAll) {
                // polyline 中的点可能太多，只按marker 缩放
                builder.include(latLng);
            }
            MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(builder.build(), ScreenUtils.getScreenWidth(), ScreenUtils.getScreenHeight());
            mBaiduMap.setMapStatus(mapStatusUpdate);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

}
