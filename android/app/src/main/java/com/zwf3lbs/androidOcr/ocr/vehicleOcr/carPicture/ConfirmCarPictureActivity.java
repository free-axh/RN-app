package com.zwf3lbs.androidOcr.ocr.vehicleOcr.carPicture;

import android.content.Intent;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Looper;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.alibaba.fastjson.JSONObject;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.OcrVehicleMainActivity;
import com.zwf3lbs.androidOcr.util.CommonUtil;
import com.zwf3lbs.androidOcr.util.HttpUri;
import com.zwf3lbs.androidOcr.util.HttpUtil;
import com.zwf3lbs.androidOcr.util.loadingDialogUtil.LoadingDialog;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmCarPictureActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private ActionBar actionBar;

    private ImageView id_pic;

    private TextView vehicle_plant;

    private LoadingDialog dialog;

    LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmCarPictureActivity.this)
            .setMessage("上传中...")
            .setCancelable(false)
            .setCancelOutside(false);


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_car_picture);
        applicationData = (MainApplication)getApplicationContext();
        actionBar = getSupportActionBar();
        CommonUtil.setActionBar(actionBar, this, "确认信息");

        vehicle_plant = findViewById(R.id.vehicle_plant);
        id_pic = findViewById(R.id.id_pic);

        vehicle_plant.setText(applicationData.getMonitorName());

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));

        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmCarPictureActivity.this, id_pic,applicationData);
            }
        });

        Button submit = (Button) findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (dialog != null && dialog.isShowing()) {
                    return;
                } else {
                    dialog = loadBuilder.create();
                    dialog.show();
                }
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Looper.prepare();
                            long t1 = System.currentTimeMillis();
                            String fileString = HttpUtil.bitmapToString(getIntent().getStringExtra("filePath"));
                            Map<String, Object> parmPic = CommonUtil.getHttpParm(applicationData);
                            parmPic.put("monitorId", applicationData.getMonitorId());
                            parmPic.put("decodeImage", fileString);
                            Log.e("time1", System.currentTimeMillis()-t1 +"" );
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmCarPictureActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, Object> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("monitorId", applicationData.getMonitorId());
                            parm.put("vehiclePhoto", picJsonObject.getJSONObject("obj").getString("imageFilename"));
                            parm.put("oldVehiclePhoto", applicationData.getOldPhotoPath());
                            Log.e("chenggong", picRe);
                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadVehiclePhoto, parm,ConfirmCarPictureActivity.this);
                            JSONObject jsonObject = JSONObject.parseObject(re);
                            if (jsonObject.getBoolean("success")) {
                                dialog.cancel();
                                CommonUtil.showToastShort(ConfirmCarPictureActivity.this, "上传成功");
                                Intent intent = new Intent(ConfirmCarPictureActivity.this, OcrVehicleMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                intent.putExtra("firstInitNumber",3);
                                startActivity(intent);
                            } else {
                                dialog.cancel();
                                CommonUtil.showToast(ConfirmCarPictureActivity.this, "车辆照片上传失败");
                            }
                        } catch (Exception e) {
                            dialog.cancel();
                            CommonUtil.showToast(ConfirmCarPictureActivity.this, "车辆照片上传异常");
                        } finally {
                            Looper.loop();
                        }

                    }
                }).start();
            }
        });
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                finish();
                break;

            default:
                break;
        }
        return super.onOptionsItemSelected(item);
    }
}
