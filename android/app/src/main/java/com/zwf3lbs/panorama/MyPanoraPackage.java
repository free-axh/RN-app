package com.zwf3lbs.panorama;

import android.content.Context;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MyPanoraPackage implements ReactPackage {

    MyPanoramaView myPanoramaView;

    private Context mContext;
    public MyPanoraPackage(Context context){
        this.mContext =context;
        myPanoramaView = new MyPanoramaView();
        myPanoramaView.initSDK(mContext);
    }


    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
       return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        List<ViewManager> modules = new ArrayList<>();
        modules.add(myPanoramaView);
        return modules;
    }
}
