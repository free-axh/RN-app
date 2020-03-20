package com.zwf3lbs.baiduManage.thread;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.AnimationSet;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.animation.Transformation;
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.MarkerOptions;
import com.baidu.mapapi.map.Overlay;
import com.baidu.mapapi.map.OverlayOptions;
import com.baidu.mapapi.map.PolylineOptions;
import com.baidu.mapapi.model.LatLng;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

import javax.microedition.khronos.opengles.GL10;

/**
 * 实时尾迹车辆平滑移动
 */
public class WakeDataMoveCarThread extends Thread {
    private static final String TAG = "WakeDataMoveCarThread";
    private List<LatLng> list;
    private MapView mapView;
    private Handler handler = new Handler(Looper.getMainLooper());
    private HashMap wakeMap;
    private boolean animationFlag = true;
    private Marker marker;
    private boolean mapFlag = true;
    private boolean testFlag =true;
    private Marker tempCarMarker;
    private Marker tempTextMarker;
    private Marker carMarker;
    private Marker textMarker;
    private Queue<LatLng> queue = new LinkedList<>();
    private List<LatLng> testList = new ArrayList<>();
    private Queue<Overlay> queueV2 = new LinkedList<>();

    public void setTempMarker(boolean flag) {
        if (tempCarMarker != null && tempTextMarker != null) {
            tempTextMarker.setVisible(flag);
            tempCarMarker.setVisible(flag);
        }
    }

    public void setRealMarker(boolean flag) {
        if (carMarker != null && textMarker != null) {
            carMarker.setVisible(flag);
            textMarker.setVisible(flag);
        }
    }

    /**
     * 速度
     */
    private Double speed = 10d;

    public void setMapFlag(boolean mapFlag) {
        this.mapFlag = mapFlag;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public WakeDataMoveCarThread(List<LatLng> list, MapView mapView, HashMap wakeMap) {
        this.list = list;
        this.mapView = mapView;
        this.wakeMap = wakeMap;
    }

    @Override
    public void run() {
        while (true) {
            if (list.size() == 0) {
                break;
            } else if (list.size() == 1) {
                break;
            } else if (animationFlag) {
                if (list.size() == 1) {
                    break;
                }
                animationFlag = false;
                final LatLng startPoint = list.get(0);
                final LatLng endPoint = list.get(1);
                handler.post(new Runnable() {
                    @Override
                    public void run() {
                        if (mapView == null) {
                            return;
                        }
                        carMarker = ((Marker) wakeMap.get("carMarker"));
                        textMarker = ((Marker) wakeMap.get("textMarker"));
                        MarkerOptions markerOptions = new MarkerOptions().position(carMarker.getPosition()).icon(carMarker.getIcon()).anchor(0.5f, 0.5f).zIndex(10);
                        tempCarMarker = (Marker) mapView.getMap().addOverlay(markerOptions);
                        tempCarMarker.setFixedScreenPosition(mapView.getMap().getMapStatus().targetScreen);
                        tempCarMarker.setToTop();
                        testFlag =true;
                        MarkerOptions options = new MarkerOptions().position(textMarker.getPosition()).icon(textMarker.getIcon());
                        tempTextMarker = (Marker) mapView.getMap().addOverlay(options);
                        tempTextMarker.setFixedScreenPosition(mapView.getMap().getMapStatus().targetScreen);
                        tempTextMarker.setToTop();
                        marker = carMarker;
                        if (mapFlag) {
                            carMarker.setVisible(false);
                            textMarker.setVisible(false);
                        } else {
                            tempTextMarker.setVisible(false);
                            tempCarMarker.setVisible(false);
                        }
                        Double angle = getAngle(startPoint, endPoint);
                        final LatLng[] latLngs = new LatLng[]{startPoint, endPoint};
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
//                                WakeDataRealTimeThread instance = WakeDataRealTimeThread.getInstance(carMarker, mapView);
//                                State state = instance.getState();
//                                if (instance.getState().equals(State.NEW)) {
//                                    instance.start();
//                                } else {
//                                    instance.startMethod();
//                                }
                             if(mapFlag){
                                 tempTextMarker.setVisible(true);
                                 tempCarMarker.setVisible(true);
                                 carMarker.setVisible(false);
                                 textMarker.setVisible(false);
                             }else {
                                 tempTextMarker.setVisible(false);
                                 tempCarMarker.setVisible(false);
                                 carMarker.setVisible(true);
                                 textMarker.setVisible(true);
                             }
                            }

                            @Override
                            public void onAnimationEnd() {
                                List<LatLng> points = new ArrayList<LatLng>();
                                points.add(latLngs[0]);
                                points.add(latLngs[1]);
                                OverlayOptions ooPolyline = new PolylineOptions().width(5)
                                        .color(0xFF0000FF).points(points);
                                mapView.getMap().addOverlay(ooPolyline);
//                                WakeDataRealTimeThread.getInstance().clearOverlay();
                                wakeMap.put("carMarker", carMarker);
                                wakeMap.put("textMarker", textMarker);
                                if (list.size() > 1) {
                                    list.remove(0);
                                }
                                if (mapFlag) {
                                    carMarker.setVisible(true);
                                    textMarker.setVisible(true);
                                    tempCarMarker.setVisible(false);
                                    tempTextMarker.setVisible(false);
                                }
                                testFlag =false;
                                animationFlag = true;
                                queue.removeAll(testList);
                                while (!queueV2.isEmpty()){
                                    Log.d(TAG, "queueV2长度"+queueV2.size());
                                    Overlay poll = queueV2.poll();
                                    Bundle extraInfo = poll.getExtraInfo();
                                    if(extraInfo.getString("tempLine").equals("1")){
                                        poll.remove();
                                    }
                                    Log.d(TAG, "queueV2长度"+queueV2.size());
                                }
//                                WakeDataRealTimeThread.getInstance().stopMethod();
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
                        tempCarMarker.setAnimation(rotateAnimation);
                        tempCarMarker.startAnimation();
                    }
                });
            }
            mapView.getMap().setOnMapDrawFrameCallback(new BaiduMap.OnMapDrawFrameCallback() {
                @Override
                public void onMapDrawFrame(GL10 gl10, MapStatus mapStatus) {

                }

                @Override
                public void onMapDrawFrame(MapStatus mapStatus) {
                    if (marker == null) {
                        return;
                    }
                    if (mapFlag&&testFlag) {
                        queue.add(marker.getPosition());
                        testList.addAll(queue);
                        if(testList.size()<2){
                            return;
                        }
                        Bundle bundle = new Bundle();
                        bundle.putString("tempLine","1");
                        OverlayOptions ooPolyline = new PolylineOptions().width(5)
                                .color(0xFF0000FF).points(testList).extraInfo(bundle);
                        Overlay overlay = mapView.getMap().addOverlay(ooPolyline);
                        queueV2.add(overlay);
                        mapView.getMap().setMapStatus(MapStatusUpdateFactory.newLatLng(marker.getPosition()));
                        queue.poll();
                    }
                }
            });
        }
//        WakeDataRealTimeThread.getInstance().stopMethod();
    }

    /**
     * 根据两点算取图标转的角度
     */
    public static double getAngle(LatLng fromPoint, LatLng toPoint) {
        double slope = getSlope(fromPoint, toPoint);
        if (slope == Double.MAX_VALUE) {
            if (toPoint.latitude > fromPoint.latitude) {
                return 0;
            } else {
                return 180;
            }
        }
        float deltAngle = 0;
        if ((toPoint.latitude - fromPoint.latitude) * slope < 0) {
            deltAngle = 180;
        }
        double radio = Math.atan(slope);
        double angle = 180 * (radio / Math.PI) + deltAngle;
        return angle;
    }

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
}
