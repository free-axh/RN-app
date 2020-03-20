package com.zwf3lbs.panorama;

import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.baidu.lbsapi.panoramaview.PanoramaView;
import com.zwf3lbs.zwf3lbsapp.R;

public class MyInstanceView extends PanoramaView {
    private View view;
    private Button button;
    private TextView textView;
    private Context context;
    public MyInstanceView(Context context) {
        super(context);
        view = LayoutInflater.from(context).inflate(R.layout.panodemo_main, this);
    }

    public MyInstanceView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public MyInstanceView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
    }
    public void initView(){
        button = view.findViewById(R.id.bt1);
        textView = view.findViewById(R.id.tx1);
    }
    public void setTextViewContent(String string){
        textView.setText(string);
    }

    public View getView() {
        return view;
    }

    @Override
    public void destroy() {
        super.destroy();
    }
}
