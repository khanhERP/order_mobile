import type { NotFoundTranslations } from '../types';

export const notFoundTranslations: { [key: string]: NotFoundTranslations } = {
  ko: {
    title: '페이지를 찾을 수 없습니다',
    description: '죄송합니다. 찾고 계신 페이지를 찾을 수 없습니다.',
    backHome: '홈으로 돌아가기',
    backToHome: 'POS로 돌아가기',
  },
  en: {
    title: 'Page Not Found',
    description: 'Sorry, we could not find the page you are looking for.',
    backHome: 'Back to Home',
    backToHome: 'Back to POS',
  },
  vi: {
    title: 'Không tìm thấy trang',
    description: 'Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.',
    backHome: 'Về trang chủ',
    backToHome: 'Quay lại POS',
  },
};