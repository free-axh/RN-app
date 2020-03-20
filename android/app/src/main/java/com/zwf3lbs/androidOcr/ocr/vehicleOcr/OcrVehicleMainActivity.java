package com.zwf3lbs.androidOcr.ocr.vehicleOcr;

import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.support.annotation.NonNull;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.target.Target;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.carPicture.CarPictureCameraResultActivity;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.drivingLicense.DrivingLicenseObverseCameraResultActivity;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.drivingLicense.DrivingLicensePositiveCameraResultActivity;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.professional.driverLicense.DriverLicenseCameraResultActivity;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.professional.idCard.VehicleResultChooseActivity;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.professional.qualificationCertificate.QualificationCertificateCameraResultActivity;
import com.zwf3lbs.androidOcr.ocr.vehicleOcr.transportLicense.TransportLicenseCameraResultActivity;
import com.zwf3lbs.androidOcr.ocrModule.RNBridgeModule;
import com.zwf3lbs.androidOcr.util.CommonUtil;
import com.zwf3lbs.androidOcr.util.HttpUri;
import com.zwf3lbs.androidOcr.util.HttpUtil;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


/**
 * Ocr功能入口函数
 */
public class OcrVehicleMainActivity extends AppCompatActivity implements View.OnClickListener {

    private MainApplication applicationData;
    private static Handler mainHandler;
    private ActionBar actionBar;
    private int firstInitNumber = 0;
    private int secondInitNumber = 0;
    private String oldPhotoPath;//旧的照片存储路径
    private TextView text_driving;
    private TextView text_transport;
    private TextView text_professional;
    private TextView text_car_picture;


    private final static int drivingWhat = 0;
    private final static int transportWhat = 1;
    private final static int professionalWhat = 2;
    private final static int carPictureWhat = 3;
    private final static int professionalInfos = 4;

    private ViewPager mViewPager;
    private PagerAdapter mAdapter;
    private List<View> mViews = new ArrayList<View>();

    private LinearLayout drivingLicense;
    private LinearLayout transportPermit;
    private LinearLayout professionalLicense;
    private LinearLayout vehiclePicture;

    private ImageButton drivingLicenseImg;
    private ImageButton transportPermitImg;
    private ImageButton professionalLicenseImg;
    private ImageButton vehiclePictureImg;

    //行驶证的正副切换
    private View obverseView;
    private ViewPager drivingViewPager;
    private LinearLayout drivingChange;
    private LinearLayout bottomBorder;
    private PagerAdapter drivingAdapter;
    private List<View> drivingViews = new ArrayList<View>();
    private TextView drivingLicenseObverseTextView;
    private TextView drivingLicensePositiveTextView;
    private LinearLayout drivingLicensePositiveBorder;
    private LinearLayout drivingLicenseObverseBorder;
    private Button drivingLicensePositiveCamera;
    private Button drivingLicenseObverseCamera;
    private ImageView id_pic_positive;
    private TextView chassisNumber;
    private TextView engineNumber;
    private TextView usingNature;
    private TextView brandModel;
    private TextView registrationDate;
    private TextView licenseIssuanceDate;
    private TextView totalQuality;
    private TextView validEndDate;
    private TextView profileSizeLong;
    private TextView profileSizeWide;
    private TextView profileSizeHigh;
    private ImageView id_pic_obverse;
    private RelativeLayout border;

    //运输证
    private ImageView id_pic_transport;
    private TextView transport_card_number;

    //从业人员
    private View professionalView;
    private ViewPager professionalViewPager;
    private List<View> professionalViews = new ArrayList<View>();
    private PagerAdapter professionalAdapter;
    private LinearLayout professionalChange;
    private LinearLayout professionalbottomBorder;
    private Button idCardCamera;
    private Button driverCamera;
    private Button qualificationCamera;
    private ImageView professional_more;
    private TextView professional;
    private TextView professionalTextView1;
    private TextView professionalTextView2;
    private TextView professionalTextView3;
    private LinearLayout professionalBorder1;
    private LinearLayout professionalBorder2;
    private LinearLayout professionalBorder3;
    private EditText idCardName;
    private TextView idCardGender;
    private EditText idCardNumber;
    private ImageView id_pic_idCard;
    private ImageView id_pic_driving;
    private EditText drivingLicenseNo;
    private EditText drivingType;
    private TextView drivingStartDate;
    private TextView drivingEndDate;
    private ImageView id_pic_qualification;
    private EditText qualificationCardNumber;
    private HorizontalScrollView horizontalScrollView;
    private LinearLayout scrollview_linearlayout;
    private ImageView chooseImage;
    private TextView chooseView;
    private boolean xialaFlag = false;
    private ImageButton professional_add;
    private LinearLayout professional_null;


    //车辆照片
    ImageView id_pic_car_picture;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_vehicle_main);
        applicationData = (MainApplication) getApplication();
        actionBar = getSupportActionBar();
        setInitNumber();
        startHandler();
        initView();
        getProfessionalInfos();
        initEvents();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                RNBridgeModule.getInstance().onExitOCR();
                finishAndRemoveTask();
                break;

            default:
                break;
        }
        return super.onOptionsItemSelected(item);
    }

    //设置进入主页面时进入的子菜单
    private void setInitNumber() {
        firstInitNumber = getIntent().getIntExtra("firstInitNumber", 0);
        secondInitNumber = getIntent().getIntExtra("secondInitNumber", 0);
    }

    private void getProfessionalInfos() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Looper.prepare();
                    Map<String, Object> map = CommonUtil.getHttpParm(applicationData);
                    map.put("id", applicationData.getMonitorId());
                    String personInfo = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.getProfessionalList, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONArray obj = jsonObject.getJSONArray("obj");
                    if (obj != null) {
                        Message message = new Message();
                        message.obj = obj;
                        message.what = professionalInfos;
                        mainHandler.sendMessage(message);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    Looper.loop();
                }
            }
        }).start();
    }

    private void initEvents() {
        drivingLicense.setOnClickListener(this);
        transportPermit.setOnClickListener(this);
        professionalLicense.setOnClickListener(this);
        vehiclePicture.setOnClickListener(this);

        mViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int i, float v, int i1) {

            }

            @Override
            public void onPageSelected(int i) {
                int currentItem = mViewPager.getCurrentItem();
                restImg();
                switch (currentItem) {
                    case 0:
                        CommonUtil.setActionBar(actionBar, OcrVehicleMainActivity.this, "行驶证信息");
                        drivingLicenseImg.setImageResource(R.drawable.vehicle_license_focus_icon2x);
                        text_driving.setTextColor(getResources().getColor(R.color.colorBlue));
                        break;
                    case 1:
                        CommonUtil.setActionBar(actionBar, OcrVehicleMainActivity.this, "运输证信息");
                        transportPermitImg.setImageResource(R.drawable.transport_focus_icon2x);
                        text_transport.setTextColor(getResources().getColor(R.color.colorBlue));
                        break;
                    case 2:
                        CommonUtil.setActionBar(actionBar, OcrVehicleMainActivity.this, "从业人员信息");
                        professionalLicenseImg.setImageResource(R.drawable.id_card_focus_icon2x);
                        text_professional.setTextColor(getResources().getColor(R.color.colorBlue));
                        break;
                    case 3:
                        CommonUtil.setActionBar(actionBar, OcrVehicleMainActivity.this, "车辆照片");
                        vehiclePictureImg.setImageResource(R.drawable.car_photo_focus_icon2x);
                        text_car_picture.setTextColor(getResources().getColor(R.color.colorBlue));
                        break;
                }

            }

            @Override
            public void onPageScrollStateChanged(int i) {

            }
        });
        CommonUtil.setActionBar(actionBar, this, "行驶证信息");
        drivingLicenseImg.setImageResource(R.drawable.vehicle_license_focus_icon2x);
        text_driving.setTextColor(getResources().getColor(R.color.colorBlue));
        mViewPager.setCurrentItem(firstInitNumber);

    }

    private void initView() {
        mViewPager = (ViewPager) findViewById(R.id.id_viewpager);

        text_driving = findViewById(R.id.text_driving);
        text_transport = findViewById(R.id.text_transport);
        text_professional = findViewById(R.id.text_professional);
        text_car_picture = findViewById(R.id.text_car_picture);

        drivingLicense = (LinearLayout) findViewById(R.id.id_tab_home);
        transportPermit = (LinearLayout) findViewById(R.id.id_tab_categorise);
        professionalLicense = (LinearLayout) findViewById(R.id.id_tab_discovery);
        vehiclePicture = (LinearLayout) findViewById(R.id.id_tab_me);

        drivingLicenseImg = (ImageButton) findViewById(R.id.id_tab_home_img);
        transportPermitImg = (ImageButton) findViewById(R.id.id_tab_categorise_img);
        professionalLicenseImg = (ImageButton) findViewById(R.id.id_tab_discovery_img);
        vehiclePictureImg = (ImageButton) findViewById(R.id.id_tab_me_img);

        LayoutInflater mInflater = LayoutInflater.from(this);
        View driving = mInflater.inflate(R.layout.ocr_vehicle_driving_license, null);
        View transport = mInflater.inflate(R.layout.ocr_vehicle_transport_permit, null);
        professionalView = mInflater.inflate(R.layout.ocr_vehicle_professional, null);
        View carPicture = mInflater.inflate(R.layout.ocr_vehicle_car_picture, null);


        initDrivingView(driving);
        initTransportView(transport);
        initProfessionalView(professionalView);
        initCarPictureView(carPicture);


        mViews.add(driving);
        mViews.add(transport);
        mViews.add(professionalView);
        mViews.add(carPicture);


        mAdapter = new PagerAdapter() {

            @Override
            public int getCount() {
                return mViews.size();
            }

            @NonNull
            @Override
            public Object instantiateItem(@NonNull ViewGroup container, int position) {
                View view = mViews.get(position);
                container.addView(view);
                return view;
            }

            @Override
            public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
                container.removeView(mViews.get(position));
            }

            @Override
            public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
                return view == o;
            }
        };
        mViewPager.setAdapter(mAdapter);
    }

    /**
     * 初始化行驶证上传页面
     *
     * @param idView
     */
    private void initDrivingView(View idView) {

        CommonUtil.setActionBar(actionBar, this, "行驶证信息");
        bottomBorder = idView.findViewById(R.id.id_bottom_border);
        drivingChange = idView.findViewById(R.id.change);
        border = idView.findViewById(R.id.border);

        drivingLicensePositiveTextView = idView.findViewById(R.id.id_top_1);
        drivingLicenseObverseTextView = idView.findViewById(R.id.id_top_2);
        drivingLicensePositiveBorder = idView.findViewById(R.id.id_bottom_border_1);
        drivingLicenseObverseBorder = idView.findViewById(R.id.id_bottom_border_2);

        final TextView vehicle_plant = idView.findViewById(R.id.vehicle_plant);
        vehicle_plant.setText(applicationData.getMonitorName());


        LayoutInflater mInflater = LayoutInflater.from(idView.getContext());
        View positiveView = mInflater.inflate(R.layout.ocr_vehicle_driving_license_positive, null);

        id_pic_positive = positiveView.findViewById(R.id.id_pic);
        id_pic_positive.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_positive, applicationData);
            }
        });


        chassisNumber = positiveView.findViewById(R.id.chassisNumber);
        engineNumber = positiveView.findViewById(R.id.engineNumber);
        usingNature = positiveView.findViewById(R.id.usingNature);
        brandModel = positiveView.findViewById(R.id.brandModel);
        registrationDate = positiveView.findViewById(R.id.registrationDate);
        licenseIssuanceDate = positiveView.findViewById(R.id.licenseIssuanceDate);
        drivingLicensePositiveCamera = positiveView.findViewById(R.id.submit_id);

        obverseView = mInflater.inflate(R.layout.ocr_vehicle_driving_license_obverse, null);
        id_pic_obverse = obverseView.findViewById(R.id.id_pic);
        id_pic_obverse.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_obverse, applicationData);
            }
        });


        totalQuality = obverseView.findViewById(R.id.totalQuality);
        validEndDate = obverseView.findViewById(R.id.validEndDate);
        profileSizeLong = obverseView.findViewById(R.id.profileSizeLong);
        profileSizeWide = obverseView.findViewById(R.id.profileSizeWide);
        profileSizeHigh = obverseView.findViewById(R.id.profileSizeHigh);
        drivingLicenseObverseCamera = obverseView.findViewById(R.id.submit_id);

        drivingViewPager = idView.findViewById(R.id.id_driving_license_viewpager);
        drivingViews.add(positiveView);
        //drivingViews.add(obverseView);

        border.setVisibility(View.GONE);
        drivingChange.setVisibility(View.GONE);
        bottomBorder.setVisibility(View.GONE);


        drivingAdapter = new PagerAdapter() {
            @Override
            public int getCount() {
                return drivingViews.size();
            }

            @NonNull
            @Override
            public Object instantiateItem(@NonNull ViewGroup container, int position) {
                View view = drivingViews.get(position);
                container.addView(view);
                return view;
            }

            @Override
            public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
                container.removeView(drivingViews.get(position));
            }

            @Override
            public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
                return view == o;
            }
        };
        drivingViewPager.setAdapter(drivingAdapter);


        drivingLicensePositiveTextView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                drivingViewPager.setCurrentItem(0);
            }


        });
        drivingLicenseObverseTextView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                drivingViewPager.setCurrentItem(1);
            }
        });
        drivingViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int i, float v, int i1) {

            }

            private void reset() {
                drivingLicensePositiveTextView.setTextColor(getResources().getColor(R.color.colorGrey));
                drivingLicensePositiveBorder.setBackgroundColor(getResources().getColor(R.color.colorWhite));
                drivingLicenseObverseTextView.setTextColor(getResources().getColor(R.color.colorGrey));
                drivingLicenseObverseBorder.setBackgroundColor(getResources().getColor(R.color.colorWhite));
            }

            @Override
            public void onPageSelected(int i) {
                int currentItem = drivingViewPager.getCurrentItem();
                switch (currentItem) {
                    case 0:
                        reset();
                        drivingLicensePositiveTextView.setTextColor(getResources().getColor(R.color.colorBlue));
                        drivingLicensePositiveBorder.setBackgroundColor(getResources().getColor(R.color.colorBlue));
                        break;
                    case 1:
                        reset();
                        drivingLicenseObverseTextView.setTextColor(getResources().getColor(R.color.colorBlue));
                        drivingLicenseObverseBorder.setBackgroundColor(getResources().getColor(R.color.colorBlue));
                        break;
                }
            }

            @Override
            public void onPageScrollStateChanged(int i) {
            }
        });
        //初始化行驶证页面
        drivingLicensePositiveTextView.setTextColor(getResources().getColor(R.color.colorBlue));
        drivingLicensePositiveBorder.setBackgroundColor(getResources().getColor(R.color.colorBlue));
        drivingViewPager.setCurrentItem(secondInitNumber);


        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Looper.prepare();
                    Map<String, Object> map = CommonUtil.getHttpParm(applicationData);
                    map.put("monitorId", applicationData.getMonitorId());
                    String personInfo = HttpUtil.doGET(applicationData.getServiceAddress() + HttpUri.getVehicleDriveLicenseInfo, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONObject obj = jsonObject.getJSONObject("obj");
                    if (obj != null) {
                        Message message = new Message();
                        message.what = drivingWhat;
                        message.obj = obj;
                        mainHandler.sendMessage(message);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    Looper.loop();
                }
            }
        }).start();


        drivingLicensePositiveCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(DrivingLicensePositiveCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });

        drivingLicenseObverseCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(DrivingLicenseObverseCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });
    }


    /**
     * 初始化运输证上传页面
     *
     * @param idView
     */
    private void initTransportView(View idView) {
        CommonUtil.setActionBar(actionBar, this, "运输证信息");
        final TextView vehicle_plant = idView.findViewById(R.id.vehicle_plant);
        vehicle_plant.setText(applicationData.getMonitorName());

        final Button submit_id = idView.findViewById(R.id.submit_id);
        id_pic_transport = idView.findViewById(R.id.id_pic);
        id_pic_transport.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_transport, applicationData);
            }
        });

        transport_card_number = idView.findViewById(R.id.card_number);

        submit_id.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(TransportLicenseCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });


        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Looper.prepare();
                    Map<String, Object> map = CommonUtil.getHttpParm(applicationData);
                    map.put("monitorId", applicationData.getMonitorId());
                    String personInfo = HttpUtil.doGET(applicationData.getServiceAddress() + HttpUri.getTransportNumberInfo, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONObject obj = jsonObject.getJSONObject("obj");
                    if (obj != null) {
                        Message message = new Message();
                        message.obj = obj;
                        message.what = transportWhat;
                        mainHandler.sendMessage(message);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    Looper.loop();
                }
            }
        }).start();
    }


    /**
     * 初始化从业人员页面
     *
     * @param idView
     */
    private void initProfessionalView(View idView) {

        CommonUtil.setActionBar(actionBar, this, "从业人员信息");
        final TextView vehicle_plant = idView.findViewById(R.id.vehicle_plant);
        vehicle_plant.setText(applicationData.getMonitorName());
        professional_more = idView.findViewById(R.id.professional_more);
        professional = idView.findViewById(R.id.professional);
        professional_add = idView.findViewById(R.id.professional_add);
        professional_null = idView.findViewById(R.id.professional_null);

        horizontalScrollView = idView.findViewById(R.id.scrollview);
        scrollview_linearlayout = idView.findViewById(R.id.scrollview_linearlayout);

        professionalbottomBorder = idView.findViewById(R.id.id_bottom_border);
        professionalChange = idView.findViewById(R.id. change);
        professionalTextView1 = idView.findViewById(R.id.id_top_1);
        professionalTextView2 = idView.findViewById(R.id.id_top_2);
        professionalTextView3 = idView.findViewById(R.id.id_top_3);
        professionalBorder1 = idView.findViewById(R.id.id_bottom_border_1);
        professionalBorder2 = idView.findViewById(R.id.id_bottom_border_2);
        professionalBorder3 = idView.findViewById(R.id.id_bottom_border_3);


        professionalbottomBorder.setVisibility(View.GONE);
        professionalChange.setVisibility(View.GONE);
        professional_more.setVisibility(View.GONE);
        professional.setText("--");


        professional_more.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                checkProfessional();
            }
        });

        professional.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                checkProfessional();
            }
        });

        professional_add.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setAddProfessional(true);
                applicationData.setPicResultClass(VehicleResultChooseActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });




    }

    private void checkProfessional(){
        if (applicationData.getProfessionalInfos().size() > 1) {
            if (xialaFlag) {
                professional_more.setBackgroundResource(R.drawable.xiala);
                horizontalScrollView.setVisibility(View.GONE);
                professionalbottomBorder.setVisibility(View.VISIBLE);
                professionalChange.setVisibility(View.VISIBLE);
                xialaFlag = false;
            } else {
                professional_more.setBackgroundResource(R.drawable.upback);
                professionalbottomBorder.setVisibility(View.GONE);
                professionalChange.setVisibility(View.GONE);
                horizontalScrollView.setVisibility(View.VISIBLE);
                xialaFlag = true;
            }
        }
    }

    /**
     * 初始化车辆照片上传页面
     *
     * @param idView
     */
    private void initCarPictureView(View idView) {
        CommonUtil.setActionBar(actionBar, this, "车辆照片");
        final TextView vehicle_plant = idView.findViewById(R.id.vehicle_plant);
        vehicle_plant.setText(applicationData.getMonitorName());

        final Button submit_id = idView.findViewById(R.id.submit_id);
        id_pic_car_picture = idView.findViewById(R.id.id_pic);
        id_pic_car_picture.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_car_picture, applicationData);
            }
        });


        submit_id.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(CarPictureCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Looper.prepare();
                    Map<String, Object> map = CommonUtil.getHttpParm(applicationData);
                    map.put("monitorId", applicationData.getMonitorId());
                    String personInfo = HttpUtil.doGET(applicationData.getServiceAddress() + HttpUri.getVehiclePhotoInfo, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONObject obj = jsonObject.getJSONObject("obj");
                    if (obj != null) {
                        Message message = new Message();
                        message.obj = obj;
                        message.what = carPictureWhat;
                        mainHandler.sendMessage(message);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    Looper.loop();
                }
            }
        }).start();


    }


    public void startHandler() {
        mainHandler = new Handler() {
            @Override
            public void handleMessage(Message msg) {
                // call update gui method.
                super.handleMessage(msg);
                switch (msg.what) {
                    case drivingWhat:
                        dealDrivingWhat(msg);
                        break;
                    case transportWhat:
                        dealTransportWhat(msg);
                        break;
                    case professionalWhat:
                        dealprofessionalWhat(msg);
                        break;
                    case carPictureWhat:
                        dealCarPictureWhat(msg);
                        break;
                    case professionalInfos:
                        setProfessionalInfos(msg);
                        break;
                    default:
                        break;
                }


            }

        };


    }

    private void dealDrivingWhat(Message msg) {
        JSONObject obj = (JSONObject) msg.obj;
        Log.e("dealDrivingWhat", obj.toString());
        String registration = obj.getString("registrationDate");
        String licenseIssuance = obj.getString("licenseIssuanceDate");
        if (obj.getString("standard") != null && obj.getString("standard").equals("1")) {
            drivingViews.add(obverseView);
            drivingAdapter = new PagerAdapter() {
                @Override
                public int getCount() {
                    return drivingViews.size();
                }

                @NonNull
                @Override
                public Object instantiateItem(@NonNull ViewGroup container, int position) {
                    View view = drivingViews.get(position);
                    container.addView(view);
                    return view;
                }

                @Override
                public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
                    container.removeView(drivingViews.get(position));
                }

                @Override
                public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
                    return view == o;
                }
            };
            drivingViewPager.setAdapter(drivingAdapter);
            border.setVisibility(View.VISIBLE);
            drivingChange.setVisibility(View.VISIBLE);
            bottomBorder.setVisibility(View.VISIBLE);

            drivingViewPager.setCurrentItem(secondInitNumber);
        }
        chassisNumber.setText(obj.getString("chassisNumber"));
        engineNumber.setText(obj.getString("engineNumber"));
        usingNature.setText(obj.getString("usingNature"));
        brandModel.setText(obj.getString("brandModel"));
        registrationDate.setText((registration != null && registration.length() > 10) ? registration.substring(0, 10) : registration);
        licenseIssuanceDate.setText((licenseIssuance != null && licenseIssuance.length() > 10) ? licenseIssuance.substring(0, 10) : licenseIssuance);
        applicationData.setOldDrivingLicenseFrontPhoto(obj.getString("drivingLicenseFrontPhoto"));
        String picUriPositive = applicationData.getFASTDFS_ADDRESS() + obj.getString("drivingLicenseFrontPhoto");
        Glide.with(OcrVehicleMainActivity.this)
                .load(picUriPositive)
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        id_pic_positive.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_positive.setImageBitmap(resource);
                    }

                    @Override
                    public void onLoadFailed(Exception e, Drawable errorDrawable) {
                        id_pic_positive.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_positive.setImageResource(R.drawable.driving_license_1);
                    }

                });

        String validEndTime = obj.getString("validEndDate");
        totalQuality.setText(obj.getString("totalQuality"));
        validEndDate.setText((validEndTime != null && validEndTime.length() > 7) ? validEndTime.substring(0, 7) : validEndTime);
        profileSizeLong.setText(obj.getString("profileSizeLong"));
        profileSizeWide.setText(obj.getString("profileSizeWide"));
        profileSizeHigh.setText(obj.getString("profileSizeHigh"));
        applicationData.setOldDrivingLicenseDuplicatePhoto(obj.getString("drivingLicenseDuplicatePhoto"));
        String picUriObverse = applicationData.getFASTDFS_ADDRESS() + obj.getString("drivingLicenseDuplicatePhoto");
        Glide.with(OcrVehicleMainActivity.this)
                .load(picUriObverse)
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        id_pic_obverse.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_obverse.setImageBitmap(resource);
                    }

                    @Override
                    public void onLoadFailed(Exception e, Drawable errorDrawable) {
                        id_pic_obverse.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_obverse.setImageResource(R.drawable.driving_license_2);
                    }
                });
    }

    private void dealTransportWhat(Message msg) {
        JSONObject obj = (JSONObject) msg.obj;
        transport_card_number.setText(obj.getString("transportNumber"));
        applicationData.setOldPhotoPath(obj.getString("transportNumberPhoto"));
        String picUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("transportNumberPhoto");
        Glide.with(OcrVehicleMainActivity.this)
                .load(picUri)
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        id_pic_transport.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_transport.setImageBitmap(resource);
                    }
                });
    }

    private void dealprofessionalWhat(Message msg) {
        JSONObject obj = (JSONObject) msg.obj;
        applicationData.setProfessionalType(obj.getString("positionType"));
        Log.e("dealprofessionalWhat", obj.toJSONString());
        idCardName.setText(obj.getString("name"));
        idCardGender.setText(obj.getString("gender") != null ? (obj.getString("gender").equals("1") ? "男" : "女") : null);
        idCardNumber.setText(obj.getString("identity"));
        applicationData.setOldPhotoPath(obj.getString("identityCardPhoto"));
        applicationData.setIdentity(obj.getString("identity"));
        applicationData.setIdName(obj.getString("name"));
        if (obj.getString("identityCardPhoto") != null && !obj.getString("identityCardPhoto").equals("")) {
            String picUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("identityCardPhoto");
            Glide.with(OcrVehicleMainActivity.this)
                    .load(picUri)
                    .asBitmap().into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                @Override
                public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                    id_pic_idCard.setScaleType(ImageView.ScaleType.FIT_XY);
                    id_pic_idCard.setImageBitmap(resource);
                }

                @Override
                public void onLoadFailed(Exception e, Drawable errorDrawable) {
                    id_pic_idCard.setScaleType(ImageView.ScaleType.FIT_XY);
                    id_pic_idCard.setImageResource(R.drawable.id_card);
                }
            });
        } else {
            id_pic_idCard.setScaleType(ImageView.ScaleType.FIT_XY);
            id_pic_idCard.setImageResource(R.drawable.id_card);
        }

        qualificationCardNumber.setText(obj.getString("cardNumber"));
        applicationData.setCardNumber(obj.getString("cardNumber"));
        applicationData.setOldQualificationCertificatePhoto(obj.getString("qualificationCertificatePhoto"));
        if (obj.getString("qualificationCertificatePhoto") != null && !obj.getString("qualificationCertificatePhoto").equals("")) {
            String qualificationPicUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("qualificationCertificatePhoto");
            Glide.with(OcrVehicleMainActivity.this)
                    .load(qualificationPicUri)
                    .asBitmap()
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            id_pic_qualification.setScaleType(ImageView.ScaleType.FIT_XY);
                            id_pic_qualification.setImageBitmap(resource);
                        }

                        @Override
                        public void onLoadFailed(Exception e, Drawable errorDrawable) {
                            id_pic_qualification.setScaleType(ImageView.ScaleType.FIT_XY);
                            id_pic_qualification.setImageResource(R.drawable.driver_license);
                        }
                    });
        } else {
            id_pic_qualification.setScaleType(ImageView.ScaleType.FIT_XY);
            id_pic_qualification.setImageResource(R.drawable.driver_license);
        }

        applicationData.setDrivingLicenseNo(obj.getString("drivingLicenseNo"));
        drivingLicenseNo.setText(obj.getString("drivingLicenseNo"));
        drivingType.setText(obj.getString("drivingType"));
        String sd = obj.getString("drivingStartDate");
        String ed = obj.getString("drivingEndDate");
        drivingStartDate.setText((sd != null && sd.length() > 10) ? sd.substring(0, 10) : sd);
        drivingEndDate.setText((ed != null && ed.length() > 10) ? ed.substring(0, 10) : ed);
        applicationData.setOldDriverLicensePhoto(obj.getString("driverLicensePhoto"));
        if (obj.getString("driverLicensePhoto") != null && !obj.getString("driverLicensePhoto").equals("")) {
            String driverPic = applicationData.getFASTDFS_ADDRESS() + obj.getString("driverLicensePhoto");
            Glide.with(OcrVehicleMainActivity.this)
                    .load(driverPic)
                    .asBitmap()
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            id_pic_driving.setScaleType(ImageView.ScaleType.FIT_XY);
                            id_pic_driving.setImageBitmap(resource);
                        }

                        @Override
                        public void onLoadFailed(Exception e, Drawable errorDrawable) {
                            id_pic_driving.setScaleType(ImageView.ScaleType.FIT_XY);
                            id_pic_driving.setImageResource(R.drawable.driver_license);
                        }
                    });
        } else {
            id_pic_driving.setScaleType(ImageView.ScaleType.FIT_XY);
            id_pic_driving.setImageResource(R.drawable.driver_license);
        }

    }


    private void dealCarPictureWhat(Message msg) {
        JSONObject obj = (JSONObject) msg.obj;
        applicationData.setOldPhotoPath(obj.getString("vehiclePhoto"));
        String picUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("vehiclePhoto");
        Glide.with(OcrVehicleMainActivity.this)
                .load(picUri)
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        id_pic_car_picture.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_car_picture.setImageBitmap(resource);
                    }
                });
    }


    private void setProfessionalInfos(Message msg) {
        JSONArray obj = (JSONArray) msg.obj;
        Log.e(" setProfessionalInfos", obj.toJSONString());
        Map<String, String> prpfessionalInfos = new LinkedHashMap<>();
        for (int i = obj.size() - 1; i >= 0; i--) {
            JSONObject jb = JSONObject.parseObject(obj.get(i).toString());
            prpfessionalInfos.put(jb.getString("name"), jb.getString("id"));
        }
        applicationData.setProfessionalInfos(prpfessionalInfos);

        if (prpfessionalInfos.size() <= 0) {
            return;
        }

        professionalbottomBorder.setVisibility(View.VISIBLE);
        professionalChange.setVisibility(View.VISIBLE);
        horizontalScrollView.setVisibility(View.GONE);
        professional_null.setVisibility(View.GONE);

        professional.setText(applicationData.getProfessionalInfos().entrySet().iterator().next().getKey());
        applicationData.setProfessionalId(applicationData.getProfessionalInfos().entrySet().iterator().next().getValue());
        applicationData.setProfessionalName(applicationData.getProfessionalInfos().entrySet().iterator().next().getKey());


        //初始化选择从业人员滑动框
        for (Map.Entry entry : applicationData.getProfessionalInfos().entrySet()) {
            LayoutInflater mInflater1 = LayoutInflater.from(OcrVehicleMainActivity.this);
            View linearLayout = mInflater1.inflate(R.layout.ocr_vehicle_professional_professional_choose, null);
            ImageView imageView = linearLayout.findViewById(R.id.professional_choose);
            TextView textView = linearLayout.findViewById(R.id.professional);
            textView.setText((String) entry.getKey());
            if (entry.getValue().equals(applicationData.getProfessionalId())) {
                imageView.setImageResource(R.drawable.renyuan);
                textView.setTextColor(getResources().getColor(R.color.colorOrange));
                chooseImage = imageView;
                chooseView = textView;
            }
            scrollview_linearlayout.addView(linearLayout);

            linearLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    chooseImage.setImageResource(R.drawable.renyuan);
                    chooseView.setTextColor(getResources().getColor(R.color.colorBlack));
                    chooseImage = v.findViewById(R.id.professional_choose);
                    chooseView = v.findViewById(R.id.professional);
                    chooseImage.setImageResource(R.drawable.renyuan);
                    chooseView.setTextColor(getResources().getColor(R.color.colorOrange));
                    applicationData.setProfessionalId(applicationData.getProfessionalInfos().get(chooseView.getText().toString()));
                    applicationData.setProfessionalName(chooseView.getText().toString());
                    professional.setText(chooseView.getText().toString());

                    horizontalScrollView.setVisibility(View.GONE);
                    professionalbottomBorder.setVisibility(View.VISIBLE);
                    professionalChange.setVisibility(View.VISIBLE);
                    professional_more.setBackgroundResource(R.drawable.xiala);
                    xialaFlag = false;

                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                Looper.prepare();
                                Map<String, Object> map = CommonUtil.getHttpParm(applicationData);
                                map.put("id", applicationData.getProfessionalId());
                                String personInfo = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.getProfessionalInfo, map, OcrVehicleMainActivity.this);
                                JSONObject jsonObject = JSONObject.parseObject(personInfo);
                                JSONObject ob = jsonObject.getJSONObject("obj");
                                if (ob != null) {
                                    Message message = new Message();
                                    message.what = professionalWhat;
                                    message.obj = ob;
                                    mainHandler.sendMessage(message);
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            } finally {
                                Looper.loop();
                            }
                        }
                    }).start();
                }
            });

        }

        LayoutInflater mInflater = LayoutInflater.from(professionalView.getContext());
        View icard = mInflater.inflate(R.layout.ocr_vehicle_professional_idcard, null);
        idCardCamera = icard.findViewById(R.id.submit_id);
        idCardName = icard.findViewById(R.id.id_name);
        idCardGender = icard.findViewById(R.id.id_sex);
        idCardNumber = icard.findViewById(R.id.id_number);
        id_pic_idCard = icard.findViewById(R.id.id_pic);
        id_pic_idCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_idCard, applicationData);
            }
        });


        View driver = mInflater.inflate(R.layout.ocr_vehicle_professional_driver, null);
        driverCamera = driver.findViewById(R.id.submit_id);
        drivingLicenseNo = driver.findViewById(R.id.id_driver_number);
        drivingType = driver.findViewById(R.id.id_car_type);
        drivingStartDate = driver.findViewById(R.id.id_start_date);
        drivingEndDate = driver.findViewById(R.id.id_end_date);
        id_pic_driving = driver.findViewById(R.id.id_pic);
        id_pic_driving.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_driving, applicationData);
            }
        });


        View qualification = mInflater.inflate(R.layout.ocr_vehicle_professional_qualification, null);
        qualificationCamera = qualification.findViewById(R.id.submit_id);
        qualificationCardNumber = qualification.findViewById(R.id.card_number);
        id_pic_qualification = qualification.findViewById(R.id.id_pic);
        id_pic_qualification.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_qualification, applicationData);
            }
        });

        professionalViewPager = professionalView.findViewById(R.id.id_professional_license_viewpager);

        professionalViews.add(icard);
        professionalViews.add(driver);
        professionalViews.add(qualification);


        professionalAdapter = new PagerAdapter() {
            @Override
            public int getCount() {
                return professionalViews.size();
            }

            @NonNull
            @Override
            public Object instantiateItem(@NonNull ViewGroup container, int position) {
                View view = professionalViews.get(position);
                container.addView(view);
                return view;
            }

            @Override
            public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
                container.removeView(professionalViews.get(position));
            }

            @Override
            public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
                return view == o;
            }
        };
        professionalViewPager.setAdapter(professionalAdapter);


        professionalTextView1.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                professionalViewPager.setCurrentItem(0);
            }
        });
        professionalTextView2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                professionalViewPager.setCurrentItem(1);
            }
        });
        professionalTextView3.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                professionalViewPager.setCurrentItem(2);
            }
        });

        professionalViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int i, float v, int i1) {

            }

            private void reset() {
                professionalTextView1.setTextColor(getResources().getColor(R.color.colorGrey));
                professionalBorder1.setBackgroundColor(getResources().getColor(R.color.colorWhite));
                professionalTextView2.setTextColor(getResources().getColor(R.color.colorGrey));
                professionalBorder2.setBackgroundColor(getResources().getColor(R.color.colorWhite));
                professionalTextView3.setTextColor(getResources().getColor(R.color.colorGrey));
                professionalBorder3.setBackgroundColor(getResources().getColor(R.color.colorWhite));
            }

            @Override
            public void onPageSelected(int i) {
                int currentItem = professionalViewPager.getCurrentItem();
                switch (currentItem) {
                    case 0:
                        reset();
                        if (applicationData.getProfessionalInfos().size() > 1) {
                            professional_more.setVisibility(View.VISIBLE);
                        } else {
                            professional_more.setVisibility(View.GONE);
                        }
                        professionalTextView1.setTextColor(getResources().getColor(R.color.colorBlue));
                        professionalBorder1.setBackgroundColor(getResources().getColor(R.color.colorBlue));
                        break;
                    case 1:
                        reset();
                        //professional_more.setVisibility(View.GONE);
                        professionalTextView2.setTextColor(getResources().getColor(R.color.colorBlue));
                        professionalBorder2.setBackgroundColor(getResources().getColor(R.color.colorBlue));
                        break;
                    case 2:
                        reset();
                        //professional_more.setVisibility(View.GONE);
                        professionalTextView3.setTextColor(getResources().getColor(R.color.colorBlue));
                        professionalBorder3.setBackgroundColor(getResources().getColor(R.color.colorBlue));
                        break;
                }
            }

            @Override
            public void onPageScrollStateChanged(int i) {
            }
        });
        //初始从业人员页面
        //判断人员下拉按钮是否可见
        if (applicationData.getProfessionalInfos().size() > 1) {
            professional_more.setBackgroundResource(R.drawable.xiala);
            professional_more.setVisibility(View.VISIBLE);
        } else {
            professional_more.setVisibility(View.GONE);
        }
        professionalTextView1.setTextColor(getResources().getColor(R.color.colorBlue));
        professionalBorder1.setBackgroundColor(getResources().getColor(R.color.colorBlue));
        professionalViewPager.setCurrentItem(secondInitNumber);


        idCardCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setAddProfessional(false);
                applicationData.setPicResultClass(VehicleResultChooseActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });

        driverCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(DriverLicenseCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });

        qualificationCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(QualificationCertificateCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });


        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Looper.prepare();
                    Map<String, Object> map = CommonUtil.getHttpParm(applicationData);
                    map.put("id", applicationData.getProfessionalId());
                    String personInfo = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.getProfessionalInfo, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONObject ob = jsonObject.getJSONObject("obj");
                    if (ob != null) {
                        Message message = new Message();
                        message.what = professionalWhat;
                        message.obj = ob;
                        mainHandler.sendMessage(message);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    Looper.loop();
                }
            }
        }).start();
    }


    @Override
    public void onClick(View v) {
        restImg();
        switch (v.getId()) {
            case R.id.id_tab_home:
                mViewPager.setCurrentItem(0);
                break;
            case R.id.id_tab_categorise:
                mViewPager.setCurrentItem(1);
                break;
            case R.id.id_tab_discovery:
                mViewPager.setCurrentItem(2);
                break;
            case R.id.id_tab_me:
                mViewPager.setCurrentItem(3);
                break;
        }
    }

    private void restImg() {
        drivingLicenseImg.setImageResource(R.drawable.vehicle_license_blur_icon2x);
        transportPermitImg.setImageResource(R.drawable.transport_blur_icon2x);
        professionalLicenseImg.setImageResource(R.drawable.id_card_blur_icon2x);
        vehiclePictureImg.setImageResource(R.drawable.car_photo_blur_icon2x);
        text_driving.setTextColor(getResources().getColor(R.color.colorGrey));
        text_transport.setTextColor(getResources().getColor(R.color.colorGrey));
        text_professional.setTextColor(getResources().getColor(R.color.colorGrey));
        text_car_picture.setTextColor(getResources().getColor(R.color.colorGrey));
    }

    private void resDrivingLicense() {

    }
}
