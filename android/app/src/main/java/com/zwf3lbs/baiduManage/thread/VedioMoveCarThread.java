package com.zwf3lbs.baiduManage.thread;

import android.os.Handler;
import android.os.Looper;

import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.AnimationSet;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.animation.Transformation;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.model.LatLng;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;

import static com.zwf3lbs.baiduManage.CommonUtil.getAngle;

public class VedioMoveCarThread extends Thread {
    private MapView mapView;
    private Handler handler = new Handler(Looper.getMainLooper());
    private List<Map> listMap;
    private Queue<Map> queue;

    public Queue<Map> getQueue() {
        return queue;
    }

    public void setQueue(Queue<Map> queue) {
        this.queue = queue;
    }

    public MapView getMapView() {
        return mapView;
    }

    public void setMapView(MapView mapView) {
        this.mapView = mapView;
    }

    public List<Map> getListMap() {
        return listMap;
    }

    public void setListMap(List<Map> listMap) {
        this.listMap = listMap;
    }

    private boolean isFlag = true;

    private Map videaoMap = new HashMap();

    private Marker textMarker;
    private Marker carMarker;

    @Override
    public void run() {
        while (queue.size() != 0) {
            if (isFlag) {
                isFlag = false;
                Map map = queue.poll();
                if (textMarker == null || carMarker == null) {
                    textMarker = (Marker) map.get("textMarker");
                    carMarker = (Marker) map.get("carMarker");
                }
                final LatLng latLng = (LatLng) map.get("latlng");
                handler.post(new Runnable() {
                    @Override
                    public void run() {
                        Double angle = getAngle(carMarker.getPosition(), latLng);
                        final LatLng[] latLngs = new LatLng[]{textMarker.getPosition(), latLng};
                        if (angle < 0) {
                            angle = 360 + angle;
                        }
                        if(carMarker.getPosition().latitude==latLng.latitude&&carMarker.getPosition().longitude==latLng.longitude){
                            angle=new Double(carMarker.getRotate());
                        }
                        RotateAnimation rotateAnimation = new RotateAnimation(carMarker.getRotate(), angle.intValue());
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
                                MapStatus mMapStatus = new MapStatus.Builder()
                                        //要移动的点
                                        .target(textMarker.getPosition())
                                        //放大地图到20倍
                                        .zoom(15)
                                        .build();
                                //定义MapStatusUpdate对象，以便描述地图状态将要发生的变化
                                MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(mMapStatus);
                                //改变地图状态
                                mapView.getMap().setMapStatus(mMapStatusUpdate);
                                isFlag = true;
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
//            } else if (isFlag){
//                isFlag=false;
//                final Map map = listMap.get(0);
//                final List<LatLng> list = (List)map.get("list");
//                final LatLng startPoint = list.get(0);
//                final LatLng endPoint = list.get(1);
//
//                handler.post(new Runnable() {
//                    @Override
//                    public void run() {
//                        // refresh marker's rotate
//                        if (mapView == null) {
//                            return;
//                        }
//                        final String markerId = (String)map.get("markerId");
//                        final Marker textMarker = ((ArrayList<Marker>) map.get(markerId)).get(0);
//                        final Marker carMarker = ((ArrayList<Marker>) map.get(markerId)).get(1);
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
//                                List<Marker> arrayList = new ArrayList<>();
//                                arrayList.add(textMarker);
//                                arrayList.add(carMarker);
//                                HashMap<Object, Object> histMap = new HashMap<>();
//                                histMap.put(markerId, arrayList);
//                                histMap.put("markerId",markerId);
//                                listMap.add(histMap);
//                                isFlag=true;
//                                MapStatus mMapStatus = new MapStatus.Builder()
//                                        //要移动的点
//                                        .target(textMarker.getPosition())
//                                        //放大地图到20倍
//                                        .zoom(15)
//                                        .build();
//                                //定义MapStatusUpdate对象，以便描述地图状态将要发生的变化
//                                MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(mMapStatus);
//                                //改变地图状态
//                                mapView.getMap().setMapStatus(mMapStatusUpdate);
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
//                        textMarker.setAnimation(transformation);
//                        textMarker.startAnimation();
//                    }
//                });
//                if (listMap.size() > 0) {
//                    listMap.remove(0);
//                }
//            }
//        }
//    }
}
