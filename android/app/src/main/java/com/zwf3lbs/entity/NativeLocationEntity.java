package com.zwf3lbs.entity;

import com.baidu.mapapi.model.LatLng;

/**
 * 原生定位实体
 */
public class NativeLocationEntity {
    /**
     * 初始位置
     */
    private LatLng initLocationLatLng;

    public LatLng getInitLocationLatLng() {
        return initLocationLatLng;
    }

    public void setInitLocationLatLng(LatLng initLocationLatLng) {
        this.initLocationLatLng = initLocationLatLng;
    }
}
