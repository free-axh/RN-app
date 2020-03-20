package com.zwf3lbs.baiduManage.navigation;

import android.location.LocationManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.hjq.permissions.Permission;
import com.hjq.permissions.XXPermissions;
import com.zwf3lbs.baiduManage.BaseModule;

public class LocationPermissionsModule extends BaseModule {

    private static final String REACT_CLASS = "LocationPermissionsModule";

    private static LocationPermissionsModule instance;

    private static ReactApplicationContext reactContext;

    private static final String TAG = "BaiduMapViewManager";


    public LocationPermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
        this.reactContext = reactContext;
    }

    public static LocationPermissionsModule getInstance(ReactApplicationContext reactContext) {
        if (instance == null) {
            instance = new LocationPermissionsModule(reactContext);
        }
        return instance;
    }
    public static LocationPermissionsModule getInstance() {
        if (instance == null) {
            instance = new LocationPermissionsModule(reactContext);
        }
        return instance;
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @ReactMethod
    public void getLocationState(String module, Promise promise) {
        boolean hasPermission = XXPermissions.isHasPermission(reactContext, Permission.Group.LOCATION);
        boolean react = locationService(reactContext);
        if(react&&hasPermission){
            promise.resolve(1);
        }else {
            promise.resolve(0);
        }
    }
    public boolean locationService(ReactApplicationContext reactContext){
        LocationManager locationManager
                = (LocationManager) context.getSystemService(reactContext.LOCATION_SERVICE);
        // 通过GPS卫星定位，定位级别可以精确到街（通过24颗卫星定位，在室外和空旷的地方定位准确、速度快）
        boolean gps = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        // 通过WLAN或移动网络(3G/2G)确定的位置（也称作AGPS，辅助GPS定位。主要用于在室内或遮盖物（建筑群或茂密的深林等）密集的地方定位）
        boolean network = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        if (gps || network) {
            return true;
        }
        return false;
    }
}
