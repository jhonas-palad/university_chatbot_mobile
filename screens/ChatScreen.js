import { useState, useEffect, useRef } from 'react';
import { useCallback } from 'use-memo-one';
import { Dimensions ,StyleSheet, View, Text} from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import uuid from 'react-native-uuid';
import GlobalStyles from '../styles/GlobalStyles';

const BOT = {
    _id: 99,
    name: 'AsKetty',
    avatar: require('../assets/chat.png')
}
const USER = {
    _id: 1,
    name: 'user'
}
const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [ reconnect, setReconnect ] = useState(false);
    const ws = useRef(null);
    const openMessage = useRef(null);
    const netInfo = useNetInfo();
    const [webSocketMsgStatus, setWebSocketMsgStatus] = useState(false);
    const [networkErrMsg, setNetworkErrMsg] = useState('');

    useEffect(()=>{
        const { isConnected } = netInfo;
        if(isConnected === false){
            setNetworkErrMsg('No internet connection');
        }
        isConnected && (setNetworkErrMsg(''));
    }, [netInfo]);

    useEffect(()=>{
        ws.current = new WebSocket('ws://139.162.105.247/chat');
        setWebSocketMsgStatus('Connecting');
        ws.current.onopen = () => {
            setWebSocketMsgStatus('Active');
            if(openMessage.current === null){
                console.log('WS opened');
            }
            else{
                console.log("ws opened send");
                ws.current.send(openMessage.current);
            }
        }
        ws.current.onmessage = ({data}) => {
            
            const parsedData = JSON.parse(data);
            const { response, follow_up_responses} = parsedData;
            const message = createMessage(response, BOT);
            displayMessage(message);

            if(follow_up_responses){
                follow_up_responses.forEach(msg => {
                    displayMessage(createMessage(msg, BOT));
                });
            }
        }

        ws.current.onclose = () => {
            setWebSocketMsgStatus('Disconnected');
        }
        ws.current.onerror = () => {
            const {readyState} = ws.current;
            if(readyState >= WebSocket.CLOSING){
                setWebSocketMsgStatus('Disconnected');
            }
        }
        const wsCurrent = ws.current;

        return () => {
            wsCurrent.close();
        }
    }, [reconnect]);

    const handleOnSend = useCallback((messages = []) => {
        const [ message ] = messages;
        const { text } = message;
        try{
            ws.current.send(text);
            message.sent = true;
        }
        catch(err){
            message.sent = false;
        }
        finally{
            if(ws.current.readyState === WebSocket.CLOSED){
                setReconnect(!reconnect);
            }
            displayMessage(message);
        }
    }, []);

    const createMessage = (message, user) => {
        return {
            _id: uuid.v4(),
            text:message,
            createdAt: new Date(),
            user:user
        }
    }

    const displayMessage = (messages) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
    };

    const handleLongPress = (context, message) => {
        const { text } = message;
        let options = [];

        if(text){
            options.push('Copy');
            if (message?.sent === false){
                options.push('Resend Message');
            }
            options.push('Cancel');
            const cancelButtonIndex = options.length - 1;

            context.actionSheet().showActionSheetWithOptions({
              options,
              cancelButtonIndex
            },
            //TODO
                (buttonIndex) => {
                    switch(buttonIndex){
                    case 0:
                        Clipboard.setString(text);
                        break;
                    case 1:
                        break;
                    case 2:
                        break;
                    }
                }
            );
        }
    }
    const renderTicks = (message) => {
        const {sent, user} = message;
        const isCurrentUser = user?._id === 1;

        return isCurrentUser && !sent ? (
            <View style={{position:'relative'}}>
                <FontAwesomeIcon 
                    style={styles.dangerExclamationCircle}
                    icon={faCircleExclamation}
                />
            </View>
            ): null
    };
    const renderChatFooter = useCallback((e)=>{
        if(!networkErrMsg){
            return (<View style={styles.chatTopLine}></View>)
        }
        return (
            <View style={styles.networkNotificaition}>
                <Text style={{textAlign:'center', color:'white'}}>
                    {networkErrMsg}
                </Text>
            </View>
        )

    },[netInfo]);
    return (
        <View 
            style={GlobalStyles.droidSafeArea}>
                <View style={{paddingLeft:15, paddingTop:15}}>
                    <Text style={{fontSize:20}}>AsKetty</Text>
                    <Text style={{fontSize:12, ...styles[webSocketMsgStatus]}}>{webSocketMsgStatus}</Text>
                </View>
                <GiftedChat
                    messages={messages}
                    onSend={(messages) => handleOnSend(messages)}
                    user={USER}
                    onLongPress={handleLongPress}
                    renderTicks={renderTicks}
                    renderChatFooter={renderChatFooter}

                />
                
        </View >
    )
}


const styles = StyleSheet.create({
  dangerExclamationCircle:{ 
    color: '#bb2124',
    backgroundColor:'white', 
    borderRadius:50, 
    marginRight: 5, 
    marginBottom: 5
  },
  networkNotificaition: {
    position:'absolute',
    padding:2,
    width: Dimensions.get('window').width,
    backgroundColor: "#bb2124",
    elevation:1
  },  
  chatTopLine: {
    position:'absolute',
    width: Dimensions.get('window').width, 
    borderTopWidth:1,
    borderTopColor:'#eee'
  }, 
  Active: {
    color: '#4BB543'
  },
  Disconnected: {
    color: '#bb2124'
  },
  Connecting: {
    color: '#ff9966'
  }
});

export default ChatScreen;