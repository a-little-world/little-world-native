import {
  DomCommunicationMessage,
  DomCommunicationResponse,
} from "littleplanet";
import { useDomCommunicationContext } from "../components/blocks/DomCommunicationCore";

export interface DomCommunicationHook {
  sendMessageToDom: (
    message: DomCommunicationMessage
  ) => Promise<DomCommunicationResponse>;
}

export function useDomCommunication(): DomCommunicationHook {
  const { sendToDom } = useDomCommunicationContext();

  // const sendMessageToDom = useCallback(
  //   async (
  //     message: DomCommunicationMessage
  //   ): Promise<DomCommunicationResponse> => {
  //     if (!sendToDom.current) {
  //       return { ok: false, error: "DOM not ready" };
  //     }

  //     return sendToDom.current(message);
  //   },
  //   []
  // );

  const sendMessageToDom = async (message: DomCommunicationMessage) => {
    console.log("sendMessageToDom", message, sendToDom.current);
    if (!sendToDom.current) {
      return { ok: false, error: "DOM not ready" };
    }

    return sendToDom.current(message);
  };

  return {
    sendMessageToDom,
  };
}
