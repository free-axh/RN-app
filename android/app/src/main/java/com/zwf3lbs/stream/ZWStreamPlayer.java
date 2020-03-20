package com.zwf3lbs.stream;

import android.util.Log;
import android.view.Surface;
import android.view.SurfaceHolder;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class ZWStreamPlayer implements SurfaceHolder.Callback {
    private final static String TAG = "ZWStreamPlayer";

    private long nativePoint;
    private ThemedReactContext zwContext;
    private ZWOpenGLView view;
    private int width;
    private int height;
    private int sampleRate;

    public ZWStreamPlayer(ZWOpenGLView view, int sampleRate)
    {
        System.out.println("视频容器 " + view);
        System.out.println("音频采样率 " + sampleRate);
        this.nativePoint = 0;
        this.sampleRate = sampleRate;
        this.view = view;
        this.view.setPlayer(this);
        view.getHolder().addCallback(this);
    }

    @Override
    public void surfaceCreated(SurfaceHolder surfaceHolder)
    {
        Log.d(TAG, "surfaceCreated");
    }

    @Override
    public void surfaceChanged(SurfaceHolder surfaceHolder, int format, int width, int height)
    {
        Log.d(TAG, "surfaceChanged");
        this.width = width;
        this.height = height;
        if(this.nativePoint == 0 && width > 0 && height > 0)
        {
            this.nativePoint = this.nativeInitPlayer(surfaceHolder.getSurface(), width, height, this.sampleRate, 160, false);
            Log.d(TAG, String.format("Create native player. Player: %s, point: %d", this, nativePoint));
        }
        if(this.nativePoint != 0)
        {
            this.nativePlayerWindowsSize(nativePoint, width, height);
            Log.d(TAG, "Resize native player");
        }
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder surfaceHolder)
    {
        Log.d(TAG, "surfaceDestroyed");
        if(this.nativePoint != 0)
        {
            this.nativeReleasePlayer(nativePoint);
            Log.d(TAG, String.format("Release player: %s, point: %d", this, nativePoint));
            this.nativePoint = 0;
        }
    }

    public void initPlayer() {
        if (this.nativePoint != 0) {
            return;
        }
        this.nativePoint = this.nativeInitPlayer(this.view.getHolder().getSurface(), this.width, this.height, 8000, 160, false);
        Log.d(TAG, String.format("Create native player. Player: %s, point: %d", this, nativePoint));
    }

    public void deletePlayer() {
        if (this.nativePoint == 0) {
            return;
        }
        this.nativeReleasePlayer(this.nativePoint);
        Log.d(TAG, String.format("Release player: %s, point: %d", this, nativePoint));
    }

    public void onState(int state) {
        System.out.println("State is: " + state + " point: " + this.nativePoint);
        WritableMap nativeEvent = Arguments.createMap();
        nativeEvent.putInt("state", state);
        zwContext.getJSModule(RCTEventEmitter.class).receiveEvent(
            view.getId(),"topChange", nativeEvent
        );
    }

    public void setZwContext(ThemedReactContext zwContext) {
        this.zwContext = zwContext;
    }

    public void play() {
        if (nativePoint == 0) {
            return;
        }
        nativePlay(nativePoint, this.view.getSockUrl());
        Log.d(TAG, String.format("click play, uri: %s", this.view.getSockUrl()));
    }

    public void stop() {
        if (nativePoint == 0) {
            return;
        }
        nativeStop(nativePoint);
        Log.d(TAG, "click stop");
    }

    public void playAudio() {
        if (nativePoint == 0) {
            return;
        }
        nativePlayAudio(nativePoint);
        Log.d(TAG, "Play audio.");
    }

    public void stopAudio() {
        if (nativePoint == 0) {
            return;
        }
        nativeStopAudio(nativePoint);
        Log.d(TAG, "Stop audio.");
    }

    native private long nativeInitPlayer(Surface view, int width, int height, int sampleRate, int bufferSize, boolean enableAudio);
    native private void nativeReleasePlayer(long point);
    native private void nativePlayerWindowsSize(long point, int width, int height);
    native private void nativePlay(long point, String uri);
    native private void nativeStop(long point);
    native private void nativePlayAudio(long point);
    native private void nativeStopAudio(long point);

    static
    {
        System.loadLibrary("ZWStreamPlayer");
    }
}
