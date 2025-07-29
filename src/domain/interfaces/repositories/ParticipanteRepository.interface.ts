import { Participant, ParticipantProps } from "../../entities";

export interface ParticipantRepository {
  save(participant: Participant): Promise<string>;
  findById(id: string): Promise<Participant | null>;
  findByDocument(document: string): Promise<Participant | null>;
  findByCheckoutId(checkoutId: string): Promise<Participant[]>;
  findByEventId(eventId: string): Promise<Participant[]>;
  findByTicketType(
    eventId: string,
    ticketType: ParticipantProps["ticketType"]
  ): Promise<Participant[]>;
  update(participant: Participant): Promise<void>;
  delete(id: string): Promise<void>;
}
