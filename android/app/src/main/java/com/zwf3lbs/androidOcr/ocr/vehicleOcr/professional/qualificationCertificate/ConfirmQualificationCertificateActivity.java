package com.zwf3lbs.androidOcr.ocr.vehicleOcr.professional.qualificationCertificate;

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
import com.zwf3lbs.androidOcr.util.HttpUri;
import com.zwf3lbs.androidOcr.util.HttpUtil;
import com.zwf3lbs.androidOcr.util.loadingDialogUtil.LoadingDialog;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmQualificationCertificateActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private TextView vehicle_plant;

    private TextView professional;

    private ActionBar actionBar;

    private ImageView id_pic;

    private EditText card_number;

    private LoadingDialog dialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_qualification_certificate);
        applicationData = (MainApplication)getApplicationContext();
        actionBar = getSupportActionBar();
        CommonUtil.setActionBar(actionBar, this, "确认信息");

        vehicle_plant = findViewById(R.id.vehicle_plant);
        professional = findViewById(R.id.professional);
        id_pic = findViewById(R.id.id_pic);
        card_number = findViewById(R.id.card_number);

        vehicle_plant.setText(applicationData.getMonitorName());
        professional.setText(applicationData.getProfessionalName());

        if(applicationData.getProfessionalType() != null && applicationData.getProfessionalType().equals(applicationData.getIcProfessionalType())) {
            card_number.setText(applicationData.getCardNumber());
            card_number.setEnabled(false);
        } else {
            card_number.setText(getIntent().getStringExtra("card_number"));
        }

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));


        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmQualificationCertificateActivity.this, id_pic, applicationData);
            }
        });


        Button submit = (Button) findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmQualificationCertificateActivity.this)
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
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmQualificationCertificateActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, Object> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("vehicleId", applicationData.getMonitorId());
                            parm.put("oldPhoto", applicationData.getOldQualificationCertificatePhoto());
                            parm.put("type", "3");

                            JSONObject jsonObject = new JSONObject();
                            jsonObject.put("id",applicationData.getProfessionalId());
                            jsonObject.put("card_number",card_number.getText().toString());
                            jsonObject.put("qualification_certificate_photo", picJsonObject.getJSONObject("obj").getString("imageFilename"));

                            parm.put("info",jsonObject.toJSONString());

                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadProfessional, parm,ConfirmQualificationCertificateActivity.this);
                            JSONObject r = JSONObject.parseObject(re);
                            JSONObject obj = r.getJSONObject("obj");
                            if (r.getBoolean("success") && obj.getString("flag").equals("1")) {
                                dialog.cancel();
                                CommonUtil.showToastShort(ConfirmQualificationCertificateActivity.this, "上传成功");
                                Intent intent = new Intent(ConfirmQualificationCertificateActivity.this, OcrVehicleMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                intent.putExtra("firstInitNumber",2);
                                intent.putExtra("secondInitNumber",2);
                                startActivity(intent);
                            } else {
                                dialog.cancel();
                                CommonUtil.showToast(ConfirmQualificationCertificateActivity.this, obj.getString("msg"));
                            }
                        } catch (Exception e) {
                            dialog.cancel();
                            Log.e("从业资格证上传异常", e.toString() );
                            CommonUtil.showToast(ConfirmQualificationCertificateActivity.this, "从业资格证上传异常");
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
