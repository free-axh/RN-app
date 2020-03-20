### 在 node_modules/react-navigation/src/routers/StackRouter.js 中找到 COMPLETE_TRANSITION 的判断语句，在if里面 return 前面加：

``` javascript
/** added by wushengsong to solve the problem that previous scene should be cleared after push */
state.routes= state.routes.length > 1 ? [state.routes[state.routes.length -1]]: state.routes;
state.index = state.routes.length - 1;
/** added by wushengsong to solve the problem that previous scene should be cleared after push */
```


### 还要在 node_modules/react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator.js 中修改两处来实现返回时页面从左侧进入

  * 1.在 forHorizontal 函数的第一行下方添加：
   ```javascript
    /** wushengsong added for the direction when page goes back */
    let rightToLeft = false;
    const direction = props.navigation.state.routes[props.navigation.state.index].params.direction;
    if (direction === 'leftToRight') {
        rightToLeft = true;
    }
   ```
  * 2.将I18nManager.isRTL 替换成rightToLeft


### Android 的react-native-sound 要用9版本，IOS 要用8


### Android 打包需要修改一点java文件，这个代码rn最新版本已经修复，但是由于我们的代码不是最新版本，所以需要单独添加

  * 在 node_modules\react-native\ReactAndroid\src\main\java\com\facebook\react\util\JSStackTrace.java 的 format 方法
  删除

  ``` java
        .append(parseFileId(frame))
        .append(frame.getInt("lineNumber"));
  ```

  替换为

  ``` java
        .append(parseFileId(frame));

      if (frame.hasKey("lineNumber") &&
        !frame.isNull("lineNumber") &&
        frame.getType("lineNumber") == ReadableType.Number) {
        stringBuilder
          .append(frame.getInt("lineNumber"));
      } else {
        stringBuilder
          .append(-1);
      }
  ```

