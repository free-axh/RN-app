import {
  requireNativeComponent,
} from 'react-native';

// const { height, width } = Dimensions.get('window');

// const styles = StyleSheet.create({
//   mapStyle: {
//     height,
//     width,
//   },
// });

// class MapView extends React.Component {
//   render() {
//     return (
//       <RNTMap style={styles.mapStyle} />
//     );
//   }
// }

const RNTMap = requireNativeComponent('RCTBaiduMapView');

export default RNTMap;