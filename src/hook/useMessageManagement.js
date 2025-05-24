// src/hooks/useMessageManagement.js
import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import messagesService from '../services/messagesService';

const useMessageManagement = (currentUser, user) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const lastMessageTimeRef = useRef(null);

    // Tải tin nhắn ban đầu
    const fetchMessages = useCallback(async () => {
        if (!currentUser?.id || !user?.id) {
            console.log('Không thể tải tin nhắn: thiếu thông tin người dùng');
            return;
        }

        try {
            setLoading(true);
            console.log(`Đang tải tin nhắn giữa ${currentUser.id} và ${user.id}...`);

            const messageData = await messagesService.getMessagesBetweenUsersPaginated(
                currentUser.id,
                user.id,
                { page: 0, size: 20 }
            );

            if (messageData?.content) {
                setMessages(messageData.content);
                // Lưu thời gian tin nhắn mới nhất để phát hiện tin nhắn mới
                if (messageData.content.length > 0) {
                    lastMessageTimeRef.current = messageData.content[0]?.createdAt;
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải tin nhắn:', error);
            Alert.alert('Lỗi', 'Không thể tải tin nhắn. Thử lại sau?', [
                {text: 'Hủy', style: 'cancel'},
                {text: 'Thử lại', onPress: () => fetchMessages()}
            ]);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id, user?.id]);

    // Tải tin nhắn với phân trang
    const loadMessages = useCallback(async (refresh = false) => {
        if (!currentUser?.id || !user?.id) return;

        try {
            const currentPage = refresh ? 0 : page;

            if (!refresh) {
                setLoading(true);
            }

            console.log(`Đang tải tin nhắn trang ${currentPage}...`);

            // Sử dụng service để lấy tin nhắn
            const response = await messagesService.getMessagesBetweenUsersPaginated(
                currentUser.id,
                user.id,
                {
                    page: currentPage,
                    size: 20
                }
            );

            // Xử lý phân trang
            const newMessages = response.content || [];

            if (refresh) {
                setMessages(newMessages);
                setPage(1);

                // Cập nhật thời gian tin nhắn mới nhất
                if (newMessages.length > 0) {
                    lastMessageTimeRef.current = newMessages[0]?.createdAt;
                }
            } else {
                setMessages(prevMessages => [...prevMessages, ...newMessages]);
                setPage(currentPage + 1);
            }

            // Kiểm tra xem còn tin nhắn để tải không
            setHasMore(!response.last);
        } catch (error) {
            console.error('Lỗi khi tải tin nhắn:', error);
            Alert.alert('Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser?.id, user?.id, page]);

    // Lấy tin nhắn mới (kiểm tra theo thời gian)
    const fetchNewMessages = useCallback(async () => {
        if (!currentUser?.id || !user?.id || !lastMessageTimeRef.current) return;

        try {
            // Lấy tất cả tin nhắn sau thời điểm tin nhắn mới nhất đã biết
            const allMessages = await messagesService.getMessagesBetweenUsers(
                currentUser.id,
                user.id
            );

            const newMessages = allMessages.filter(msg =>
                new Date(msg.createdAt) > new Date(lastMessageTimeRef.current)
            );

            if (newMessages.length > 0) {
                console.log(`Đã tìm thấy ${newMessages.length} tin nhắn mới`);

                // Cập nhật thời gian tin nhắn mới nhất
                if (newMessages.length > 0) {
                    lastMessageTimeRef.current = newMessages[0]?.createdAt;
                }

                setMessages(prevMessages => [...newMessages, ...prevMessages]);
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra tin nhắn mới:', error);
        }
    }, [currentUser?.id, user?.id]);

    // Xử lý khi làm mới danh sách tin nhắn (pull-to-refresh)
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadMessages(true);
    }, [loadMessages]);

    // Xử lý khi tải thêm tin nhắn cũ (phân trang)
    const loadMoreMessages = useCallback(() => {
        if (!loading && hasMore) {
            loadMessages();
        }
    }, [loading, hasMore, loadMessages]);

    // Xử lý tin nhắn mới từ WebSocket
    const handleNewWebSocketMessage = useCallback((newMessage) => {
        console.log('Nhận tin nhắn mới qua WebSocket:', newMessage);

        // Kiểm tra xem tin nhắn có thuộc cuộc trò chuyện hiện tại không
        const isMessageForCurrentChat =
            (newMessage.senderId === user?.id && newMessage.receiverId === currentUser?.id) ||
            (newMessage.senderId === currentUser?.id && newMessage.receiverId === user?.id);

        if (!isMessageForCurrentChat) {
            console.log('Tin nhắn không thuộc cuộc trò chuyện hiện tại');
            return;
        }

        setMessages(prevMessages => {
            // Kiểm tra xem tin nhắn đã tồn tại chưa
            const messageExists = prevMessages.some(msg =>
                msg.id === newMessage.id ||
                (msg.content === newMessage.content &&
                    msg.senderId === newMessage.senderId &&
                    msg.createdAt === newMessage.createdAt)
            );

            // Nếu tin nhắn chưa tồn tại, thêm vào
            if (!messageExists) {
                console.log('Thêm tin nhắn mới vào danh sách');

                // Cập nhật thời gian tin nhắn mới nhất
                if (lastMessageTimeRef.current) {
                    const newMessageTime = new Date(newMessage.createdAt);
                    const lastMessageTime = new Date(lastMessageTimeRef.current);

                    if (newMessageTime > lastMessageTime) {
                        lastMessageTimeRef.current = newMessage.createdAt;
                    }
                }

                // Thêm tin nhắn mới vào đầu danh sách
                return [newMessage, ...prevMessages];
            }

            return prevMessages;
        });
    }, [currentUser?.id, user?.id]);

    return {
        messages,
        setMessages,
        loading,
        refreshing,
        hasMore,
        fetchMessages,
        loadMessages,
        fetchNewMessages,
        onRefresh,
        loadMoreMessages,
        handleNewWebSocketMessage,
        lastMessageTimeRef
    };
};

export default useMessageManagement;