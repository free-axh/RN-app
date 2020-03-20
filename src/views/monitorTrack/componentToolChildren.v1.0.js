import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import PropTypes from 'prop-types';

// style
const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    color: '#333333',
    paddingBottom: 15,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  content: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    backgroundColor: '#fff',
  },
  txt: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 25,
  },
});

class Message extends Component {
  static propTypes = {
    msg: PropTypes.object,
    myAddress: PropTypes.string,
    distance: PropTypes.string,
  }

  // 属性默认值
  static defaultProps ={
    msg: null,
    myAddress: null,
    distance: null,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    const {
      msg,
      myAddress,
      distance,
    } = this.props;

    return (
      <View>
        <Text style={styles.title}>
          {msg.monitorName}({msg.state}:{msg.continueTime}h)
        </Text>

        <View style={styles.content}>
          <Text style={styles.txt}>
            更新时间: {msg.updateTime}
          </Text>
          <Text style={styles.txt}>
            实时距离: {distance}km
          </Text>
          <Text style={styles.txt}>
            我的位置: {myAddress}
          </Text>
          <Text style={styles.txt}>
            目标位置: {msg.targetAddress}
          </Text>
        </View>
      </View>
    );
  }
}

export default Message;