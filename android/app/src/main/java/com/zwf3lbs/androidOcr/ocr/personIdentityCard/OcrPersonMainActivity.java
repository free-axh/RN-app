package com.zwf3lbs.androidOcr.ocr.personIdentityCard;

import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.target.Target;
import com.hjq.permissions.OnPermission;
import com.hjq.permissions.Permission;
import com.hjq.permissions.XXPermissions;
import com.zwf3lbs.androidOcr.camera.CustomcameraActivity;
import com.zwf3lbs.androidOcr.ocrModule.RNBridgeModule;
import com.zwf3lbs.androidOcr.util.CommonUtil;
import com.zwf3lbs.androidOcr.util.HttpUri;
import com.zwf3lbs.androidOcr.util.HttpUtil;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class OcrPersonMainActivity extends AppCompatActivity {

    private ActionBar actionBar;

    private TextView title_name;

    private ImageView id_pic;

    private EditText id_name;

    private TextView id_sex;

    private EditText id_number;

    private static Handler handler;

    private static int StringWhat = 1;

    private MainApplication applicationData;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_activity_person);
        applicationData = (MainApplication)getApplicationContext();
        applicationData.setPicResultClass(PersonResultChooseActivity.class);
        actionBar = getSupportActionBar();
        CommonUtil.setActionBar(actionBar, this, "身份证信息");

        title_name = findViewById(R.id.title_name);
        id_pic = findViewById(R.id.id_pic);
        id_name = findViewById(R.id.id_name);
        id_sex = findViewById(R.id.id_sex);
        id_number = findViewById(R.id.id_number);

        setPersonIdentityCardInfo();


        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrPersonMainActivity.this, id_pic, applicationData);
            }
        });

        handler = new Handler(){
            @Override
            public void handleMessage(Message msg){
                // call update gui method.
                super.handleMessage(msg);
                switch (msg.what) {
                    case 1:
                        com.alibaba.fastjson.JSONObject obj = (com.alibaba.fastjson.JSONObject)msg.obj;
                        title_name.setText(obj.getString("name"));
                        id_name.setText(obj.getString("name"));
                        id_sex.setText(obj.getString("gender") != null ?  (obj.getString("gender").equals("1") ? "男" : "女") : null);
                        id_number.setText(obj.getString("identity"));
                        applicationData.setOldPhotoPath(obj.getString("identityCardPhoto"));
                        String  picUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("identityCardPhoto");
                        Glide.with(OcrPersonMainActivity.this)
                                .load(picUri)
                                .asBitmap()
                                .dontAnimate()
                                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                                    @Override
                                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                                        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
                                        id_pic.setImageBitmap(resource);
                                    }
                                });
                        break;
                }
            }
        };



        Button but = (Button) findViewById(R.id.submit_id);
        but.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                XXPermissions.with(OcrPersonMainActivity.this)
                        //.constantRequest() //可设置被拒绝后继续申请，直到用户授权或者永久拒绝
                        //.permission(Permission.SYSTEM_ALERT_WINDOW, Permission.REQUEST_INSTALL_PACKAGES) //支持请求 6.0 悬浮窗权限 8.0 请求安装权限
                        .permission(Permission.CAMERA)
                        .permission(Permission.Group.STORAGE) //不指定权限则自动获取清单中的危险权限
                        .request(new OnPermission() {

                            @Override
                            public void hasPermission(List<String> granted, boolean isAll) {
                                startActivity(new Intent(OcrPersonMainActivity.this,CustomcameraActivity.class));
                            }

                            @Override
                            public void noPermission(List<String> denied, boolean quick) {
                                XXPermissions.gotoPermissionSettings(OcrPersonMainActivity.this);
                            }
                        });
            }
        });


    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                RNBridgeModule.getInstance().onExitOCR();
               finish();
                break;

            default:
                break;
        }
        return super.onOptionsItemSelected(item);
    }

    private void setPersonIdentityCardInfo() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Looper.prepare();
                    Map<String, String> map = new HashMap<>();
                    map.put("monitorId", applicationData.getMonitorId());
                    map.put("access_token" ,applicationData.getAccess_token());
                    map.put("version", applicationData.getVersion());
                    map.put("platform",applicationData.getPlatform());
                    String personInfo = HttpUtil.doGET(applicationData.getServiceAddress() + HttpUri.getIdentityCardInfo, map,OcrPersonMainActivity.this);
                    com.alibaba.fastjson.JSONObject jsonObject = com.alibaba.fastjson.JSONObject.parseObject(personInfo);
                    com.alibaba.fastjson.JSONObject obj = jsonObject.getJSONObject("obj");
                    if (obj != null) {
                        Message message = new Message();
                        message.obj = obj;
                        message.what = StringWhat;
                        handler.sendMessage(message);
                    }
                }
                catch (Exception e) {
                    e.printStackTrace();
                }finally {
                    Looper.loop();
                }
            }
        }).start();
    }
}
