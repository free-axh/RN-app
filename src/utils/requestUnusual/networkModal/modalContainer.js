import React, {
  Component,
} from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Keyboard,
  Image,
} from 'react-native';
import { getLocale } from '../../locales';
import Loading from '../../../common/loading';
import WifiIcon from '../../../static/image/wifiBreak.png';
import TimeoutIcon from '../../../static/image/timeout.png';
import { checkServerUnobstructed } from '../../../server/getData';

const refreshText = getLocale('refresh');

const TOAST_MAX_WIDTH = 0.8;

const positions = {
  TOP: 20,
  BOTTOM: -20,
  CENTER: 0,
};


const styles = StyleSheet.create({
  defaultStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,.2)',
  },
  containerStyle: {
    height: 160,
    width: 170,
    backgroundColor: '#fff',
    opacity: 1,
    borderRadius: 12,
  },
  shadowStyle: {
    shadowColor: '#000',
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 10,
  },
  topContainerStyle: {
    width: '100%',
    height: 125,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderBottomColor: '#d1d1d1',
    borderBottomWidth: 1,
  },
  imageStyle: {
    width: 55,
    height: 55,
  },
  textStyle: {
    fontSize: 14,
    color: '#727272',
    textAlign: 'center',
  },
  bottomContainerStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,

  },
  textWraperStyle: {
    flex: 1,
    alignItems: 'center',
  },
});

class ModalContainer extends Component {
    static displayName = 'ModalContainer';

    static propTypes = {
      position: PropTypes.number,
      type: PropTypes.string,
      onHidden: PropTypes.func,

    };

    static defaultProps = {

      position: positions.CENTER,
      type: 'error',

      onHidden: null,

    };

    constructor(props) {
      super(props);

      const window = Dimensions.get('window');
      this.state = {

        windowWidth: window.width,
        windowHeight: window.height,
        keyboardScreenY: window.height,
        refreshing: false,
      };
    }

    componentWillMount() {
      Dimensions.addEventListener('change', this.handleWindowChanged);
      Keyboard.addListener('keyboardDidChangeFrame', this.handleKeyboardDidChangeFrame);
    }


    componentWillUpdate() {
      const { windowHeight, keyboardScreenY } = this.state;
      this.keyboardHeight = Math.max(windowHeight - keyboardScreenY, 0);
    }

    componentWillUnmount = () => {
      Dimensions.removeEventListener('change', this.handleWindowChanged);
      Keyboard.removeListener('keyboardDidChangeFrame', this.handleKeyboardDidChangeFrame);
      this.hide();
    };


    keyboardHeight = 0;

    handleWindowChanged = ({ window }) => {
      this.setState({
        windowWidth: window.width,
        windowHeight: window.height,
      });
    };

    handleKeyboardDidChangeFrame = ({ endCoordinates }) => {
      this.setState({
        keyboardScreenY: endCoordinates.screenY,
      });
    };


    hide=() => {
      const {
        onHidden,
      } = this.props;
      if (typeof onHidden === 'function') {
        onHidden();
      }
    }


    refresh=() => {
      this.setState({
        refreshing: true,
      });
      // setTimeout(() => {
      checkServerUnobstructed().then((result) => {
        // console.warn('refresh result:', result);

        if (result.statusCode === 200 && result.success === true) {
          this.hide();
        } else {
          this.setState({
            refreshing: false,
          });
        }
      }).catch((err) => {
        // console.warn('modal error:', err);
        this.setState({
          refreshing: false,
        });
      });
      // }, 500);
    }

    render() {
      const {
        position: offset,
        type,
      } = this.props;
      const {
        windowWidth, refreshing,
      } = this.state;

      const networkBlockText = type === 'error' ? getLocale('networkBlock') : getLocale('timeoutPrompt');
      const networkCheckingText = type === 'error' ? getLocale('networkChecking') : getLocale('connectionChecking');
      const icon = type === 'error' ? WifiIcon : TimeoutIcon;

      const position = offset ? {
        [offset < 0 ? 'bottom' : 'top']: offset < 0 ? (this.keyboardHeight - offset) : offset,
      } : {
        top: 0,
        bottom: this.keyboardHeight,
      };

      return (
        <View
          style={[
            styles.defaultStyle,
            position,
          ]}
          pointerEvents="auto"
        >

          <View
            style={[
              styles.containerStyle,
              { marginHorizontal: windowWidth * ((1 - TOAST_MAX_WIDTH) / 2) },
              styles.shadowStyle,
            ]}
          >
            <View style={styles.topContainerStyle}>
              <Image source={icon} resizeMode="contain" style={styles.imageStyle} />
              <Text style={[styles.textStyle, {
                height: 40,
                lineHeight: 18,
              }]}
              >
                {refreshing ? networkCheckingText : networkBlockText}
              </Text>
            </View>
            <View style={styles.bottomContainerStyle}>
              <TouchableOpacity style={styles.textWraperStyle} onPress={this.refresh}>
                {refreshing ? <Loading type="inline" color="#3399ff" /> : <Text style={styles.textStyle}>{refreshText}</Text>}
              </TouchableOpacity>
            </View>
          </View>

        </View>
      );
    }
}

export default ModalContainer;
export {
  positions,
};
