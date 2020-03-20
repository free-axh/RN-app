/*
 * Copyright (C) 2015 Baidu, Inc. All Rights Reserved.
 */

package com.zwf3lbs.clusterutil.clustering;


import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.baiduManage.MonitorInfo;

/**
 * ClusterItem represents a marker on the map.
 */
public interface ClusterItem {
    /**
     * The position of this marker. This must always return the same value.
     */
    LatLng getPosition();


    String getInfoMarkerId();
    BitmapDescriptor getBitmapDescriptor();

    MonitorInfo getInfoMonitor();
}