package com.zwf3lbs.zwf3lbsapp;

import android.app.Application;
import android.graphics.Bitmap;

import com.tencent.bugly.crashreport.CrashReport;
import com.umeng.commonsdk.UMConfigure;
import com.umeng.socialize.PlatformConfig;
import com.zwf3lbs.androidOcr.util.layout.RudenessScreenHelper;
import com.zwf3lbs.baiduManage.BaiduMapViewPackage;
import com.facebook.react.ReactApplication;
import com.beefe.picker.PickerViewPackage;
import com.mehcode.reactnative.splashscreen.SplashScreenPackage;
import fr.greweb.reactnativeviewshot.RNViewShotPackage;
import com.horcrux.svg.SvgPackage;
import com.react.rnspinkit.RNSpinkitPackage;
import com.zmxv.RNSound.RNSoundPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.zwf3lbs.panorama.MyPanoraPackage;
import com.zwf3lbs.share.DplusReactPackage;
import com.zwf3lbs.share.RNUMConfigure;
import com.zwf3lbs.stream.StreamPlayerPackage;//音视频

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
          new PickerViewPackage(),
          new SplashScreenPackage(),
          new RNViewShotPackage(),
          new ReactVideoPackage(),
          new SvgPackage(),
          new RNSpinkitPackage(),
          new LinearGradientPackage(),
          new RNSoundPackage(),
          new BaiduMapViewPackage(getApplicationContext()),
          new MyPanoraPackage(getApplicationContext()),
          new StreamPlayerPackage(), //音视频
          new DplusReactPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    //安卓屏幕自适应
    new RudenessScreenHelper(this, 350, 820).activate();
    CrashReport.initCrashReport(getApplicationContext(), "b184ee4b59", true);
    SoLoader.init(this, /* native exopackage */ false);
    CrashHandler.getInstance().init(this);

    SoLoader.init(this,false);
//    Config.shareType = "react native";
//    UMConfigure.init(this,"5d6cd0f63fc195913c0000ec","umeng",UMConfigure.DEVICE_TYPE_PHONE,"");
    RNUMConfigure.init(this, "5d7f56dd3fc195a8e4000e16", "Umeng", UMConfigure.DEVICE_TYPE_PHONE,
            "");
  }

  // 配置平台
  {
    PlatformConfig.setWeixin("wx4f7d606dde72cc1d", "ec7c6e1c762314a596ee8606154db647");
    PlatformConfig.setQQZone("1106561424", "ArH8OHXaNVU1hdB4");
  }


  //ocr
  private String serviceAddress;

  private String access_token;//token

  private String monitorId; //监控对象id

  private String monitorName;

  private String platform;

  private  Class<?>  picResultClass;

  private String version;

  //fastdfs地址
  private String FASTDFS_ADDRESS;

  private String oldPhotoPath;//旧的人员身份证照片存储路径

  private String oldDrivingLicenseFrontPhoto;//旧的行驶证正面照片地址

  private String oldDrivingLicenseDuplicatePhoto;//旧的行驶证副面照片地址

  private String oldDriverLicensePhoto;//旧的驾驶证照片地址

  private String oldQualificationCertificatePhoto;//旧的从业资格证照片地址

  //fe75ffc3-1689-4fb1-a4ec-121b2f4d47ec,64b0b86c-ce77-491a-8ad2-5a873789e23f,1ffe4d77-43a9-456a-a79b-86000a1dab96
  private String professionalId;

  private String professionalName;

  //从也人员类型
  private String professionalType;

  //ic卡岗位类型
  private static String IcProfessionalType = "ed057aa7-64b8-4ec1-9b14-dbc62b4286d4";

  //标记是否是新增从业人员
  private boolean isAddProfessional = false;

  //姓名
  private String idName;

  private String drivingLicenseNo;

  private String identity;

  private String cardNumber;

  private Map<String,String> professionalInfos = new LinkedHashMap<>();

  private Bitmap bigPic;


  public ReactNativeHost getmReactNativeHost() {
    return mReactNativeHost;
  }

  public String getServiceAddress() {
    return serviceAddress;
  }

  public void setServiceAddress(String serviceAddress) {
    this.serviceAddress = serviceAddress;
  }

  public String getAccess_token() {
    return access_token;
  }

  public void setAccess_token(String access_token) {
    this.access_token = access_token;
  }

  public String getMonitorId() {
    return monitorId;
  }

  public void setMonitorId(String monitorId) {
    this.monitorId = monitorId;
  }

  public String getMonitorName() {
    return monitorName;
  }

  public void setMonitorName(String monitorName) {
    this.monitorName = monitorName;
  }

  public String getPlatform() {
    return platform;
  }

  public void setPlatform(String platform) {
    this.platform = platform;
  }

  public Class<?> getPicResultClass() {
    return picResultClass;
  }

  public void setPicResultClass(Class<?> picResultClass) {
    this.picResultClass = picResultClass;
  }

  public String getVersion() {
    return version;
  }

  public void setVersion(String version) {
    this.version = version;
  }

  public String getFASTDFS_ADDRESS() {
    return FASTDFS_ADDRESS;
  }

  public void setFASTDFS_ADDRESS(String FASTDFS_ADDRESS) {
    this.FASTDFS_ADDRESS = FASTDFS_ADDRESS;
  }

  public String getOldPhotoPath() {
    return oldPhotoPath;
  }

  public void setOldPhotoPath(String oldPhotoPath) {
    this.oldPhotoPath = oldPhotoPath;
  }

  public String getOldDrivingLicenseFrontPhoto() {
    return oldDrivingLicenseFrontPhoto;
  }

  public void setOldDrivingLicenseFrontPhoto(String oldDrivingLicenseFrontPhoto) {
    this.oldDrivingLicenseFrontPhoto = oldDrivingLicenseFrontPhoto;
  }

  public String getOldDrivingLicenseDuplicatePhoto() {
    return oldDrivingLicenseDuplicatePhoto;
  }

  public void setOldDrivingLicenseDuplicatePhoto(String oldDrivingLicenseDuplicatePhoto) {
    this.oldDrivingLicenseDuplicatePhoto = oldDrivingLicenseDuplicatePhoto;
  }

  public String getOldDriverLicensePhoto() {
    return oldDriverLicensePhoto;
  }

  public void setOldDriverLicensePhoto(String oldDriverLicensePhoto) {
    this.oldDriverLicensePhoto = oldDriverLicensePhoto;
  }

  public String getOldQualificationCertificatePhoto() {
    return oldQualificationCertificatePhoto;
  }

  public void setOldQualificationCertificatePhoto(String oldQualificationCertificatePhoto) {
    this.oldQualificationCertificatePhoto = oldQualificationCertificatePhoto;
  }

  public String getProfessionalId() {
    return professionalId;
  }

  public void setProfessionalId(String professionalId) {
    this.professionalId = professionalId;
  }

  public String getProfessionalName() {
    return professionalName;
  }

  public void setProfessionalName(String professionalName) {
    this.professionalName = professionalName;
  }

  public String getProfessionalType() {
    return professionalType;
  }

  public void setProfessionalType(String professionalType) {
    this.professionalType = professionalType;
  }

  public static String getIcProfessionalType() {
    return IcProfessionalType;
  }

  public static void setIcProfessionalType(String icProfessionalType) {
    IcProfessionalType = icProfessionalType;
  }

  public boolean isAddProfessional() {
    return isAddProfessional;
  }

  public void setAddProfessional(boolean addProfessional) {
    isAddProfessional = addProfessional;
  }

  public String getIdName() {
    return idName;
  }

  public void setIdName(String idName) {
    this.idName = idName;
  }

  public String getDrivingLicenseNo() {
    return drivingLicenseNo;
  }

  public void setDrivingLicenseNo(String drivingLicenseNo) {
    this.drivingLicenseNo = drivingLicenseNo;
  }

  public String getIdentity() {
    return identity;
  }

  public void setIdentity(String identity) {
    this.identity = identity;
  }

  public String getCardNumber() {
    return cardNumber;
  }

  public void setCardNumber(String cardNumber) {
    this.cardNumber = cardNumber;
  }

  public Map<String, String> getProfessionalInfos() {
    return professionalInfos;
  }

  public void setProfessionalInfos(Map<String, String> professionalInfos) {
    this.professionalInfos = professionalInfos;
  }

  public Bitmap getBigPic() {
    return bigPic;
  }

  public void setBigPic(Bitmap bigPic) {
    this.bigPic = bigPic;
  }
}
