import { getPrismaClient } from '@docconnect/database';

type ChatParticipant = {
  id: string;
  role: 'DOCTOR' | 'PATIENT';
};

type MessagePageOptions = {
  cursor?: string;
  limit: number;
};

type SendMessageInput = {
  body: string;
  consultationId: string;
  sender: ChatParticipant;
};

const messageSelect = {
  body: true,
  consultationId: true,
  createdAt: true,
  id: true,
  senderId: true,
  senderRole: true,
} as const;

export class MessageModel {
  async findActiveConversation(consultationId: string, participant: ChatParticipant) {
    return getPrismaClient().consultation.findFirst({
      where: participant.role === 'PATIENT'
        ? { id: consultationId, patientId: participant.id, status: 'IN_PROGRESS' }
        : { doctorId: participant.id, id: consultationId, status: 'IN_PROGRESS' },
      select: { doctorId: true, id: true, patientId: true },
    });
  }

  async listMessages(consultationId: string, options: MessagePageOptions) {
    if (options.cursor) {
      const cursorExists = await getPrismaClient().consultationMessage.findFirst({
        where: { consultationId, id: options.cursor },
        select: { id: true },
      });

      if (!cursorExists) {
        return undefined;
      }
    }

    const newestFirst = await getPrismaClient().consultationMessage.findMany({
      where: { consultationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      select: messageSelect,
      take: options.limit + 1,
    });

    const hasMore = newestFirst.length > options.limit;
    const page = newestFirst.slice(0, options.limit);

    return {
      // The app renders the oldest message at the top of each returned page.
      messages: page.reverse(),
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async sendMessage(input: SendMessageInput, recipientId: string) {
    const notificationBody = input.sender.role === 'PATIENT'
      ? 'Your patient sent a new consultation message.'
      : 'Your doctor sent a new consultation message.';

    const [message] = await getPrismaClient().$transaction([
      getPrismaClient().consultationMessage.create({
        data: {
          body: input.body,
          consultationId: input.consultationId,
          senderId: input.sender.id,
          senderRole: input.sender.role,
        },
        select: messageSelect,
      }),
      getPrismaClient().notification.create({
        data: {
          body: notificationBody,
          title: 'New consultation message',
          userId: recipientId,
        },
      }),
    ]);

    return message;
  }
}
