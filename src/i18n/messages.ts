import ko from '@/messages/ko.json';
import en from '@/messages/en.json';
import ja from '@/messages/ja.json';
import zh from '@/messages/zh.json';

const messages: Record<string, typeof ko> = {
  ko,
  en,
  ja,
  zh,
};

export function getStaticMessages(locale: string) {
  return messages[locale] || messages.ko;
}

export default messages;
