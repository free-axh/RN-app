import React, { Component } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import PublicNavBar from '../../common/newPublicNavBar';
import { getLocale } from '../../utils/locales';
import Panel from './componentPanel';
import ToolBar from '../../common/toolBar';

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});
class Index extends Component {
  // 页面导航
  static navigationOptions = ({ navigation }) => PublicNavBar(
    navigation,
    getLocale('securityTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object.isRequired,
    activeMonitor: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  componentDidMount() {

  }

  render() {
    const { monitors, activeMonitor } = this.props;
    return (
      <View style={styles.body}>
        <Panel />

        <ToolBar
          activeMonitor={activeMonitor}
          monitors={monitors}
        />
      </View>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
  }),
  null,
)(Index);
