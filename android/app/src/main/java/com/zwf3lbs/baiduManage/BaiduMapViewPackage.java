package com.zwf3lbs.baiduManage;

import android.content.Context;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.zwf3lbs.androidOcr.ocrModule.OCREmitterModule;
import com.zwf3lbs.androidOcr.ocrModule.RNBridgeModule;
import com.zwf3lbs.appversion.AppVersionModule;
import com.zwf3lbs.baiduManage.navigation.LocationPermissionsModule;
import com.zwf3lbs.baiduManage.navigation.NavigationModule;

import java.util.Arrays;
import java.util.List;

public class BaiduMapViewPackage implements ReactPackage {

    private Context mContext;

    BaiduMapViewManager baiduMapViewManager;

    public BaiduMapViewPackage(Context context) {
        this.mContext = context;
        baiduMapViewManager = new BaiduMapViewManager();
        CommonUtil.baiduMapViewManager=baiduMapViewManager;
        baiduMapViewManager.initSDK(context);

    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> nativeModules = Arrays.<NativeModule>asList(
                new BaiduMapModule(reactContext),
                new RNBridgeModule(reactContext),
                new OCREmitterModule(reactContext),
                new AppVersionModule(reactContext),NavigationModule.getInstance(reactContext),
                LocationPermissionsModule.getInstance(reactContext)
        );
        return nativeModules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
            baiduMapViewManager
        );
    }
}
