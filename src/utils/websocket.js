/**
 * Created by aoxianghua on 2018/9/5.
 */
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { requestConfig } from './env';

const httpBaseConfig = requestConfig();

class WebSocketInit {
  constructor() {
    this.socket = null;
    this.subscribeArr = [];
    this.url = '';
    this.conFlag = false;
    this.unsubscribeMap = {};
    this.stompClient = null;
    this.reconnectionState = false;
  }

  init(url, headers, success, close) {
    // console.warn('reconnectionState');
    const $this = this;
    $this.url = `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}${url}`;
    $this.socket = new SockJS($this.url);
    $this.stompClient = Stomp.over($this.socket);
    // console.warn(headers);
    $this.stompClient.connect(headers, () => {
      // console.warn('socket初始化成功');
      $this.conFlag = true;
      if (typeof success === 'function') {
        success();
      }
      if (typeof close === 'function') {
        $this.socket.onclose = () => close();
      }
    });
  }

  send(url, headers, requestStr) {
    this.stompClient.send(url, headers, JSON.stringify(requestStr));
  }

  subscribeAndSend(subUrl, callBack, sendUrl, headers, requestStr) {
    const $this = this;
    if ($this.subscribeArr.indexOf(subUrl) === -1) {
      $this.subscribeArr.push(subUrl);
      $this.unsubscribeMap[subUrl] = $this.stompClient.subscribe(subUrl, callBack);
    }
    $this.send(sendUrl, headers, requestStr);
  }

  subscribe(headers, subUrl, callBack, sendUrl, requestStr, close) {
    const $this = this;

    if ($this.conFlag) {
      if ($this.stompClient.connected) {
        // console.warn(headers);
        $this.subscribeAndSend(subUrl, callBack, sendUrl, headers, requestStr);
        return;
      }
      // $this.socket.close();
      const index = $this.subscribeArr.indexOf(subUrl);
      if (index > -1) {
        $this.subscribeArr.splice(index, 1);
      }
      this.reconnectionState = true;
      $this.socket = new SockJS($this.url);
      $this.stompClient = Stomp.over($this.socket);
      $this.stompClient.connect(headers, () => {
        // console.warn('socket初始化成功');
        this.reconnectionState = false;
        $this.subscribeAndSend(subUrl, callBack, sendUrl, headers, requestStr);
        if (typeof close === 'function') {
          $this.socket.onclose = () => close();
        }
      });
    } else if ($this.url !== '') {
      $this.socket = new SockJS($this.url);
      $this.stompClient = Stomp.over($this.socket);
      $this.reconnectionState = true;
      $this.stompClient.connect(headers, () => {
        $this.conFlag = true;
        $this.reconnectionState = false;
        $this.subscribeAndSend(subUrl, callBack, sendUrl, headers, requestStr);
        if (typeof close === 'function') {
          $this.socket.onclose = () => close();
        }
      });
    }
  }

  unsubscribealarm(headers, url, requestStr) {
    this.stompClient.send(url, headers, JSON.stringify(requestStr));
  }

  abort(headers, url) {
    this.stompClient.disconnect(url, headers);
  }

  unsubscribe(url) {
    const $this = this;
    const unsubscribe = $this.unsubscribeMap[url];
    if (unsubscribe) {
      unsubscribe.unsubscribe();
    }
    const index = $this.subscribeArr.indexOf(url);
    if (index > -1) {
      $this.subscribeArr.splice(index, 1);
    }
  }

  close() {
    if (!(this.socket === null)) {
      this.socket.close();
      this.socket = null;
      this.subscribeArr = [];
      this.url = '';
      this.conFlag = false;
      this.unsubscribeMap = {};
      this.stompClient = null;
      this.reconnectionState = false;
    }
  }
}

export default WebSocketInit;
