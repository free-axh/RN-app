package com.zwf3lbs.androidOcr.ocrModule;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.zwf3lbs.baiduManage.BaseModule;

public class OCREmitterModule extends BaseModule {
    private static final String REACT_CLASS = "OCREmitterModule";
    private static OCREmitterModule instance;
    private static ReactApplicationContext reacContext;

    public OCREmitterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reacContext = reactContext;
        context = reactContext;
    }

    public static OCREmitterModule getInstance() {
        if (instance == null) {
            instance = new OCREmitterModule(reacContext);
        }
        return instance;
    }

    public String getName() {
        return REACT_CLASS;
    }


    public void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

}
