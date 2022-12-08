import { StyleSheet, Platform, StatusBar, Dimensions  } from 'react-native';
export default StyleSheet.create({
    droidSafeArea: {
        flex: 1,
        backgroundColor:'#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    positionAbsolute:{
        position:'absolute',
        width: Dimensions.get('window').width,
        borderWidth:1
    }
});