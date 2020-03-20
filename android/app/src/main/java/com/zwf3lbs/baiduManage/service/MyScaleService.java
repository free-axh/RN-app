package com.zwf3lbs.baiduManage.service;

import com.baidu.mapapi.map.MapView;
import com.baidu.mapapi.model.LatLng;

public class MyScaleService {

    /**
     * 百度地图最大缩放级别
     */
    private  final int MAX_LEVEL = 21;

    /**
     * 各级比例尺分母值数组
     */
    private  final int[] SCALES = {5,10,20, 50, 100, 200, 500, 1000, 2000,
            5000, 10000, 20000, 25000, 50000, 100000, 200000, 500000, 1000000
    };

    /**
     * 各级比例尺文字数组
     */
    private  final String[] SCALE_DESCS = {"5米","10米","20米", "50米", "100米", "200米",
            "500米", "1公里", "2公里", "5公里", "10公里", "20公里", "25公里", "50公里",
            "100公里", "200公里", "500公里", "1000公里"};

    /**
     * 百度MapView
     */
    private MapView mapView;

    public void setMapView(MapView mapView) {
        this.mapView = mapView;
    }

    /**
     * 根据缩放级别，得到对应比例尺在SCALES数组中的位置（索引）
     * @param zoomLevel
     * @return
     */
    private  int getScaleIndex(int zoomLevel) {
        if((MAX_LEVEL - zoomLevel)<0){
            return 0;
        }else {
            return MAX_LEVEL - zoomLevel;
        }
    }
    /**
     * 根据缩放级别，得到对应比例尺
     *
     * @param zoomLevel
     * @return
     */
    public  int getScale(int zoomLevel) {
        return SCALES[getScaleIndex(zoomLevel)];
    }
    /**
     *  根据缩放级别，得到对应比例尺文字
     * @param zoomLevel
     * @return
     */
    public  String getScaleDesc(int zoomLevel) {
        return SCALE_DESCS[getScaleIndex(zoomLevel)];
    }
    /**
     * 根据地图当前中心位置的纬度，当前比例尺，得出比例尺图标应该显示多长（多少像素）
     * @param map
     * @param scale
     * @return
     */
    public  int meterToPixels(MapView map, int scale) {
        // 得到当前中心位置对象
        LatLng target = map.getMap().getMapStatus().target;
        // 得到当前中心位置纬度
        double latitude = target.latitudeE6 / 1E6;
        // 得到象素数，比如当前比例尺是1/10000，比如scale=10000，对应在该纬度应在地图中绘多少象素
        // 参考http://rainbow702.iteye.com/blog/1124244
        if(map.getMap().getProjection()!=null) {
            return (int) (map.getMap().getProjection().metersToEquatorPixels(scale) / (Math
                    .cos(Math.toRadians(latitude))));
        }else {
            return 200;
        }
    }

    /**
     * 获取比例尺信息
     * @param mapView
     * @return
     */
    public String getScaleInfo(MapView mapView){
        Float zoom = mapView.getMap().getMapStatus().zoom;
        // 比例尺文字
        String scaleDesc = getScaleDesc(zoom.intValue());
        // 比例尺值
        int scale = getScale(zoom.intValue());
        int length = meterToPixels(mapView, scale);
        return scaleDesc+","+length;
    }
}
