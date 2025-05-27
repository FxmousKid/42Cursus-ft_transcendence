import { chatService, ChatMessage } from './chat.service';
import { showNotification } from './notifications';

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const searchTabBtn = document.getElementById('search-tab-btn') as HTMLButtonElement;
    const chatTabBtn = document.getElementById('chat-tab-btn') as HTMLButtonElement;
    const searchTab = document.getElementById('search-tab') as HTMLDivElement;
    const chatTab = document.getElementById('chat-tab') as HTMLDivElement;
    const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
    const chatInput = document.getElementById('chat-input') as HTMLDivElement;
    const chatForm = document.getElementById('chat-form') as HTMLFormElement;
    const messageInput = document.getElementById('message-input') as HTMLInputElement;
    const chatOptionsBtn = document.getElementById('chat-options-btn') as HTMLButtonElement;
    const chatOptionsDropdown = document.getElementById('chat-options-dropdown') as HTMLDivElement;
    const noChatSelected = document.getElementById('no-chat-selected') as HTMLDivElement;

    // Templates
    const messageTemplate = document.getElementById('chat-message-template') as HTMLTemplateElement;
    const gameInviteTemplate = document.getElementById('game-invite-template') as HTMLTemplateElement;
    const tournamentNotificationTemplate = document.getElementById('tournament-notification-template') as HTMLTemplateElement;
    const blockedUsersModalTemplate = document.getElementById('blocked-users-modal-template') as HTMLTemplateElement;
    const blockedUserTemplate = document.getElementById('blocked-user-template') as HTMLTemplateElement;

    let currentChatUserId: number | null = null;
    let isOptionsDropdownVisible = false;

    // Tab switching
    searchTabBtn.addEventListener('click', () => {
        searchTabBtn.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600', 'text-white');
        searchTabBtn.classList.remove('bg-dark-700', 'text-gray-400');
        chatTabBtn.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600', 'text-white');
        chatTabBtn.classList.add('bg-dark-700', 'text-gray-400');
        searchTab.classList.remove('hidden');
        chatTab.classList.add('hidden');
    });

    chatTabBtn.addEventListener('click', () => {
        chatTabBtn.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600', 'text-white');
        chatTabBtn.classList.remove('bg-dark-700', 'text-gray-400');
        searchTabBtn.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600', 'text-white');
        searchTabBtn.classList.add('bg-dark-700', 'text-gray-400');
        chatTab.classList.remove('hidden');
        searchTab.classList.add('hidden');
    });

    // Chat options dropdown
    chatOptionsBtn.addEventListener('click', () => {
        isOptionsDropdownVisible = !isOptionsDropdownVisible;
        chatOptionsDropdown.classList.toggle('hidden', !isOptionsDropdownVisible);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!chatOptionsBtn.contains(event.target as Node) && !chatOptionsDropdown.contains(event.target as Node)) {
            isOptionsDropdownVisible = false;
            chatOptionsDropdown.classList.add('hidden');
        }
    });

    // Blocked users modal
    const showBlockedUsersModal = async () => {
        const modalElement = document.importNode(blockedUsersModalTemplate.content, true);
        const modal = modalElement.querySelector('div') as HTMLDivElement;
        const closeBtn = modal.querySelector('.close-modal') as HTMLButtonElement;
        const blockedUsersList = modal.querySelector('#blocked-users-list') as HTMLDivElement;
        const noBlockedUsers = modal.querySelector('#no-blocked-users') as HTMLDivElement;

        // Get blocked users
        const blockedUsers = await chatService.getBlockedUsers();

        if (blockedUsers.length > 0) {
            noBlockedUsers.classList.add('hidden');
            blockedUsers.forEach(user => {
                const userElement = document.importNode(blockedUserTemplate.content, true);
                const username = userElement.querySelector('.blocked-username') as HTMLSpanElement;
                const avatar = userElement.querySelector('.blocked-avatar') as HTMLDivElement;
                const unblockBtn = userElement.querySelector('.unblock-user') as HTMLButtonElement;

                username.textContent = user.username;
                if (user.avatar_url) {
                    avatar.innerHTML = `<img src="${user.avatar_url}" alt="${user.username}" class="w-full h-full object-cover">`;
                }

                unblockBtn.addEventListener('click', async () => {
                    const success = await chatService.unblockUser(user.id);
                    if (success) {
                        showNotification(`${user.username} a été débloqué`, 'success');
                        unblockBtn.closest('.blocked-user-item')?.remove();
                        if (blockedUsersList.children.length === 0) {
                            noBlockedUsers.classList.remove('hidden');
                        }
                    }
                });

                blockedUsersList.appendChild(userElement);
            });
        } else {
            noBlockedUsers.classList.remove('hidden');
        }

        // Close modal
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    };

    // Add click event to blocked users button
    const blockedUsersBtn = chatOptionsDropdown.querySelector('button') as HTMLButtonElement;
    blockedUsersBtn.addEventListener('click', () => {
        chatOptionsDropdown.classList.add('hidden');
        isOptionsDropdownVisible = false;
        showBlockedUsersModal();
    });

    // Message sending
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentChatUserId || !messageInput.value.trim()) return;

        const content = messageInput.value.trim();
        messageInput.value = '';

        const success = await chatService.sendMessage(currentChatUserId, content);
        if (!success) {
            showNotification('Erreur lors de l\'envoi du message', 'error');
        }
    });

    // Add message to chat
    const addMessageToChat = (message: ChatMessage, isSentByMe: boolean) => {
        let template: HTMLTemplateElement;
        switch (message.type) {
            case 'game_invite':
                template = gameInviteTemplate;
                break;
            case 'tournament_notification':
                template = tournamentNotificationTemplate;
                break;
            default:
                template = messageTemplate;
        }

        const messageElement = document.importNode(template.content, true);
        const messageContent = messageElement.querySelector('.message-content') as HTMLDivElement;
        const messageText = messageElement.querySelector('.message-text') as HTMLDivElement;
        const messageTime = messageElement.querySelector('.message-time') as HTMLDivElement;

        if (isSentByMe) {
            messageElement.querySelector('.message')?.classList.add('items-end');
            messageContent.classList.add('bg-blue-600/30', 'border', 'border-blue-500/30');
        } else {
            messageElement.querySelector('.message')?.classList.add('items-start');
            messageContent.classList.add('bg-dark-700/80', 'border', 'border-dark-600/70');
        }

        messageText.textContent = message.content;
        messageTime.textContent = new Date(message.created_at).toLocaleTimeString();

        // Add game invite handlers
        if (message.type === 'game_invite') {
            const acceptBtn = messageElement.querySelector('.accept-game-invite') as HTMLButtonElement;
            const rejectBtn = messageElement.querySelector('.reject-game-invite') as HTMLButtonElement;

            if (isSentByMe) {
                acceptBtn.remove();
                rejectBtn.remove();
            } else {
                acceptBtn.addEventListener('click', () => {
                    // Handle game invite acceptance
                    acceptBtn.disabled = true;
                    rejectBtn.disabled = true;
                    acceptBtn.classList.add('opacity-50');
                    rejectBtn.classList.add('opacity-50');
                    // Additional game acceptance logic here
                });

                rejectBtn.addEventListener('click', () => {
                    messageElement.remove();
                });
            }
        }

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Load chat history
    const loadChatHistory = async (userId: number) => {
        currentChatUserId = userId;
        chatMessages.innerHTML = '';
        chatInput.classList.remove('hidden');
        noChatSelected.classList.add('hidden');

        const messages = await chatService.getMessages(userId);
        messages.forEach(message => {
            const isSentByMe = message.sender_id === currentChatUserId;
            addMessageToChat(message, isSentByMe);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
        await chatService.markMessagesAsRead(userId);
    };

    // WebSocket event handlers
    chatService.onMessage((message: ChatMessage) => {
        if (message.sender_id === currentChatUserId || message.receiver_id === currentChatUserId) {
            const isSentByMe = message.sender_id === currentChatUserId;
            addMessageToChat(message, isSentByMe);
            if (!isSentByMe) {
                chatService.markMessagesAsRead(message.sender_id);
            }
        }
    });

    chatService.onGameInvite((invite: ChatMessage) => {
        if (invite.sender_id === currentChatUserId || invite.receiver_id === currentChatUserId) {
            const isSentByMe = invite.sender_id === currentChatUserId;
            addMessageToChat(invite, isSentByMe);
        }
    });

    chatService.onTournamentNotification((notification: ChatMessage) => {
        if (notification.sender_id === currentChatUserId || notification.receiver_id === currentChatUserId) {
            const isSentByMe = notification.sender_id === currentChatUserId;
            addMessageToChat(notification, isSentByMe);
        }
    });

    // Add click handlers to friend items to open chat
    const addChatClickHandler = (friendItem: Element) => {
        const userId = parseInt(friendItem.getAttribute('data-id') || '0');
        if (userId) {
            friendItem.addEventListener('click', () => {
                loadChatHistory(userId);
                chatTabBtn.click();
            });
        }
    };

    // Add chat click handlers to existing friend items
    document.querySelectorAll('.friend-item').forEach(addChatClickHandler);

    // Observe friend list for new items
    const friendsContainer = document.getElementById('friends-container');
    if (friendsContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof Element && node.classList.contains('friend-item')) {
                        addChatClickHandler(node);
                    }
                });
            });
        });

        observer.observe(friendsContainer, { childList: true });
    }
}); 