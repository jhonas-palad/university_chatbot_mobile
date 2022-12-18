import { useState, useEffect, useRef } from 'react';
import { useCallback } from 'use-memo-one';
import { Dimensions ,StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { useNetInfo } from '@react-native-community/netinfo';
import uuid from 'react-native-uuid';
import GlobalStyles from '../styles/GlobalStyles';
import { MaterialCommunityIcons, AntDesign  } from '@expo/vector-icons'; 
import * as Clipboard from 'expo-clipboard';

const BOT = {
    _id: 99,
    name: 'AsKetty',
    avatar: require('../assets/chat.png')
}
const USER = {
    _id:1,
    name: 'user'
}


const createMessage = (message, user) => {
    return {
        _id: uuid.v4(),
        text:message,
        createdAt: new Date(),
        user:user
    }
}
const createMessageWithOpts = (message, options ,user) => {
    const optKeys = Object.keys(options);
    const cleanOpts = optKeys.map(key=> ({title:key, value: options[key].text}));
    return {
        _id: uuid.v4(),
        text:message,
        createdAt: new Date(),
        quickReplies: {
            type: 'radio', // or 'checkbox',
            keepIt: false,
            values: cleanOpts
          },
          user:user,
    }
}

const WS_URL = 'wss://chatbotapi.site/chat';

const ChatScreen = () => {
    const [ messages, setMessages ] = useState([]);
    const [ reconnect, setReconnect ] = useState(false);
    const ws = useRef(null);
    const openMessage = useRef(null);
    const messagesRef = useRef(messages);
    const netInfo = useNetInfo();
    const [webSocketMsgStatus, setWebSocketMsgStatus] = useState(false);
    const [networkErrMsg, setNetworkErrMsg] = useState('');

    useEffect(()=>{
        const { isConnected } = netInfo;
        if(isConnected === false){
            setNetworkErrMsg('No internet connection');
        }else{
            if(ws.current){
                ws.current.readyState === WebSocket.CLOSED && setReconnect(!reconnect);
            }
        }
        isConnected && (setNetworkErrMsg(''));
    }, [netInfo]);

    useEffect(()=>{
        ws.current = new WebSocket(WS_URL);
        setWebSocketMsgStatus('Connecting');
        ws.current.onopen = () => {
            setWebSocketMsgStatus('Active');
            if(openMessage.current === null && messages.length === 0){
                try{
                    // !displayInitMsg && setDisplayInitMessage(true);
                    const initMessages =  [
                        createMessage("Let me know your queries 😊", BOT),
                        createMessage("Hi, I'm a chatbot", BOT)
                    ]
                    
                    displayMessage(initMessages);
                }
                catch(err){
                    console.log(err);
                }
            }
            else{
                handleOnSend([openMessage.current], true);
            }
            setNetworkErrMsg('')
        }

        ws.current.onmessage = ({data}) => {
            const parsedData = JSON.parse(data);
            const { text, options } = parsedData;

            const messages = !options ? text.map(msg => createMessage(msg, BOT)) : createMessageWithOpts(text, options, BOT);
            displayMessage(messages);
        }

        ws.current.onclose = () => {
            setWebSocketMsgStatus('Disconnected');
        }
        // ws.current.onerror = () => {
        //     if(netInfo.isConnected){
        //         setNetworkErrMsg('Server went offline, try to restart the app.');
        //     }
        // }
        return () => {
            const {readyState} = ws.current;
            if(readyState === WebSocket.OPEN){
                ws.current.close();
            }
        }
    }, [reconnect]);

    const handleOnSend = useCallback((msgs = [], retry = false) => {
        const [ message ] = msgs;
        
        if(!message){
            return;
        }

        const { text } = message;
        try{
            const {readyState} = ws.current;
            if(readyState === WebSocket.OPEN){
                ws.current.send(text);
                message.sent = true;
            }
            else{
                throw new Error();
            }
        }
        catch(err){
            message.sent = false;
            openMessage.current = message;
        }
        finally{
            if(ws.current.readyState === WebSocket.CLOSED){
                setReconnect(!reconnect);
            }
            !retry && displayMessage(message);
            
        }
    }, [reconnect, messages]);

    

    const displayMessage = (messages) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
    };
    useEffect(()=>{
        messagesRef.current = messages;
    }, [messages]);

    
    const handleLongPress = (context, message, container) => {
        const { _id, text, sent } = message;
        const handleResend = () => {
            const messagesList = messagesRef.current;
            const filteredMsgs = messagesList.filter(msg => msg._id !== _id);
            setMessages(filteredMsgs);
            handleOnSend([message]);
        };
        let options = [];
        const buttonHandler = (index) => {
            const copyToClipBoard = async (str) => {
                await Clipboard.setStringAsync(str);
            }
            switch(index){
                case 0:
                    copyToClipBoard(text);
                    break;
                case 1:
                    sent === false && handleResend();
                    break;
                case 2:
                    break;
            }
        }

        if(text){
            options.push('Copy');
            if (message?.sent === false){
                options.push('Resend');
            }
            options.push('Cancel');
            const cancelButtonIndex = options.length - 1;

            context.actionSheet().showActionSheetWithOptions({
              options,
              cancelButtonIndex
            }, buttonHandler);
        }
    }

    const handleQuickReply = ([msg]) => {
        const {title, value} = msg;
        let userMsg = createMessage(title, USER);
        userMsg.sent=true;
        const botMsg = createMessage(value, BOT);
        displayMessage([botMsg, userMsg]);
    }

    const renderTicks = (message) => {
        const {sent, user} = message;
        const isCurrentUser = user?._id === 1;
        return (
                isCurrentUser && !sent ? (
                    <View style={{position:'relative'}}>
                        <Text style={styles.dangerExclamationCircle}>
                        <MaterialCommunityIcons name="exclamation-thick" size={14} color="white" />
                        </Text>
                    </View>
                ) : (<></>)
        )
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
    },[networkErrMsg]);

    return (
        <View 
            style={GlobalStyles.droidSafeArea}>
                <View style={{paddingLeft:25, paddingRight:25, paddingBottom:10 , flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                    <View>
                        <Text style={{fontSize:20}}>AsKetty</Text>
                        <Text style={{fontSize:12, ...styles[webSocketMsgStatus]}}>{webSocketMsgStatus}</Text>
                    </View>
                    <View>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={()=>{return}}
                        >
                            <Text style={{fontSize:12, ...styles[webSocketMsgStatus]}}>
                                <AntDesign name="ellipsis1" size={24} color="black" />
                            </Text>
                        </TouchableOpacity>
                        
                    </View>

                </View>
                <GiftedChat
                    messages={messages}
                    onSend={(messages) => handleOnSend(messages)}
                    user={USER}
                    onLongPress={(context, message) => handleLongPress(context, message, messages)}
                    renderTicks={renderTicks}
                    renderChatFooter={renderChatFooter}
                    onQuickReply={handleQuickReply }
                />
        </View >
    )
}


const styles = StyleSheet.create({
  dangerExclamationCircle:{ 
    backgroundColor:'#bb2124', 
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