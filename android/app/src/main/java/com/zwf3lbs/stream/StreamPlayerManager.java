package com.zwf3lbs.stream;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;


public class StreamPlayerManager extends SimpleViewManager<ZWOpenGLView> {
    private static final String REACT_CLASS = "ZWVideoView";//组件名称
    private static final int COMMAND_PLAY_ID = 1;
    private static final int COMMAND_STOP_ID = 2;
    private static final int COMMAND_CAPTURE_ID = 3;
    private static final String COMMAND_PLAY_NAME = "play";
    private static final String COMMAND_STOP_NAME = "stop";
    private static final String COMMAND_CAPTURE_NAME = "capture";

    /**
     设置引用名
     */
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    /**
     创建ui组件实例
     */
    protected ZWOpenGLView createViewInstance(ThemedReactContext reactContext) {
        ZWOpenGLView openGLView = new ZWOpenGLView(reactContext);
        System.out.println("ZWOpenGLView created.");

        return openGLView;
    }

    /**
     获取音视频uri
     */
    @ReactProp(name="socketUrl")
    public void setSocketUrl(ZWOpenGLView openGLView, String socketUrl){
        System.out.println("socketUrl " + socketUrl);
        openGLView.setSockUrl(socketUrl);
    }

    private void initPlayer(ZWOpenGLView openGLView) {
        ZWStreamPlayer player = openGLView.getPlayer();
        if (player != null) {
            return;
        }
        player = new ZWStreamPlayer(openGLView,8000);
        player.setZwContext((ThemedReactContext) openGLView.getContext());
        player.initPlayer();
        System.out.println("player: " + player);
    }

    /**
     打开关闭音视频
     */
    @ReactProp(name="ifOpenVideo")
    public void setIfOpenVideo(ZWOpenGLView openGLView, Boolean ifOpenVideo){
        if (ifOpenVideo) {
            initPlayer(openGLView);
            play(openGLView);
            return;
        }
        stop(openGLView);
    }

    /**
     打开关闭音频
     */
    @ReactProp(name="ifOpenAudio")
    public void setIfOpenAudio(ZWOpenGLView openGLView, Boolean ifOpenAudio){
        if (ifOpenAudio) {
            playAudio(openGLView);
            return;
        }
        stopAudio(openGLView);
    }

    @Override
    public @Nullable Map<String, Integer> getCommandsMap() {
        return MapBuilder.of(
                COMMAND_PLAY_NAME, COMMAND_PLAY_ID,
                COMMAND_STOP_NAME, COMMAND_STOP_ID,
                COMMAND_CAPTURE_NAME, COMMAND_CAPTURE_ID
        );
    }

    @Override
    public void receiveCommand(ZWOpenGLView root, int commandId, @Nullable ReadableArray args) {
        switch (commandId) {
            case COMMAND_PLAY_ID:
                play(root);
                break;
            case COMMAND_STOP_ID:
                stop(root);
                break;
            case COMMAND_CAPTURE_ID:
                capture(root);
                break;
            default:
                break;
        }
    }

    private void play(ZWOpenGLView openGLView) {
        ZWStreamPlayer player = openGLView.getPlayer();
        if (player == null) {
            return;
        }
        player.play();
    }

    private void stop(ZWOpenGLView openGLView) {
        ZWStreamPlayer player = openGLView.getPlayer();
        if (player == null) {
            return;
        }
        player.stop();
    }

    private void playAudio(ZWOpenGLView openGLView) {
        ZWStreamPlayer player = openGLView.getPlayer();
        if (player == null) {
            return;
        }
        player.playAudio();
    }

    private void stopAudio(ZWOpenGLView openGLView) {
        ZWStreamPlayer player = openGLView.getPlayer();
        if (player == null) {
            return;
        }
        player.stopAudio();
    }

    private void capture(ZWOpenGLView openGLView) {
        openGLView.capture();
    }
}