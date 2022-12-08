import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";

import MainScreen from './screens/MainScreen'
import ChatScreen from "./screens/ChatScreen";

const AppNavigator = createStackNavigator(
  {
    Login: MainScreen,
    Chat: ChatScreen
  },
  {
    headerMode:"none"
  }
)
export default createAppContainer(AppNavigator);