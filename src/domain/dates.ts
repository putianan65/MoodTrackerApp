import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import 'dayjs/locale/th';

dayjs.extend(buddhistEra);

/** Local calendar date used as the entry key. */
export const todayKey = () => dayjs().format('YYYY-MM-DD');

export const formatThaiDate = (date: string) => dayjs(date).locale('th').format('D MMMM BBBB');
export const formatShortThaiDate = (date: string) => dayjs(date).locale('th').format('D MMM');
export const formatWeekday = (date: string) => dayjs(date).locale('th').format('dddd');
export const formatMonthShort = (date: string) => dayjs(date).locale('th').format('MMM BB');
export const dayOfMonth = (date: string) => dayjs(date).format('D');
export const chartLabel = (date: string) => dayjs(date).locale('th').format('dd D');
