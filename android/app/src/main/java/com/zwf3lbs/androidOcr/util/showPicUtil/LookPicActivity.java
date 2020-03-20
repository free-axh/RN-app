package com.zwf3lbs.androidOcr.util.showPicUtil;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.ImageView;

import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

public class LookPicActivity extends AppCompatActivity {
    private ImageView imageView;

    private MainApplication application;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.big_pic);
        application = (MainApplication) getApplication();
        imageView = findViewById(R.id.imageview);
        Bitmap bitmap  = application.getBigPic();
        imageView.setImageBitmap(bitmap);
        application.setBigPic(null);
        imageView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
    }
}
