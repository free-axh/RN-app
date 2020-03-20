package com.zwf3lbs.baiduManage;

import com.facebook.react.bridge.ReadableMap;

import java.io.Serializable;
import java.math.BigDecimal;

public class VehicleEntity implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * 唯一标识id
     */
    private String markerId;
    /**
     * 车辆状态
     */
    private Integer status;
    /**
     * 车辆速度
     */
    private Integer speed;

    /**
     * 车辆图片
     */
    private String ico;

    /**
     * 经度
     */
    private BigDecimal longitude;

    /**
     * 纬度
     */
    private BigDecimal latitude;

    /**
     * 车牌
     */
    private String title;

    private Integer angle;

    public VehicleEntity() {
    }

    public VehicleEntity(String markerId, Integer status, Integer speed, String ico, BigDecimal longitude, BigDecimal latitude, String title, Integer angle) {
        this.markerId = markerId;
        this.status = status;
        this.speed = speed;
        this.ico = ico;
        this.longitude = longitude;
        this.latitude = latitude;
        this.title = title;
        this.angle = angle;
    }

    public Integer getAngle() {
        return angle;
    }

    public void setAngle(Integer angle) {
        this.angle = angle;
    }

    public static long getSerialVersionUID() {
        return serialVersionUID;
    }

    public String getMarkerId() {
        return markerId;
    }

    public void setMarkerId(String markerId) {
        this.markerId = markerId;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Integer getSpeed() {
        return speed;
    }

    public void setSpeed(Integer speed) {
        this.speed = speed;
    }

    public String getIco() {
        return ico;
    }

    public void setIco(String ico) {
        this.ico = ico;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public static VehicleEntity fromVehicleEntity(VehicleEntity entity) {
        VehicleEntity newEntity = new VehicleEntity();
        newEntity.setIco(entity.getIco());
        newEntity.setSpeed(entity.getSpeed());
        newEntity.setStatus(entity.getStatus());
        newEntity.setTitle(entity.getTitle());
        newEntity.setMarkerId(entity.getMarkerId());
        newEntity.setLongitude(entity.getLongitude());
        newEntity.setLatitude(entity.getLatitude());
        newEntity.setAngle(entity.getAngle());
        return newEntity;
    }

    public static VehicleEntity fromReadableMap(ReadableMap map) {
        VehicleEntity entity = new VehicleEntity();

        try {
            entity.setMarkerId(map.getString("markerId"));
            entity.setIco(map.getString("ico"));
            entity.setTitle(map.getString("title"));

            entity.setStatus(getIntValue(map, "status"));
            entity.setSpeed(getIntValue(map, "speed"));
            entity.setAngle(getIntValue(map, "angle"));

            entity.setLongitude(getFloatValue(map, "longitude"));
            entity.setLatitude(getFloatValue(map, "latitude"));
            return entity;
        } catch (Exception e) {
            return null;
        }
    }

    private static int getIntValue(ReadableMap map, String fieldName) {
        if (!map.hasKey(fieldName) || map.isNull(fieldName)) {
            return 0;
        }
        return map.getInt(fieldName);
    }

    private static BigDecimal getFloatValue(ReadableMap map, String fieldName) {
        if (!map.hasKey(fieldName) || map.isNull(fieldName)) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(map.getDouble(fieldName));
    }
}
