package com.zwf3lbs.baiduManage.thread;

import android.os.Handler;
import android.os.Looper;

import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.AnimationSet;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.animation.Transformation;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.baiduManage.VehicleEntity;
import com.zwf3lbs.clusterutil.clustering.ClusterManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Queue;

import static com.zwf3lbs.baiduManage.CommonUtil.getAngle;

/**
 * 主页车辆平滑移动
 */
public class BaiduMoveCarThread extends Thread {
    private List<LatLng> latLangList = new ArrayList<>();
    private LatLng start;
    private LatLng end;
    private Handler mHandler = new Handler(Looper.getMainLooper());
    private List<Marker> mMoveMarker;
    private MapView mapView;
    private List<Map> listMap;
    private boolean flag = true;
    private Queue<Map> queue;
    private ClusterManager clusterManager;

    public ClusterManager getClusterManager() {
        return clusterManager;
    }

    public void setClusterManager(ClusterManager clusterManager) {
        this.clusterManager = clusterManager;
    }

    public Queue<Map> getQueue() {
        return queue;
    }

    public void setQueue(Queue<Map> queue) {
        this.queue = queue;
    }

    public List<Map> getListMap() {
        return listMap;
    }

    public void setListMap(List<Map> listMap) {
        this.listMap = listMap;
    }

    public BaiduMoveCarThread(List<LatLng> latLangList, LatLng start, LatLng end, Handler mHandler, List<Marker> mMoveMarker, MapView mapView) {
        this.latLangList = latLangList;
        this.start = start;
        this.end = end;
        this.mHandler = mHandler;
        this.mMoveMarker = mMoveMarker;
        this.mapView = mapView;
    }

    public List<LatLng> getLatLangList() {
        return latLangList;
    }

    public void setLatLangList(List<LatLng> latLangList) {
        this.latLangList = latLangList;
    }

    public LatLng getStart() {
        return start;
    }

    public void setStart(LatLng start) {
        this.start = start;
    }

    public LatLng getEnd() {
        return end;
    }

    public void setEnd(LatLng end) {
        this.end = end;
    }

    public Handler getmHandler() {
        return mHandler;
    }

    public void setmHandler(Handler mHandler) {
        this.mHandler = mHandler;
    }

    public List<Marker> getmMoveMarker() {
        return mMoveMarker;
    }

    public void setmMoveMarker(List<Marker> mMoveMarker) {
        this.mMoveMarker = mMoveMarker;
    }

    public MapView getMapView() {
        return mapView;
    }

    public void setMapView(MapView mapView) {
        this.mapView = mapView;
    }

    public BaiduMoveCarThread() {
    }

    private List<Marker> markers;

    private List<VehicleEntity> vehicleEntityListAll;


    @Override
    public void run() {
        while (queue.size() != 0) {
            if (flag) {
                flag = false;
                Map poll = queue.poll();
                if (markers == null) {
                    markers = (List<Marker>) poll.get("markers");
                }
                if(vehicleEntityListAll==null||vehicleEntityListAll.size()==0){
                    vehicleEntityListAll = (List<VehicleEntity>)poll.get("list");
                }
                final VehicleEntity vehicleEntity = (VehicleEntity) poll.get("entity");
                final LatLng latLng = (LatLng) poll.get("latlng");
                mHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        if (mapView == null) {
                            return;
                        }
                        Marker textMarker = markers.get(0);
                        Marker carMarker = markers.get(1);
                        Double angle = getAngle(textMarker.getPosition(), latLng);
                        final LatLng[] latLngs = new LatLng[]{textMarker.getPosition(), latLng};
                        if (angle < 0) {
                            angle = 360 + angle;
                        }
                        RotateAnimation rotateAnimation = new RotateAnimation(0, angle.intValue());
                        rotateAnimation.setDuration(1);
                        rotateAnimation.setRepeatCount(0);
                        rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
                        Transformation transformation = new Transformation(latLngs);
                        transformation.setAnimationListener(new Animation.AnimationListener() {
                            @Override
                            public void onAnimationStart() {
                            }

                            @Override
                            public void onAnimationEnd() {
                                vehicleEntityListAll.add(vehicleEntity);
                                clusterManager.getMarkerHashMap().put(vehicleEntity.getMarkerId(),markers);
                                clusterManager.getTempHashMap().remove(vehicleEntity.getMarkerId());
                                flag = true;
                            }

                            @Override
                            public void onAnimationCancel() {

                            }

                            @Override
                            public void onAnimationRepeat() {

                            }
                        });
                        transformation.setDuration(10000);
                        transformation.setRepeatCount(0);
                        transformation.setRepeatMode(Animation.RepeatMode.RESTART);
                        AnimationSet animationSet = new AnimationSet();
                        animationSet.addAnimation(transformation);
                        animationSet.addAnimation(rotateAnimation);
                        carMarker.setAnimation(animationSet);
                        carMarker.startAnimation();
                        textMarker.setAnimation(transformation);
                        textMarker.startAnimation();
                    }
                });
            }
        }
    }
//    @Override
//    public void run() {
//        while (true) {
//            if (listMap.size() == 0) {
//                break;
//            } else if (flag) {
//                flag=false;
//                Map map = listMap.get(0);
//                String markerId = (String) map.get("markerId");
//                final List<Marker> listMarker = (List<Marker>) map.get(markerId);
//                final LatLng startPoint = latLangList.get(0);
//                final LatLng endPoint = latLangList.get(1);
//                mHandler.post(new Runnable() {
//                    @Override
//                    public void run() {
//                        // refresh marker's rotate
//                        if (mapView == null) {
//                            return;
//                        }
//                        Marker textmarker = listMarker.get(0);
//                        Marker carMarker = listMarker.get(1);
//                        Double angle = getAngle(startPoint,endPoint);
//                        final LatLng[] latLngs = new LatLng[]{startPoint, endPoint};
//                        if(angle<0){
//                            angle=360+angle;
//                        }
//                        RotateAnimation rotateAnimation = new RotateAnimation(0,angle.intValue());
//                        rotateAnimation.setDuration(1);
//                        rotateAnimation.setRepeatCount(0);
//                        rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
//                        Transformation transformation = new Transformation(latLngs);
//                        transformation.setAnimationListener(new Animation.AnimationListener() {
//                            @Override
//                            public void onAnimationStart() {
//                            }
//
//                            @Override
//                            public void onAnimationEnd() {
//                                if (listMap.size() >= 1) {
//                                    listMap.remove(0);
//                                }
//                                flag=true;
//                            }
//
//                            @Override
//                            public void onAnimationCancel() {
//
//                            }
//
//                            @Override
//                            public void onAnimationRepeat() {
//
//                            }
//                        });
//                        transformation.setDuration(10000);
//                        transformation.setRepeatCount(0);
//                        transformation.setRepeatMode(Animation.RepeatMode.RESTART);
//                        AnimationSet animationSet = new AnimationSet();
//                        animationSet.addAnimation(transformation);
//                        animationSet.addAnimation(rotateAnimation);
//                        carMarker.setAnimation(animationSet);
//                        carMarker.startAnimation();
//                        textmarker.setAnimation(transformation);
//                        textmarker.startAnimation();
//                    }
//                });
//            }
//        }
//    }
    //    @Override
//    public void run() {
//        while (true) {
//            LatLng startPoint = null;
//            LatLng endPoint = null;
//            if (latLangList.size() == 0) {
//                break;
//            } else if (latLangList.size() == 1) {
//                break;
//            } else {
//                startPoint = latLangList.get(0);
//                endPoint = latLangList.get(1);
//            }
//            final double angle = CommonUtil.getAngle(startPoint, endPoint);
//            mHandler.post(new Runnable() {
//                @Override
//                public void run() {
//                    // refresh marker's rotate
//                    if (mapView == null) {
//                        return;
//                    }
//                    if (!flag) {
//                        Log.i(TAG, "实时尾迹-----" + angle);
//                        if ((angle>=0&&angle<=90)||(angle>=270&&angle<=360)){
//                            mMoveMarker.get(1).setAnchor(0.5f, 0.1f);
//                        }else {
//                            mMoveMarker.get(1).setAnchor(0.5f, 1f);
//                        }
//                        mMoveMarker.get(1).setRotate((float) angle);
//                    }
//                }
//            });
//            double slope = getSlope(startPoint, endPoint);
//            // 是不是正向的标示
//            final boolean isReverse = (startPoint.latitude > endPoint.latitude);
//
//            double intercept = getInterception(slope, startPoint);
//
//            final double xMoveDistance = isReverse ? getXMoveDistance(slope) :
//                    -1 * getXMoveDistance(slope);
//            for (double j = startPoint.latitude; !((j > endPoint.latitude) ^ isReverse);
//                 j = j - xMoveDistance) {
//                LatLng latLng = null;
//                if (slope == Double.MAX_VALUE) {
//                    latLng = new LatLng(j, startPoint.longitude);
//                } else {
//                    latLng = new LatLng(j, (j - intercept) / slope);
//                }
//                final LatLng finalLatLng = latLng;
//                final double xx = j;
//                mHandler.post(new Runnable() {
//                    @Override
//                    public void run() {
//                        if (mapView == null) {
//                            return;
//                        }
//                        mMoveMarker.get(0).setPosition(finalLatLng);
//                        mMoveMarker.get(1).setPosition(finalLatLng);
//
//                    }
//                });
//                try {
//                    Thread.sleep(CommonUtil.TIME_INTERVAL);
//                } catch (InterruptedException e) {
//                    e.printStackTrace();
//                }
//            }
//            if(latLangList.size()>1) {
//                latLangList.remove(0);
//            }
//        }
//    }

    /**
     * 算斜率
     */
    public static double getSlope(LatLng fromPoint, LatLng toPoint) {
        if (toPoint.longitude == fromPoint.longitude) {
            return Double.MAX_VALUE;
        }
        double slope = ((toPoint.latitude - fromPoint.latitude) / (toPoint.longitude - fromPoint.longitude));
        return slope;

    }

    /**
     * 根据点和斜率算取截距
     */
    public static double getInterception(double slope, LatLng point) {

        double interception = point.latitude - slope * point.longitude;
        return interception;
    }


    public boolean isFlag() {
        return flag;
    }

    public void setFlag(boolean flag) {
        this.flag = flag;
    }

    public List<Marker> getMarkers() {
        return markers;
    }

    public void setMarkers(List<Marker> markers) {
        this.markers = markers;
    }

    public List<VehicleEntity> getVehicleEntityListAll() {
        return vehicleEntityListAll;
    }

    public void setVehicleEntityListAll(List<VehicleEntity> vehicleEntityListAll) {
        this.vehicleEntityListAll = vehicleEntityListAll;
    }
}