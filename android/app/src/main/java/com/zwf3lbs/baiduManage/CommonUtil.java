package com.zwf3lbs.baiduManage;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.drawable.Drawable;
import android.support.v4.content.ContextCompat;

import com.alibaba.fastjson.JSONObject;
import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.BitmapDescriptorFactory;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.Overlay;
import com.baidu.mapapi.model.LatLng;
import com.baidu.mapapi.model.LatLngBounds;
import com.blankj.utilcode.util.ImageUtils;
import com.blankj.utilcode.util.ScreenUtils;
import com.facebook.react.uimanager.ThemedReactContext;
import com.zwf3lbs.zwf3lbsapp.R;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import static android.content.pm.PackageManager.PERMISSION_GRANTED;


/**
 * 工具类
 */
public class CommonUtil {

    public static BaiduMapViewManager baiduMapViewManager;

    // 通过设置间隔时间和距离可以控制速度和图标移动的距离
    public static final int TIME_INTERVAL = 80;
    public static final double DISTANCE = 0.0000002;
    public static final String getUrl = "http://api.map.baidu.com/geocoder/v2/?callback=renderReverse&output=json&pois=1&ak=";
    public static final String ak = "FlOdM54fwpNvVlpQCeV4LY4T6fRiwPRD";
    public static final String mcode = "&mcode=3A:A0:6E:F9:67:14:53:DF:54:27:C5:78:BD:17:F3:49:A6:EE:4E:07;com.zwf3lbs.zwf3lbsapp";
    public static String latLng = "";
    public MapView mapView;
    public ThemedReactContext mReactContext;

    public MapView getMapView() {
        return mapView;
    }

    public void setMapView(MapView mapView) {
        this.mapView = mapView;
    }

    public ThemedReactContext getmReactContext() {
        return mReactContext;
    }

    public void setmReactContext(ThemedReactContext mReactContext) {
        this.mReactContext = mReactContext;
    }

    public static List<LatLng> list = new ArrayList<>();

    public String getLatLng() {
        return latLng;
    }

    public void setLatLng(String latLng) {
        this.latLng = latLng;
    }

    /**
     * 颜色处理
     *
     * @param status
     * @return
     */
    public static Integer statusToColour(int status) {
        // 默认为未定位
        Integer colour = 0xff754801;
        switch (status) {
            case 2:
                colour = 0xff754801;
                break;
            case 3:
                colour = 0xffb6b6b6;
                break;
            case 4:
                colour = 0xffc80002;
                break;
            case 5:
                colour = 0xffffab2d;
                break;
            case 9:
                colour = 0xff960ba3;
                break;
            case 10:
                colour = 0xff78af3a;
                break;
            case 11:
                colour = 0xfffb8c96;
                break;
            default:
                break;
        }
        return colour;
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
            System.out.println(fromPoint);
            System.out.println(toPoint);
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

    /**
     * 计算x方向每次移动的距离
     */
    public static double getXMoveDistance(double slope) {
        if (slope == Double.MAX_VALUE) {
            return DISTANCE;
        }
        return Math.abs((DISTANCE * slope) / Math.sqrt(1 + slope * slope));
    }

    /**
     * 权限判断
     *
     * @param context
     * @param location
     * @return
     */
    public static boolean lackPermisson(Context context, String location) {
        if (location.equals("location")) {
            String permissons = "android.permission.ACCESS_FINE_LOCATION,android.permission.ACCESS_COARSE_LOCATION";
            String[] split = permissons.split(",");
            for (String permisson : split) {
                int i = 0;
                try {
                    i = ContextCompat.checkSelfPermission(context, permisson);
                } catch (Exception e) {
                    e.printStackTrace();
                }

                if (i == PERMISSION_GRANTED) {
                    continue;
                } else {
                    return false;
                }
            }
        }
        return true;
    }

    public void getHttp() {
        EventInitMethod eventInitMethod = new EventInitMethod(mapView, mReactContext);
        new Thread() {
            @Override
            public void run() {
                URL url = null;
                StringBuffer tStringBuffer = new StringBuffer();
                try {
                    url = new URL(getUrl + ak + latLng + mcode);
                    //2.似回车，打开链接
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    //3.得告诉服务器是什么请求方式（GET)
                    conn.setRequestMethod("GET");
                    //4.判断响应码
                    if (conn.getResponseCode() == 200) {
                    //5.获取输入流
                        InputStream is = conn.getInputStream();
                        BufferedReader tBufferedReader = new BufferedReader(new InputStreamReader(is));
                        tStringBuffer = new StringBuffer();
                        String sTempOneLine = "";
                        while ((sTempOneLine = tBufferedReader.readLine()) != null) {
                            tStringBuffer.append(sTempOneLine);
                        }
                    }
                    String s = tStringBuffer.toString();
                    String reove = "renderReverse&&renderReverse(";
                    String substring = s.substring(reove.length(), s.length() - 1);
                    JSONObject jsonObject = JSONObject.parseObject(substring);
                    Object content = ((JSONObject) jsonObject.get("result")).get("formatted_address");
                    Object str = ((JSONObject) jsonObject.get("result")).get("sematic_description");
                    EventInitMethod eventInitMethod = new EventInitMethod(mapView, mReactContext);
                    eventInitMethod.sendOnAddress(mapView, content.toString() + str.toString());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

        }.start();
    }


    public void stopPoint(final EventInitMethod eventInitMethod, final VehicleParkEntity vehicleParkEntity, final Marker marker) {
        new Thread() {
            @Override
            public void run() {
                URL url = null;
                StringBuffer tStringBuffer = new StringBuffer();
                try {
                    url = new URL(getUrl + ak + latLng + mcode);
                    //2.似回车，打开链接
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    //3.得告诉服务器是什么请求方式（GET)
                    conn.setRequestMethod("GET");
                    //4.判断响应码
                    if (conn.getResponseCode() == 200) {
                        //5.获取输入流
                        InputStream is = conn.getInputStream();
                        BufferedReader tBufferedReader = new BufferedReader(new InputStreamReader(is));
                        tStringBuffer = new StringBuffer();
                        String sTempOneLine = "";
                        while ((sTempOneLine = tBufferedReader.readLine()) != null) {
                            tStringBuffer.append(sTempOneLine);
                        }
                    }
                    String s = tStringBuffer.toString();
                    String reove = "renderReverse&&renderReverse(";
                    String substring = s.substring(reove.length(), s.length() - 1);
                    JSONObject jsonObject = JSONObject.parseObject(substring);
                    Object content = ((JSONObject) jsonObject.get("result")).get("formatted_address");
                    vehicleParkEntity.setAddress(content.toString());
                    eventInitMethod.onStopPointDataEvent(mapView, vehicleParkEntity, marker);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

        }.start();
    }


    /**
     * 覆写此方法以改变默认终点图标
     *
     * @return 终点图标
     */
    public static BitmapDescriptor getBitMap(BitmapDescriptor bitmapDescriptor) {
        // 获得图片的宽高
        int width = bitmapDescriptor.getBitmap().getWidth();
        int height = bitmapDescriptor.getBitmap().getHeight();
        // 计算缩放比例
        float scaleWidth = ((float) 60) / width;
        float scaleHeight = ((float) 94.8) / height;
        // 取得想要缩放的matrix参数
        Matrix matrix = new Matrix();
        matrix.postScale(scaleWidth, scaleHeight);
        // 得到新的图片
        Bitmap newbm = Bitmap.createBitmap(bitmapDescriptor.getBitmap(), 0, 0, width, height, matrix, true);
        return BitmapDescriptorFactory.fromBitmap(newbm);
    }

    public static void zoomToSpan(BaiduMap mBaiduMap, List<Overlay> mOverlayList) {
        if (mBaiduMap == null) {
            return;
        }
        if (mOverlayList.size() > 0) {
            LatLngBounds.Builder builder = new LatLngBounds.Builder();
            for (Overlay overlay : mOverlayList) {
                // polyline 中的点可能太多，只按marker 缩放
                if (overlay instanceof Marker) {
                    builder.include(((Marker) overlay).getPosition());
                }
            }
//            mBaiduMap.setMapStatus(MapStatusUpdateFactory
//                    .newLatLngBounds(builder.build()));
            mBaiduMap.setMapStatus(MapStatusUpdateFactory
                    .newLatLngBounds(builder.build(), 500, 900));
        }
    }

    public static BitmapDescriptor getBitMapV2(BitmapDescriptor bitmapDescriptor) {
        // 获得图片的宽高
        int width = bitmapDescriptor.getBitmap().getWidth();
        int height = bitmapDescriptor.getBitmap().getHeight();
        // 计算缩放比例
        float screenDensity = ScreenUtils.getScreenDensity();
        float scaleWidth = ((float) 250) / width;
        float scaleHeight = ((float) 150) / height;
        // 取得想要缩放的matrix参数
        Matrix matrix = new Matrix();
        Float wid = 100 * screenDensity;
        Float hig = 50 * screenDensity;
        matrix.postScale(scaleWidth, scaleHeight);
        Bitmap bitmap = ImageUtils.compressByScale(bitmapDescriptor.getBitmap(), wid.intValue(), hig.intValue());
        // 得到新的图片
        Bitmap newbm = Bitmap.createBitmap(bitmapDescriptor.getBitmap(), 0, 0, width, height, matrix, true);
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    public static void routeCarMarker(Marker marker, Integer angel) {
        if (angel == null) {
            return;
        }
        if (angel > 360) {
            angel = angel - 360;
        }
        angel = 360 - angel;
        RotateAnimation rotateAnimation = new RotateAnimation(0, angel);
        rotateAnimation.setDuration(1);
        rotateAnimation.setRepeatCount(0);
        rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
        marker.setAnimation(rotateAnimation);
        marker.startAnimation();
        marker.setRotate(angel);
    }

    public static BitmapDescriptor createStartIco() {
        BitmapDescriptor bitmapDescriptor = BitmapDescriptorFactory.fromResource(R.drawable.start);
        float screenDensity = ScreenUtils.getScreenDensity();
        Float wid = 22 * screenDensity;
        Float hig = 35 * screenDensity;
        Bitmap bitmap = ImageUtils.compressByScale(bitmapDescriptor.getBitmap(), wid.intValue(), hig.intValue());
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    public static BitmapDescriptor createEndIco() {
        BitmapDescriptor bitmapDescriptor = BitmapDescriptorFactory.fromResource(R.drawable.end);
        float screenDensity = ScreenUtils.getScreenDensity();
        Float wid = 22*screenDensity;
        Float hig = 35*screenDensity;
        Bitmap bitmap = ImageUtils.compressByScale(bitmapDescriptor.getBitmap(), wid.intValue(), hig.intValue());
        // 得到新的图片
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    public static BitmapDescriptor createParkIco(Context context) {
        Drawable vectorDrawable = context.getDrawable(R.drawable.park);
        Bitmap b = Bitmap.createBitmap(vectorDrawable.getIntrinsicWidth(), vectorDrawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(b);
        vectorDrawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        vectorDrawable.draw(canvas);
        float screenDensity = ScreenUtils.getScreenDensity();
        Float wid = 22*screenDensity;
        Float hig = 22*screenDensity;
        Bitmap bitmap = ImageUtils.compressByScale(b, wid.intValue(), hig.intValue());
        // 得到新的图片
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    public static BitmapDescriptor createCheckParkIco(Context context) {
        Drawable vectorDrawable = context.getDrawable(R.drawable.check_park);
        Bitmap b = Bitmap.createBitmap(vectorDrawable.getIntrinsicWidth(), vectorDrawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(b);
        vectorDrawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        vectorDrawable.draw(canvas);
        float screenDensity = ScreenUtils.getScreenDensity();
        Float wid = 22*screenDensity;
        Float hig = 22*screenDensity;
        Bitmap bitmap = ImageUtils.compressByScale(b, wid.intValue(), hig.intValue());
        // 得到新的图片
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }
}
