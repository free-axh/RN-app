package com.zwf3lbs.baiduManage.thread;

import android.os.Looper;

import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.Polyline;
import com.baidu.mapapi.model.LatLng;

import android.os.Handler;

import java.util.List;


/**
 * 轨迹回放车辆平滑移动
 */
public class HistoryMoveCarThread extends Thread {
    private List<LatLng> latlngs;
    // 通过设置间隔时间和距离可以控制速度和图标移动的距离
    private static final int TIME_INTERVAL = 80;
    private static final double DISTANCE = 0.002;
    private Integer status = 0;
    private Marker mMoveMarker;
    private Handler mHandler = new Handler(Looper.getMainLooper());
    private Polyline mPolyline;
    private MapView mMapView;
    private final String lock = "lock";
    private boolean flag = false;
    public Integer num = 0;
    /**
     * 速度
     */
    private Double speed;

    public HistoryMoveCarThread(Marker mMoveMarker, Polyline mPolyline, MapView mMapView) {
        this.mMoveMarker = mMoveMarker;
        this.mPolyline = mPolyline;
        this.mMapView = mMapView;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Integer getNum() {
        return num;
    }

    public void setNum(Integer num) {
        this.num = num;
    }

    public HistoryMoveCarThread() {
    }

    public List<LatLng> getLatlngs() {
        return latlngs;
    }

    public void setLatlngs(List<LatLng> latlngs) {
        this.latlngs = latlngs;
    }

    public void stopMy() {
        flag = true;
    }

    public void reStartMy() {
        synchronized (lock) {
            flag = false;
            lock.notify();
        }
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    @Override
    public void run() {
        synchronized (lock) {
            if (latlngs == null || mMoveMarker == null) {
                return;
            }
            for (int i = num; i < latlngs.size() - 1; i++) {
                final LatLng startPoint = latlngs.get(i);
                final LatLng endPoint = latlngs.get(i + 1);
                mMoveMarker.setPosition(startPoint);
                mMoveMarker.setAnchor(0.5f, 0.5f);
                mHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        // refresh marker's rotate
                        if (mMapView == null) {
                            return;
                        }
                        mMoveMarker.setRotate((float) getAngle(startPoint, endPoint));
                    }
                });
                double slope = getSlope(startPoint, endPoint);
                // 是不是正向的标示
                boolean isReverse = (startPoint.latitude > endPoint.latitude);

                double intercept = getInterception(slope, startPoint);

                double xMoveDistance = isReverse ? getXMoveDistance(slope) : -1 * getXMoveDistance(slope);
                double textNum = ((endPoint.latitude - startPoint.latitude) / xMoveDistance);
                int count = ((Double) Math.ceil(Math.abs(textNum))).intValue();
                int time;
                if (count != 0) {
                    time = ((Double) (speed * 1000 / count)).intValue();
                } else {
                    if (flag) {
                        try {
                            lock.wait();
                            if (num != 0) {
                                i = num;
                            }
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                    try {
                        int i1 = Double.valueOf(speed * 1000).intValue();
                        Thread.sleep(i1);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    continue;
                }
                for (double j = startPoint.latitude; j > endPoint.latitude == isReverse; j = j - xMoveDistance) {
                    LatLng latLng;
                    if (slope == Double.MAX_VALUE) {
                        latLng = new LatLng(j, startPoint.longitude);
                    } else {
                        latLng = new LatLng(j, (j - intercept) / slope);
                    }
                    if (flag) {
                        try {
                            lock.wait();
                            if (num != 0) {
                                i = num;
                                break;
                            }
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                    final LatLng finalLatLng = latLng;
                    mHandler.post(new Runnable() {
                        @Override
                        public void run() {
                            if (mMapView == null) {
                                return;
                            }
                            mMoveMarker.setAnchor(0.5f, 0.5f);
                            mMoveMarker.setPosition(finalLatLng);
                        }
                    });
                    try {
                        Thread.sleep(time);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
    }

    /**
     * 根据点获取图标转的角度
     */
    private double getAngle(int startIndex) {
        if ((startIndex + 1) >= mPolyline.getPoints().size()) {
            throw new RuntimeException("index out of bonds");
        }
        LatLng startPoint = mPolyline.getPoints().get(startIndex);
        LatLng endPoint = mPolyline.getPoints().get(startIndex + 1);
        return getAngle(startPoint, endPoint);
    }

    /**
     * 根据两点算取图标转的角度
     */
    private double getAngle(LatLng fromPoint, LatLng toPoint) {
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
    private double getSlope(LatLng fromPoint, LatLng toPoint) {
        if (toPoint.longitude == fromPoint.longitude) {
            return Double.MAX_VALUE;
        }
        double slope = ((toPoint.latitude - fromPoint.latitude) / (toPoint.longitude - fromPoint.longitude));
        return slope;

    }

    /**
     * 根据点和斜率算取截距
     */
    private double getInterception(double slope, LatLng point) {

        double interception = point.latitude - slope * point.longitude;
        return interception;
    }

    /**
     * 计算x方向每次移动的距离
     */
    private double getXMoveDistance(double slope) {
        if (slope == Double.MAX_VALUE) {
            return DISTANCE;
        }
        return Math.abs((DISTANCE * slope) / Math.sqrt(1 + slope * slope));
    }
}
