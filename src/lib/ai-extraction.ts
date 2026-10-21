import { ExtractedTicketData } from '@/types/database';

export interface ExtractionInput {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Extracts structured ticket details using AI Vision model.
 * Handles single or multi-page tickets (flights, trains, buses).
 */
export async function extractTicketData(
  input: ExtractionInput
): Promise<{ data: ExtractedTicketData; rawResponse: Record<string, unknown> }> {
  // To be implemented in detail in Step 4
  return {
    data: {
      passenger_name: null,
      passenger_age: null,
      transport_mode: 'unknown',
      carrier_name: null,
      booking_status: 'unknown',
      pnr_booking_id: null,
      boarding_place: null,
      destination_place: null,
      departure_datetime: null,
      arrival_datetime: null,
      seat_class_coach: null,
      extraction_confidence: 0.0,
    },
    rawResponse: {},
  };
}
