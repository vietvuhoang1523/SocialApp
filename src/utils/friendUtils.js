// utils/friendUtils.js
export const determineFriendData = (friendship, currentUserId) => {
    if (!friendship || !friendship.sender || !friendship.receiver) {
        return null;
    }

    // Nếu người dùng hiện tại là sender, hiển thị receiver
    if (friendship.sender && friendship.sender.id === currentUserId) {
        return friendship.receiver;
    }

    // Nếu người dùng hiện tại là receiver, hiển thị sender
    if (friendship.receiver && friendship.receiver.id === currentUserId) {
        return friendship.sender;
    }

    // Trường hợp không xác định được, trả về receiver mặc định
    return friendship.receiver;
};