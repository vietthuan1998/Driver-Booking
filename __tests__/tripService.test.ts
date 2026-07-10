import { startTrip, completeTrip } from '../src/services/tripService';
import { supabase } from '../src/utils/supabase';

jest.mock('../src/utils/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const createQueryBuilder = (result: { data?: any; error?: any } = { data: null, error: null }) => ({
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
});

describe('trip service validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects starting a trip outside the 30-minute window before departure', async () => {
    const builder = createQueryBuilder({
      data: {
        id: 'trip-1',
        trip_status: 'scheduled',
        planned_departure_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await expect(startTrip('trip-1')).rejects.toThrow(
      'Chỉ có thể bắt đầu chuyến trong vòng 30 phút trước giờ khởi hành dự kiến.',
    );
  });

  it('rejects completing a trip before it has lasted at least 2 hours', async () => {
    const builder = createQueryBuilder({
      data: {
        id: 'trip-1',
        trip_status: 'in_progress',
        actual_departure_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await expect(completeTrip('trip-1')).rejects.toThrow(
      'Chuyến phải chạy ít nhất 2 tiếng trước khi hoàn thành.',
    );
  });

  it('rejects starting a new trip while another trip is already in progress', async () => {
    const tripBuilder = createQueryBuilder({
      data: {
        id: 'trip-1',
        trip_status: 'scheduled',
        planned_departure_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
      error: null,
    });
    const listBuilder = createQueryBuilder({
      data: [{ id: 'trip-2', trip_status: 'in_progress' }],
      error: null,
    });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(tripBuilder)
      .mockReturnValueOnce(listBuilder);

    await expect(startTrip('trip-1')).rejects.toThrow(
      'Đã có chuyến khác đang chạy, vui lòng hoàn thành chuyến đó trước.',
    );
  });
});
