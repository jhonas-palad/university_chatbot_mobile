import React from 'react'
import { Platform, KeyboardAvoidingView, SafeAreaView, StyleSheet, View, Text, Alert, TouchableHighlightBase } from "react-native";
import { GiftedChat } from 'react-native-gifted-chat';

const BOT = {
  _id: 2,
  name: 'AsKetty',
  avatar: require('../assets/chat.png')
}
const SERVER_STATE = {
  0: 'CONNECTING',
  1: 'OPEN',
  2: 'CLOSING',
  3: 'CLOSED',
  4: 'UNINITIALIZED'
}


export default class ChatScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      serverState: SERVER_STATE[4],
      messages: [
        {_id: 1, text: 'How can I help you?', createdAt: new Date(), user: BOT},
        {_id: 2, text: 'Hi, my name is Asketty :)', createdAt: new Date(), user: BOT},
      ],
      id: 1,
      name: ''
    };

    this.onReceivedMessage = this.onReceivedMessage.bind(this);
    this.onSend = this.onSend.bind(this);
    this.onErrorConnection = this.onErrorConnection.bind(this);
    this._storeMessages = this.__storeMessages.bind(this);
  }
  componentDidMount(){
    this.openConnection();
  }

  openConnection() {
    this.ws = new WebSocket('ws://139.162.105.247/chat')
    this.ws.onopen = (e) => {
      this.setState((prevState) => ({serverState: SERVER_STATE[this.ws.readyState]}))
    }
    this.ws.onmessage = this.onReceivedMessage
    this.ws.onerror = this.onErrorConnection
  }

  isConnecting() {
    return this.state.serverState == SERVER_STATE[0];
  }

  isConnected() {
    return this.state.serverState == SERVER_STATE[1];
  }

  onErrorConnection(err) {
 
    if(this.isConnected() || this.isConnecting()){
      this.setState({serverState: SERVER_STATE[this.ws.readyState]})
      Alert.alert(
        "Connection",
        "Something went wrong, server went down",
        [
          {
            text: "Okay"
          }
        ]
      )
    }
    
  }
  onReceivedMessage(msg) {
    let message_json = JSON.parse(msg.data);
      let follow_up_responses = message_json.follow_up_responses ? Array.from(message_json.follow_up_responses) : [];
      let message = {
        _id: this.state.messages.length + 1,
        text: message_json.response,
        createdAt: new Date(),
        user: BOT
      };
      this._storeMessages(message)
      follow_up_responses.forEach(element => {
        message = {
          _id: this.state.messages.length + 1,
          text: element,
          createdAt: new Date(),
          user: BOT
        };
        this._storeMessages(message)
      });
  }
  onError(error){
    Alert.alert(
      "",
      error,
      [
        {
          text: "Okay"
        }
      ]
    )
  }
  onSend(messages = []) {
    let message = messages[0].text
    try {
      if(!this.isConnected()){
        this.openConnection();
      }
      this.ws.send(message);
      this._storeMessages(messages);
    } catch (error) {
      // Handle error
        this.onError("Message failed to send.");
    }
  }
  render() {
    return (
      <View style={{flex: 1, backgroundColor: "#fff"}}>
        <GiftedChat
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          user={{_id: 1}}
        />
      </View>
    )
  }

  __storeMessages(messages) {
    this.setState((prevState) => ({
      messages: GiftedChat.append(prevState.messages, messages)
    }));
  }
}
