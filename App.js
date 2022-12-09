import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatScreen from "./screens/ChatScreen";

const Stack = createNativeStackNavigator()
//Main screen removed
//Keep the Navigation stack for future purposes.
const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator>
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