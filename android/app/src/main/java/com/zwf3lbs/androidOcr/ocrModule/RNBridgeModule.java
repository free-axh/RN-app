package com.zwf3lbs.androidOcr.ocrModule;

import android.content.Intent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.zwf3lbs.androidOcr.ocr.personIdentityCard.OcrPersonMainActivity;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.OcrVehicleMainActivity;

import com.zwf3lbs.baiduManage.BaseModule;
import com.zwf3lbs.zwf3lbsapp.MainApplication;

public class RNBridgeModule extends BaseModule{

    private static final String REACT_CLASS = "RNBridgeModule";
    private static RNBridgeModule instance;
    public static ReactApplicationContext reacContext;

    public RNBridgeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reacContext = reactContext;
        context = reactContext;
    }

    public static RNBridgeModule getInstance() {
        if (instance == null) {
            instance = new RNBridgeModule(reacContext);
        }
        return instance;
    }

    public String getName() {
        return REACT_CLASS;
    }

    /**
     * 提供给前端 用于进行ocr功能
     *
     */
    @ReactMethod
    public void backToViewController(final ReadableMap options) {
        MainApplication applicationData = (MainApplication)getReactApplicationContext().getApplicationContext();
        applicationData.setAccess_token(options.getString("token"));
        applicationData.setServiceAddress(options.getString("http"));
        applicationData.setFASTDFS_ADDRESS(options.getString("imageWebUrl"));
        applicationData.setMonitorId(options.getString("monitorId"));
        applicationData.setMonitorName(options.getString("monitorName"));
        applicationData.setPlatform(options.getString("platform"));
        applicationData.setVersion(options.getInt("version")+"");
        if(options.getString("monitorType").equals("1"))  {
            Intent intent = new Intent(context, OcrPersonMainActivity.class);
            getReactApplicationContext().startActivity(intent);
        } else {
            Intent intent = new Intent(context, OcrVehicleMainActivity.class);
            getReactApplicationContext().startActivity(intent);
        }

        //告诉js端已经进入了OCR
       onEnterOCR();
    }

    public void onEnterOCR(){
        //告诉js端已经进入了OCR
        WritableMap params = Arguments.createMap();
        params.putString("data", "1");
        OCREmitterModule.getInstance().sendEvent(getReactApplicationContext(),"onEnterOCR",params);
    }

    public void onExitOCR(){
        //告诉js端已经进入了OCR
        WritableMap params = Arguments.createMap();
        params.putString("data", "0");
        OCREmitterModule.getInstance().sendEvent(getReactApplicationContext(),"onExitOCR",params);
    }



}
