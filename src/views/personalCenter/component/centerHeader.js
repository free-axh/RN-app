import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  Dimensions,
  TouchableHighlight,
  ImageBackground,
} from 'react-native';
import { PropTypes } from 'prop-types';
// import centerLogo from '../../../static/image/centerLogo.png';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

const styles = StyleSheet.create({
  textColor: {
    color: '#333',
    marginTop: 2,
    marginHorizontal: 30,
  },
  container: {
    paddingTop: 10,
    paddingBottom: 15,
    flexDirection: 'column',
    alignItems: 'center',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  imgBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 25,
    overflow: 'hidden',
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 5,
    // backgroundColor: '#fff',
  },
});
class CenterHeader extends Component {
  static propTypes = {
    img: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    headClick: PropTypes.func.isRequired,
  }

  headClick=() => {
    const { headClick } = this.props;
    headClick();
  }

  render() {
    const { phone, company, img } = this.props;

    return (
      <View style={styles.container}>

        <ImageBackground
          style={styles.imgBox}
        >
          <TouchableHighlight
            onPress={this.headClick}
            underlayColor="transparent"
          >
            <Image
              resizeMode="contain"
              style={styles.logo}
              source={{ uri: img }}
            />
          </TouchableHighlight>
        </ImageBackground>


        <Text
          style={styles.textColor}
          numberOfLines={1}
        >
          {phone}
        </Text>
        <Text
          style={styles.textColor}
          numberOfLines={1}
        >
          {company}
        </Text>
      </View>
    );
  }
}

export default CenterHeader;
