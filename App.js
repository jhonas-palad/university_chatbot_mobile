import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainScreen from './screens/MainScreen'
import ChatScreen from "./screens/ChatScreen";

const Stack = createNativeStackNavigator()

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                  name='Home'
                  component={MainScreen}
                  initialParams={{myName:'Jhonas'}}
                  options={{
                    headerShown: false
                  }}
                />
                <Stack.Screen
                  name='Chat'
                  component={ChatScreen}
                  options={{
                    headerShown: false
                  }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
export default App;