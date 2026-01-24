import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChat, Message, Conversation } from '../../hooks/useChat';
import { API_BASE_URL } from '@env';

interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: string;
}

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const conversation = route.params?.conversation as Conversation;
  
  const {
    messages,
    isTyping,
    isConnected,
    fetchMessages,
    sendMessage,
    sendTyping,
    markAsRead,
    setCurrentConversationId,
  } = useChat();
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const quickReplyAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const init = async () => {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      setCurrentUserId(user?.id || null);
      setUserRole(user?.role || 'tenant');
      
      if (conversation?.id) {
        setCurrentConversationId(conversation.id);
        await fetchMessages(conversation.id);
        await markAsRead(conversation.id);
        await fetchQuickReplies(user?.role || 'tenant');
      }
      setIsLoading(false);
    };

    init();

    return () => {
      setCurrentConversationId(null);
    };
  }, [conversation?.id]);

  // Fetch quick reply templates
  const fetchQuickReplies = async (role: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const baseUrl = API_BASE_URL || 'http://192.168.0.109:3000';
      const response = await fetch(`${baseUrl}/api/chat/quick-replies?role=${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.templates) {
        setQuickReplies(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch quick replies:', error);
    }
  };

  // Toggle quick replies panel
  const toggleQuickReplies = () => {
    const toValue = showQuickReplies ? 0 : 1;
    setShowQuickReplies(!showQuickReplies);
    Animated.spring(quickReplyAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  // Handle quick reply selection
  const handleQuickReplySelect = (reply: QuickReply) => {
    setInputText(reply.content);
    toggleQuickReplies();
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    console.log('[ChatScreen] Messages changed, count:', messages.length);
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    console.log('[ChatScreen] handleSend called, inputText:', inputText.trim(), 'conversation:', conversation?.id);
    if (!inputText.trim() || !conversation?.id) return;

    console.log('[ChatScreen] Sending message...');
    sendMessage(conversation.id, inputText.trim());
    setInputText('');
  }, [inputText, conversation?.id, sendMessage]);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    if (conversation?.id) {
      sendTyping(conversation.id);
    }
  }, [conversation?.id, sendTyping]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].created_at).toDateString();
    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    return currentDate !== prevDate;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === currentUserId;
    const isSystem = item.message_type === 'system';
    const showDate = shouldShowDate(index);

    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        
        {isSystem ? (
          <View style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </View>
        ) : (
          <View
            style={[
              styles.messageContainer,
              isOwnMessage ? styles.ownMessage : styles.otherMessage,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isOwnMessage ? styles.ownBubble : styles.otherBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                ]}
              >
                {item.content}
              </Text>
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.messageTime,
                    isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
                  ]}
                >
                  {formatTime(item.created_at)}
                </Text>
                {isOwnMessage && (
                  <Ionicons
                    name={item.is_read ? 'checkmark-done' : 'checkmark'}
                    size={14}
                    color={item.is_read ? '#60a5fa' : 'rgba(255,255,255,0.7)'}
                    style={styles.readIcon}
                  />
                )}
              </View>
            </View>
          </View>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerContent} activeOpacity={0.7}>
          {conversation?.property_image ? (
            <Image source={{ uri: conversation.property_image }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
              <Ionicons name="home" size={20} color="#666" />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {conversation?.property_title || 'Property'}
            </Text>
            <View style={styles.statusRow}>
              {conversation?.is_other_user_online ? (
                <>
                  <View style={styles.onlineIndicator} />
                  <Text style={styles.statusText}>Online</Text>
                </>
              ) : (
                <Text style={styles.statusText}>{conversation?.other_user_name || 'Landlord'}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.connectionText}>Connecting...</Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          extraData={messages.length}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
            </View>
          }
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}

        {/* Quick Replies Panel */}
        {showQuickReplies && quickReplies.length > 0 && (
          <Animated.View 
            style={[
              styles.quickRepliesContainer,
              {
                transform: [{
                  translateY: quickReplyAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                }],
                opacity: quickReplyAnimation,
              },
            ]}
          >
            <View style={styles.quickRepliesHeader}>
              <Text style={styles.quickRepliesTitle}>Quick Replies</Text>
              <TouchableOpacity onPress={toggleQuickReplies}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRepliesScroll}
            >
              {quickReplies.map((reply) => (
                <TouchableOpacity
                  key={reply.id}
                  style={styles.quickReplyChip}
                  onPress={() => handleQuickReplySelect(reply)}
                >
                  <Text style={styles.quickReplyTitle}>{reply.title}</Text>
                  <Text style={styles.quickReplyContent} numberOfLines={2}>
                    {reply.content}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Input */}
        <View style={styles.inputWrapper}>
          {/* Quick Reply Toggle Button */}
          {messages.length === 0 && quickReplies.length > 0 && !showQuickReplies && (
            <TouchableOpacity 
              style={styles.quickReplyHint}
              onPress={toggleQuickReplies}
            >
              <Ionicons name="flash" size={16} color="#6B46C1" />
              <Text style={styles.quickReplyHintText}>Tap for quick replies</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.attachButton}
              onPress={toggleQuickReplies}
            >
              <Ionicons 
                name={showQuickReplies ? "close-circle" : "flash"} 
                size={26} 
                color="#6B46C1" 
              />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? '#fff' : '#999'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  headerAvatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  moreButton: {
    padding: 8,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 6,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    fontWeight: '500',
  },
  messageContainer: {
    marginVertical: 3,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  ownBubble: {
    backgroundColor: '#6B46C1',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1a1a1a',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.75)',
  },
  otherMessageTime: {
    color: '#999',
  },
  readIcon: {
    marginLeft: 4,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: '80%',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  // Quick Replies Styles
  quickRepliesContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 12,
  },
  quickRepliesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  quickRepliesScroll: {
    paddingHorizontal: 12,
  },
  quickReplyChip: {
    backgroundColor: '#f8f4ff',
    borderWidth: 1,
    borderColor: '#e9dfff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    minWidth: 140,
    maxWidth: 200,
  },
  quickReplyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B46C1',
    marginBottom: 4,
  },
  quickReplyContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  quickReplyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f4ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9dfff',
  },
  quickReplyHintText: {
    fontSize: 13,
    color: '#6B46C1',
    marginLeft: 6,
    fontWeight: '500',
  },
  // Input Wrapper
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
  },
  attachButton: {
    padding: 6,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 21,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e5e5',
    shadowOpacity: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
