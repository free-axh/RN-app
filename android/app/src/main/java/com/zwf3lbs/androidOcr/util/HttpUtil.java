package com.zwf3lbs.androidOcr.util;



import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Map;


import static com.baidu.ocr.sdk.utils.ImageUtil.calculateInSampleSize;


public class HttpUtil {

    private static final String DEF_CHATSET = "UTF-8";
    private static String userAgent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.66 Safari/537.36";
    private static int DEF_CONN_TIMEOUT = 10000;

    private static final int TIME_OUT = 10*10000000; //超时时间
    private static final String CHARSET = "utf-8"; //设置编码
    private static final String PREFIX="--";
    private static final String LINE_END="\n\r";


    /**
     * 通过URL从服务器上下载下来，保存为字符串，以便待会进行JSON解析
     * @param strUrl
     * @return
     */
    public static String doGET(String strUrl, Map params, Context context) throws Exception {
        HttpURLConnection conn = null;
        BufferedReader reader = null;
        String rs = null;
        try {
            StringBuffer sb = new StringBuffer();
            strUrl = strUrl + "?" + urlencode(params);
            URL url = new URL(strUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-agent", userAgent);
            conn.setUseCaches(false);
            conn.setConnectTimeout(DEF_CONN_TIMEOUT);
            conn.setReadTimeout(DEF_CONN_TIMEOUT);
            conn.setInstanceFollowRedirects(false);
            conn.connect();
            if (conn.getResponseCode() == 401) {
                CommonUtil.showToast(context,"登录失效，请重新登录");
            }
            InputStream is = conn.getInputStream();
            reader = new BufferedReader(new InputStreamReader(is, DEF_CHATSET));
            String strRead = null;
            while ((strRead = reader.readLine()) != null) {
                sb.append(strRead);
            }
            rs = sb.toString();
        } catch (Exception e) {
            // TODO: handle exception
            e.printStackTrace();
        } finally {
            if (reader != null) {
                reader.close();
            }
            if (conn != null) {
                conn.disconnect();
            }
        }
        return rs;
    }


    // 将map型转为请求参数型
    private static String urlencode(Map<String, Object> params) {
        // TODO Auto-generated method stub
        StringBuilder sb = new StringBuilder();
        for (Map.Entry i : params.entrySet()) {
            try {
                if(i.getValue() == null) {
                    continue;
                }
                sb.append(i.getKey()).append("=")
                        .append(URLEncoder.encode(i.getValue().toString(), "utf-8"))
                        .append("&");
            } catch (Exception e) {
                // TODO: handle exception
                e.printStackTrace();
            }
        }
        return sb.toString();
    }

    public static String doPOST(String strUrl, Map params, Context context) throws Exception {
        HttpURLConnection conn = null;
        BufferedReader reader = null;
        String rs = null;
        try {
            StringBuffer sb = new StringBuffer();
            URL url = new URL(strUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoInput(true);
            conn.setDoOutput(true);
            conn.setRequestProperty("User-agent", userAgent);
            conn.setUseCaches(false);
            conn.setConnectTimeout(DEF_CONN_TIMEOUT);
            conn.setReadTimeout(DEF_CONN_TIMEOUT);
            conn.setInstanceFollowRedirects(false);
            conn.connect();
            DataOutputStream out = new DataOutputStream(conn.getOutputStream());
            out.writeBytes(urlencode(params));
            if (conn.getResponseCode() == 401) {
                CommonUtil.showToastShort(context,"登录失效，请重新登录");
            }
            InputStream is = conn.getInputStream();
            reader = new BufferedReader(new InputStreamReader(is, DEF_CHATSET));
            String strRead = null;
            while ((strRead = reader.readLine()) != null) {
                sb.append(strRead);
            }
            rs = sb.toString();
        } catch (Exception e) {
            e.printStackTrace();
            // TODO: handle exception
        } finally {
            if (reader != null) {
                reader.close();
            }
            if (conn != null) {
                conn.disconnect();
            }
        }
        return rs;
    }





    //把bitmap转换成String
    public static String bitmapToString(String filePath) {
        try {
            Bitmap bit = BitmapFactory.decodeFile(filePath);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bit.compress(Bitmap.CompressFormat.JPEG, 100, baos);
            byte [] b = baos.toByteArray();
            baos.close();
            return  net.iharder.Base64.encodeBytes(b);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    // 根据路径获得图片并压缩，返回bitmap用于显示
    public static Bitmap getSmallBitmap(String filePath) {
        final BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(filePath, options);

        // Calculate inSampleSize
        options.inSampleSize = calculateInSampleSize(options, 480, 800);

        // Decode bitmap with inSampleSize set
        options.inJustDecodeBounds = false;
        return BitmapFactory.decodeFile(filePath, options);
    }


    // 二进制转字符串
    public static String byte2hex(byte[] byteArray)
    {
        StringBuffer hexString = new StringBuffer();
        for (int i = 0; i < byteArray.length; i++) {
            if ((byteArray[i] & 0xff) < 0x10)//0~F前面不零
                hexString.append("0");
            hexString.append(Integer.toHexString(0xFF & byteArray[i]));
        }
        return hexString.toString().toLowerCase();
    }
}
