package com.zwf3lbs.stream;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.AttributeSet;
import android.util.Log;
import android.view.PixelCopy;
import android.view.SurfaceView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.ref.WeakReference;

public class ZWOpenGLView extends SurfaceView {
    private final static String TAG = "ZWOpenGLView";
    private String sockUrl;
    private ZWStreamPlayer player;

    public ZWOpenGLView(Context context) {
        super(context);
    }

    public ZWOpenGLView(Context context, AttributeSet attributeSet) {
        super(context, attributeSet);
    }

    public ZWOpenGLView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
    }

    public String getSockUrl() {
        return sockUrl;
    }

    public void setSockUrl(String sockUrl) {
        this.sockUrl = sockUrl;
    }

    public ZWStreamPlayer getPlayer() {
        return player;
    }

    public void setPlayer(ZWStreamPlayer player) {
        this.player = player;
    }

    @TargetApi(Build.VERSION_CODES.N)
    public void capture() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            Toast toast = Toast.makeText(ZWOpenGLView.this.getContext(),
                    "Android版本不支持", Toast.LENGTH_LONG);
            toast.show();
            return;
        }
        CaptureTask task = new CaptureTask(this);
        task.execute(this.getWidth(), this.getHeight());

    }

    private static class CaptureTask extends AsyncTask<Integer, Void, Void> {

        private final WeakReference<ZWOpenGLView> view;

        private CaptureTask(ZWOpenGLView view) {
            this.view = new WeakReference<>(view);
        }

        @TargetApi(Build.VERSION_CODES.N)
        @Override
        protected Void doInBackground(Integer... params) {
            // Create a bitmap the size of the scene view.
            final Bitmap bitmap = Bitmap.createBitmap(params[0], params[1], Bitmap.Config.ARGB_8888);

            // Create a handler thread to offload the processing of the image.
            final HandlerThread handlerThread = new HandlerThread("PixelCopier");
            handlerThread.start();
            // Make the request to copy.
            PixelCopy.request(view.get(), bitmap, new PixelCopy.OnPixelCopyFinishedListener() {
                @Override
                public void onPixelCopyFinished(int copyResult) {
                    if (copyResult == PixelCopy.SUCCESS) {
                        Log.e(TAG, bitmap.toString());
                        String name = System.currentTimeMillis() + ".jpg";
                        File imageFile = store(bitmap, name);
                        Log.d(TAG, "store file: " + imageFile.getPath());
                    } else {
                        Toast toast = Toast.makeText(view.get().getContext(),
                                                     "Failed to copyPixels: " + copyResult, Toast.LENGTH_LONG);
                        toast.show();
                    }
                    handlerThread.quitSafely();
                }
            }, new Handler(handlerThread.getLooper()));
            return null;
        }

        private File store(Bitmap bitmap, String name) {
            File image = new File(Environment.getExternalStorageDirectory() + "/" + Environment.DIRECTORY_DCIM + "/" + name);
            FileOutputStream fos;
            try {
                fos = new FileOutputStream(image);
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
                fos.flush();
                fos.close();
            } catch (IOException e) {
                Log.e(TAG, e.getMessage(), e);
            }
            return image;
        }
    }
}
