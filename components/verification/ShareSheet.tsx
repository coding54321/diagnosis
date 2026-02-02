'use client';

import React from 'react';
import { Share2, MessageCircle, Mail, Link2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui';
import { shareKakao, shareSMS, shareEmail, copyLink, type ShareData } from '@/lib/share';
import { toast } from 'sonner';

export interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareData;
}

const ShareSheet: React.FC<ShareSheetProps> = ({ isOpen, onClose, shareData }) => {
  const handleShare = async (type: 'kakao' | 'sms' | 'email' | 'link') => {
    try {
      let success = false;

      switch (type) {
        case 'kakao':
          shareKakao(shareData);
          success = true;
          break;
        case 'sms':
          shareSMS(shareData);
          success = true;
          break;
        case 'email':
          shareEmail(shareData);
          success = true;
          break;
        case 'link':
          success = await copyLink(shareData.url);
          if (success) {
            toast.success('링크가 복사되었습니다.');
          } else {
            toast.error('링크 복사에 실패했습니다.');
          }
          break;
      }

      if (success && type !== 'link') {
        onClose();
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('공유 중 오류가 발생했습니다.');
    }
  };

  const shareOptions = [
    {
      id: 'kakao' as const,
      label: '카카오톡',
      icon: Share2,
      color: 'text-yellow-500',
    },
    {
      id: 'sms' as const,
      label: '문자 메시지',
      icon: MessageCircle,
      color: 'text-blue-500',
    },
    {
      id: 'email' as const,
      label: '이메일',
      icon: Mail,
      color: 'text-hyundai-blue-500',
    },
    {
      id: 'link' as const,
      label: '링크 복사',
      icon: Link2,
      color: 'text-hyundai-gray-600',
    },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="공유하기">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleShare(option.id)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-hyundai-gray-200 hover:bg-hyundai-gray-50 transition-colors"
              >
                <Icon className={`w-8 h-8 ${option.color}`} />
                <span className="text-body-2 text-hyundai-gray-900">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};

export default ShareSheet;
