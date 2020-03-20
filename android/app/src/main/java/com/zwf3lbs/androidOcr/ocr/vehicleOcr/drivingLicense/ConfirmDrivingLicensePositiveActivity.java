package com.zwf3lbs.androidOcr.ocr.vehicleOcr.drivingLicense;

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
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import com.alibaba.fastjson.JSONObject;

import com.zwf3lbs.androidOcr.ocr.vehicleOcr.OcrVehicleMainActivity;
import com.zwf3lbs.androidOcr.util.CommonUtil;
import com.zwf3lbs.androidOcr.util.DateUtil;
import com.zwf3lbs.androidOcr.util.HttpUri;
import com.zwf3lbs.androidOcr.util.HttpUtil;
import com.zwf3lbs.androidOcr.util.datePickDialogUtil.DatePickerDialog;
import com.zwf3lbs.androidOcr.util.loadingDialogUtil.LoadingDialog;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.List;
import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmDrivingLicensePositiveActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private ActionBar actionBar;

    private ImageView id_pic;

    private TextView vehicle_plant;

    private EditText chassisNumber;

    private EditText engineNumber;

    private EditText usingNature;

    private EditText brandModel;

    private TextView registrationDate;

    private TextView licenseIssuanceDate;

    private  LoadingDialog dialog;

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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_driving_positive);
        applicationData = (MainApplication)getApplicationContext();
        actionBar = getSupportActionBar();
        CommonUtil.setActionBar(actionBar, this, "确认信息");

        vehicle_plant = findViewById(R.id.vehicle_plant);
        id_pic = findViewById(R.id.id_pic);
        chassisNumber = findViewById(R.id.chassisNumber);
        engineNumber = findViewById(R.id.engineNumber);
        usingNature = findViewById(R.id.usingNature);
        brandModel = findViewById(R.id.brandModel);
        registrationDate = findViewById(R.id.registrationDate);
        licenseIssuanceDate = findViewById(R.id.licenseIssuanceDate);

        vehicle_plant.setText(applicationData.getMonitorName());

        chassisNumber.setText(getIntent().getStringExtra("chassisNumber"));
        engineNumber.setText(getIntent().getStringExtra("engineNumber"));
        usingNature.setText(getIntent().getStringExtra("usingNature"));
        brandModel.setText(getIntent().getStringExtra("brandModel"));
        registrationDate.setText(DateUtil.getFormat2(getIntent().getStringExtra("registrationDate")));
        licenseIssuanceDate.setText(DateUtil.getFormat2(getIntent().getStringExtra("licenseIssuanceDate")));

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));

        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmDrivingLicensePositiveActivity.this, id_pic, applicationData);
            }
        });


        registrationDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                List<Integer> date = DateUtil.getDateListForString(DateUtil.getFormat2(getIntent().getStringExtra("registrationDate")));
                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmDrivingLicensePositiveActivity.this);
                builder.setOnDateSelectedListener(new DatePickerDialog.OnDateSelectedListener() {
                    @Override
                    public void onDateSelected(int[] dates) {
                        registrationDate.setText(dates[0] + "-" + (dates[1] > 9 ? dates[1] : ("0" + dates[1])) + "-"
                                + (dates[2] > 9 ? dates[2] : ("0" + dates[2])));
                    }

                    @Override
                    public void onCancel() {

                    }
                })
                        .setSelectYear(date.get(0) - 1)
                        .setSelectMonth(date.get(1) - 1)
                        .setSelectDay(date.get(2) - 1);
                builder.setMinYear(2000);
                builder.setMaxYear(DateUtil.getYear());
                builder.setMaxMonth(DateUtil.getDateListForString(DateUtil.getToday()).get(1));
                builder.setMaxDay(DateUtil.getDateListForString(DateUtil.getToday()).get(2));
                DatePickerDialog dateDialog = builder.create();
                dateDialog.show();
            }
        });

        //日历选择
        licenseIssuanceDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                List<Integer> date = DateUtil.getDateListForString(DateUtil.getFormat2(getIntent().getStringExtra("licenseIssuanceDate")));
                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmDrivingLicensePositiveActivity.this);
                builder.setOnDateSelectedListener(new DatePickerDialog.OnDateSelectedListener() {
                    @Override
                    public void onDateSelected(int[] dates) {
                        licenseIssuanceDate.setText(dates[0] + "-" + (dates[1] > 9 ? dates[1] : ("0" + dates[1])) + "-"
                                + (dates[2] > 9 ? dates[2] : ("0" + dates[2])));
                    }

                    @Override
                    public void onCancel() {

                    }
                })
                        .setSelectYear(date.get(0) - 1)
                        .setSelectMonth(date.get(1) - 1)
                        .setSelectDay(date.get(2) - 1);
                builder.setMinYear(2000);
                builder.setMaxYear(DateUtil.getYear());
                builder.setMaxMonth(DateUtil.getDateListForString(DateUtil.getToday()).get(1));
                builder.setMaxDay(DateUtil.getDateListForString(DateUtil.getToday()).get(2));
                DatePickerDialog dateDialog = builder.create();
                dateDialog.show();
            }
        });







        Button submit = (Button) findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmDrivingLicensePositiveActivity.this)
                        .setMessage("上传中...")
                        .setCancelable(false)
                        .setCancelOutside(false);
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
                            String fileString = HttpUtil.bitmapToString(getIntent().getStringExtra("filePath"));
                            Map<String, Object> parmPic = CommonUtil.getHttpParm(applicationData);
                            parmPic.put("monitorId", applicationData.getMonitorId());
                            parmPic.put("decodeImage", fileString);

                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmDrivingLicensePositiveActivity.this);
                            Log.e("压缩", fileString.length() + "    picre" + picRe);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, Object> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("monitorId", applicationData.getMonitorId());
                            parm.put("chassisNumber",chassisNumber.getText().toString());
                            parm.put("engineNumber", engineNumber.getText().toString());
                            parm.put("usingNature", usingNature.getText().toString());
                            parm.put("drivingLicenseFrontPhoto", picJsonObject.getJSONObject("obj").getString("imageFilename"));
                            parm.put("oldDrivingLicenseFrontPhoto", applicationData.getOldDrivingLicenseFrontPhoto());
                            parm.put("brandModel", brandModel.getText().toString());
                            parm.put("registrationDate", registrationDate.getText().toString().replace("-",""));
                            parm.put("licenseIssuanceDate", licenseIssuanceDate.getText().toString().replace("-",""));
                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadVehicleDriveLicenseFrontInfo, parm,ConfirmDrivingLicensePositiveActivity.this);
                            JSONObject jsonObject = JSONObject.parseObject(re);
                            if (jsonObject.getBoolean("success")) {
                                dialog.cancel();
                                CommonUtil.showToastShort(ConfirmDrivingLicensePositiveActivity.this, "上传成功");
                                Intent intent = new Intent(ConfirmDrivingLicensePositiveActivity.this, OcrVehicleMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                intent.putExtra("firstInitNumber",0);
                                intent.putExtra("secondInitNumber",0);
                                startActivity(intent);
                            } else {
                                dialog.cancel();
                                CommonUtil.showToast(ConfirmDrivingLicensePositiveActivity.this, "行驶证正面上传失败");
                            }
                        } catch (Exception e) {
                            dialog.cancel();
                            Log.e("行驶证正面上传异常", e.toString() );
                            CommonUtil.showToast(ConfirmDrivingLicensePositiveActivity.this, "行驶证正面上传异常");
                        } finally {
                            Looper.loop();
                        }
                    }
                }).start();

            }
        });

    }

}
