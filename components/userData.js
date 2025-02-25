import { createSelector, createSlice } from '@reduxjs/toolkit';
import { isEmpty, some, uniqBy } from 'lodash';

export const sortChats = chats => {
  const sorted = chats.sort((a, b) => {
    // by newest_message.created in ascending order if unread_count is equal
    if (!a.newest_message?.created) return 1;
    if (!b.newest_message?.created) return -1;
    return (
      new Date(b.newest_message.created) - new Date(a.newest_message.created)
    );
  });

  return uniqBy(sorted, 'uuid');
};

/* eslint no-param-reassign: 0 */
export const userDataSlice = createSlice({
  name: 'userData',
  initialState: {},
  reducers: {
    initialise: (state, action) => {
      // TODO: this should NEVER be called twice will overwrite the full state
      console.log('PAYLOAD', action.payload, { state, action });

      state.communityEvents = action.payload?.communityEvents;
      state.user = {
        ...action.payload?.user,
        hasMatch: !!action.payload?.matches?.confirmed?.totalItems,
      };
      state.notifications = action.payload?.notifications;
      state.matches = action.payload?.matches;
      state.chats = action.payload?.chats;
      state.messages = {};
      state.apiOptions = action.payload?.apiOptions;
      state.formOptions = action.payload?.apiOptions.profile;
      state.activeCallRooms = action.payload?.activeCallRooms || [];
      state.postCallSurvey = action.payload?.postCallSurvey || null;
      state.callSetup = action.payload?.callSetup || null; // { userId: user.hash } or null
      state.activeCall = action.payload?.activeCall || null; // { userId: user.hash, tracks: {} } or null
      state.supportUrl = "TODO"      
      state.matchRejected = false;
    },
    reset: state => {
      state.user = null;
    },
    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
    updateProfile: (state, action) => {
      Object.keys(action.payload).forEach(key => {
        state.user.profile[key] = action.payload[key];
      });
    },
    updateEmail: (state, action) => {
      if (state.user) {
        state.user.email = action.payload;
      } else {
        state.user = { email: action.payload };
      }
    },
    updateSearchState: (state, action) => {
      state.user.isSearching = action.payload;
    },
    initCallSetup: (state, action) => {
      const { userId } = action.payload;
      state.callSetup = action.payload;

      state.activeCallRooms = state.activeCallRooms.filter(
        room => room.activeUsers.filter(user => user === userId).length === 0,
      );
    },
    cancelCallSetup: state => {
      state.callSetup = null;
    },
    initActiveCall: (state, action) => {
      state.activeCall = action.payload;
    },
    addActiveCallRoom: (state, action) => {
      state.activeCallRooms = [
        ...state.activeCallRooms.filter(
          room => room.uuid !== action.payload.uuid,
        ),
        action.payload,
      ];
    },
    stopActiveCall: state => {
      state.activeCall = null;
    },
    addMatch: (state, action) => {
      const { category, match } = action.payload;
      const matchAlreadyExists = state.matches[category].items.find(
        item => item.id === match.id,
      );
      if (!matchAlreadyExists) state.matches[category].items.push(match);
    },
    addPostCallSurvey: (state, action) => {
      state.postCallSurvey = action.payload;
    },
    updatePostCallSurvey: (state, action) => {
      state.postCallSurvey = {
        ...state.postCallSurvey,
        ...action.payload,
      };
    },
    removePostCallSurvey: state => {
      state.postCallSurvey = null;
    },
    addIncomingCall: (state, action) => {
      state.activeCallRooms = [
        ...state.activeCallRooms.filter(
          room => room.uuid !== action.payload.uuid,
        ),
        action.payload,
      ];
    },
    removeMatch: (state, action) => {
      const { category, match } = action.payload;
      const { id } = match;

      state.matches[category].items = state.matches[category].items.filter(
        m => m.id !== id,
      );
    },
    updateMatch: (state, action) => {
      const { category, match } = action.payload;
      const { id, ...rest } = match;
      const matchIndex = state.matches[category].findIndex(m => m.id === id);
      if (matchIndex !== -1)
        state.matches[category][matchIndex] = {
          ...state.matches[category][matchIndex],
          ...rest,
        };
    },
    updateMatchProfile: (state, action) => {
      const { partnerId, profile } = action.payload;
      Object.keys(state.matches).forEach(category => {
        const matchIndex = state.matches[category].items.findIndex(
          m => m.partner.id === partnerId,
        );
        if (matchIndex !== -1)
          state.matches[category].items[matchIndex].partner = {
            ...state.matches[category].items[matchIndex].partner,
            ...profile,
          };
      });
    },
    changeMatchCategory: (state, action) => {
      const { category, match, newCategory } = action.payload;
      const matchToMove = state.matches[category].items.find(
        m => m.id === match.id,
      );
      const matchAlreadyExists = state.matches[newCategory].items.find(
        item => item.id === match.id,
      );
      if (!matchAlreadyExists)
        state.matches[newCategory].items.push(matchToMove);

      state.matches[category].items = state.matches[category].items.filter(
        m => m.id !== match.id,
      );
    },
    blockIncomingCall: (state, action) => {
      const { userId } = action.payload;
      state.activeCallRooms = state.activeCallRooms.filter(
        room => room.partner.id !== userId,
      );
    },
    updateConfirmedData: (state, action) => {
      state.matches.confirmed = action.payload;
    },
    getQuestions: (state, { payload }) => {
      state.questions = payload;
    },
    updateMessages: (state, { payload }) => {
      const { chatId, items } = payload;
      state.messages = { ...state.messages, [chatId]: items };
    },
    addMessage: (state, action) => {
      const {
        message,
        chatId,
        senderIsSelf = false,
        metaChatObj = null,
      } = action.payload;
      const chatIsLoaded = chatId in state.messages;
      if (chatIsLoaded) {
        const newMessages = state.messages[chatId]?.results
          ? [message, ...state.messages[chatId].results]
          : [message];
        state.messages[chatId].results = newMessages;
      } else if (!metaChatObj) {
        throw new Error(
          'No meta data for chat but chatId is not present in state.messages! The server should have deliverd the meta data for the chat.',
        );
        // this chat has never been loaded we can ignore inserting the actual messages, we only care about inserting the chat as messages will fetch one the chat is clicked!
      }
      state.chats.results = some(
        state.chats.results,
        chat => chat.uuid === chatId,
      )
        ? state.chats.results?.map(chat => {
            if (chat.uuid === chatId) {
              return {
                ...chat,
                unread_count: senderIsSelf
                  ? chat.unread_count
                  : chat.unread_count + 1,
                newest_message: message,
              };
            }
            return chat;
          })
        : [metaChatObj, ...state.chats.results];
      state.chats = {
        ...state.chats,
        results: sortChats(state.chats.results),
      };
    },
    markChatMessagesRead: (state, action) => {
      const { chatId, userId } = action.payload;

      if (chatId in state.messages) {
        state.messages[chatId].results = state.messages[chatId]?.results.map(
          message => {
            if (message.sender !== userId) {
              return { ...message, read: true };
            }
            return message;
          },
        );
      }
      const newChats = state.chats.results?.map(chat => {
        if (chat.uuid === chatId) {
          return {
            ...chat,
            unread_count: 0,
          };
        }
        return chat;
      });

      state.chats = {
        ...state.chats,
        results: sortChats(newChats),
      };
    },
    preMatchingAppointmentBooked: (state, action) => ({
      ...state,
      user: {
        ...state.user,
        preMatchingAppointment: action.payload,
      },
    }),
    switchQuestionCategory: (state, { payload }) => {
      const { card, archived } = payload;

      if (archived) {
        state.questions.cards[card.category] = state.questions.cards[
          card.category
        ].filter(c => c.uuid !== card.uuid);

        state.questions.cards.archived.push(card);
      } else {
        state.questions.cards.archived = state.questions.cards.archived.filter(
          c => c.uuid !== card.uuid,
        );

        state.questions.cards[card.category].push(card);
      }
    },
    insertChat: (state, { payload }) => {
      const chatResults = isEmpty(state.chats)
        ? [payload]
        : [...state.chats.results, payload];
      state.chats.results = sortChats(chatResults);
    },
    updateChats: (state, { payload }) => {
      const { results, ...rest } = payload;
      state.chats = { results: sortChats(results), ...rest };
    },
    setMatchRejected: (state, { payload }) => {
      state.matchRejected = payload;
    },
  },
});

export const {
  addMatch,
  addMessage,
  insertChat,
  blockIncomingCall,
  cancelCallSetup,
  changeMatchCategory,
  getQuestions,
  getUnarchivedQuestions,
  initActiveCall,
  initCallSetup,
  initialise,
  markChatMessagesRead,
  removeMatch,
  setMatchRejected,
  stopActiveCall,
  switchQuestionCategory,
  updateChats,
  updateConfirmedData,
  updateEmail,
  updateMatch,
  updateMatchProfile,
  updateMessages,
  updateProfile,
  updateSearchState,
  updateUser,
  setPostCallSurvey,
  removePostCallSurvey,
  updatePostCallSurvey,
} = userDataSlice.actions;

export const getMatchByPartnerId = (matches, partnerId) => {
  const allMatches = [...matches.support.items, ...matches.confirmed.items];
  const partner = allMatches.find(match => match?.partner?.id === partnerId);
  return partner;
};

export const getChatByPartnerId = (chats, partnerId) => {
  const partner = chats.results.find(chat => chat?.partner?.id === partnerId);
  return partner;
};

export const getMessagesByChatId = (messages, chatId) =>
  messages?.[chatId] || [];

export const getChatByChatId = (chats, chatId) =>
  chats.results?.find(chat => chat.uuid === chatId);

export const selectMatchesDisplay = createSelector(
  [state => state.userData.matches],
  ({ confirmed, support }) =>
    confirmed.currentPage === 1
      ? [...support.items, ...confirmed.items]
      : [...confirmed.items],
);

export default userDataSlice.reducer;
