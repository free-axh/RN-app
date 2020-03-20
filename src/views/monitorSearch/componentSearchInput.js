import React, { Component } from 'react';
import { is } from 'immutable';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  // TextInput,
  Platform,
  Image,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { PropTypes } from 'prop-types';
import TextInput from '../../common/textInput';

import { getLocale } from '../../utils/locales';
import wSearch from '../../static/image/wSearch.png';
import deleteIcon from '../../static/image/delete.png';
// import wVoice from '../../static/image/wVoice.png';//二期语音图标

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    height: 40,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  input: {
    borderBottomWidth: 0,
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  search: {
    width: 22,
    height: 22,
    marginLeft: 10,
  },
  voice: {
    width: 15,
    height: 22,
    marginRight: 10,
  },
  clear: {
    width: 18,
    height: 18,
  },
  hide: {
    display: 'none',
  },
  clearMask: {
    position: 'absolute',
    right: 5,
    width: 18,
    height: 18,
  },
});

class SearchInput extends Component {
  static propTypes = {
    monitorSearchAction: PropTypes.func.isRequired,
    emptySearchAction: PropTypes.func.isRequired,
    loadSearchAction: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      clearShow: false,
      page: 0,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 搜索
  search=() => {
    const { monitorSearchAction, loadSearchAction, emptySearchAction } = this.props;
    const { value } = this.state;

    emptySearchAction();
    if (value) {
      Keyboard.dismiss();

      loadSearchAction();
      monitorSearchAction({
        fuzzyParam: value,
      });
      this.setState({
        page: 1,
      });
    }
  }

  // input发生改变
  inputChange=(val) => {
    const reg = /^[0-9a-zA-Z\u4e00-\u9fa5-]{0,20}$/;// 输入框输入限制
    if (Platform.OS === 'ios' || reg.test(val)) {
      this.setState({ value: val });
    }
  }

  // 获取焦点
  foucus=() => {
    this.setState({
      clearShow: true,
    });
  }

  // 失去焦点
  blur=() => {
    const { value } = this.state;
    if (value === '') {
      this.setState({
        clearShow: false,
      });
    } else {
      this.setState({
        clearShow: true,
      });
    }
  }

  // 清空input
  clear=() => {
    const { emptySearchAction } = this.props;
    const { page } = this.state;
    this.setState({
      value: '',
      page: 0,
    });

    if (page === 1) {
      emptySearchAction();
    }
  }

  render() {
    const { value, clearShow } = this.state;
    return (
      <View style={styles.container}>
        {/* 二期实现(语音) */}
        {/* <TouchableHighlight>
            <Image
              source={wVoice}
              style={styles.voice}
            />
          </TouchableHighlight> */}

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder={getLocale('searchInputPlaceholder')}
            placeholderTextColor="#888"
            underlineColorAndroid="transparent"
            selectionColor="#3399FF"
            value={value}
            maxLength={20}
            onChangeText={this.inputChange}
            onFocus={this.foucus}
            onBlur={this.blur}
            onSubmitEditing={this.search}// 软键盘确定/搜索被点击
            clearButtonMode="while-editing"
          />

          {
            Platform.OS === 'ios'
              ? (
                <TouchableOpacity
                  activeOpacity={0}
                  onPress={this.clear}
                  style={styles.clearMask}
                />
              )
              : (
                <TouchableOpacity
                  onPress={this.clear}
                  style={!clearShow ? styles.hide : null}
                >
                  <Image
                    style={styles.clear}
                    source={deleteIcon}
                  />
                </TouchableOpacity>
              )
          }

        </View>
        <View>
          <TouchableOpacity
            onPress={this.search}
          >
            <Image
              source={wSearch}
              style={styles.search}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default connect(
  null,
  dispatch => ({
    monitorSearchAction: (params) => {
      dispatch({ type: 'monitorSearch/SAGA/SEARCH_MONITOR_ACTION', params });// 搜索
    },
    emptySearchAction: () => {
      dispatch({ type: 'monitorSearch/SEARCH_EMPTY_ACTION' });// 清空搜索
    },
    loadSearchAction: () => {
      dispatch({ type: 'monitorSearch/SEARCH_LOADING_ACTION' });// 搜索加载
    },
  }),
)(SearchInput);