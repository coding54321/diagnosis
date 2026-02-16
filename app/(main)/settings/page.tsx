'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, MessageCircle, FileText, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/layout';
import { Card, Input } from '@/components/ui';
import BottomSheet from '@/components/ui/BottomSheet';
import {
  requestNotificationPermission,
  getNotificationSetting,
  setNotificationSetting,
} from '@/lib/notification';

type SupportSheetType = 'terms' | 'privacy' | 'contact' | null;

const SettingsPage: React.FC = () => {
  const [openSheet, setOpenSheet] = useState<SupportSheetType>(null);
  const [verifyNotif, setVerifyNotif] = useState(false);

  // 문의 폼 상태
  const [contactTitle, setContactTitle] = useState('');
  const [contactContent, setContactContent] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactDone, setContactDone] = useState(false);

  useEffect(() => {
    setVerifyNotif(getNotificationSetting('verification_complete'));
  }, []);

  const handleVerifyNotifToggle = useCallback(async () => {
    if (!verifyNotif) {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        setVerifyNotif(true);
        setNotificationSetting('verification_complete', true);
      } else {
        toast.error('브라우저 설정에서 알림을 허용해주세요.');
      }
    } else {
      setVerifyNotif(false);
      setNotificationSetting('verification_complete', false);
    }
  }, [verifyNotif]);

  const handleOpenSheet = (type: SupportSheetType) => {
    if (type === 'contact') {
      setContactTitle('');
      setContactContent('');
      setContactDone(false);
    }
    setOpenSheet(type);
  };

  const handleCloseSheet = () => {
    setOpenSheet(null);
  };

  const handleContactSubmit = async () => {
    if (!contactTitle.trim() || !contactContent.trim()) return;
    setContactSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: contactTitle.trim(), content: contactContent.trim() }),
      });
      if (res.ok) {
        setContactDone(true);
      } else {
        toast.error('문의 접수에 실패했어요. 다시 시도해주세요.');
      }
    } catch {
      toast.error('문의 접수 중 오류가 발생했어요.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const sheetTitle =
    openSheet === 'terms'
      ? '이용약관'
      : openSheet === 'privacy'
      ? '개인정보처리방침'
      : openSheet === 'contact' && !contactDone
      ? '고객센터 문의'
      : '';

  return (
    <>
      <main className="flex-1 bg-hyundai-gray-50 animate-fade-in-up">
        <div className="bg-white pb-1">
          <Container>
            <div className="pt-6 pb-5 px-1">
              <p className="text-xs text-hyundai-gray-400 mb-1">더보기</p>
              <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                설정
              </h2>
              <p className="text-sm text-hyundai-gray-400 mt-1">
                알림과 데이터 옵션을 관리해요
              </p>
            </div>
          </Container>
        </div>

        <Container>
          <div className="py-4 space-y-4">
            <div>
              <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">알림</p>
              <Card variant="default" padding="none">
                <ToggleRow label="정비 시기 알림" defaultValue={true} />
                <div className="mx-5 border-b border-hyundai-gray-100" />
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-hyundai-gray-900">검증 완료 알림</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={verifyNotif}
                    onClick={handleVerifyNotifToggle}
                    className={`relative w-10 h-[22px] rounded-full transition-colors ${
                      verifyNotif ? 'bg-hyundai-gray-900' : 'bg-hyundai-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform shadow-sm ${
                        verifyNotif ? 'translate-x-[18px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </Card>
            </div>

            <div>
              <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">지원</p>
              <Card variant="default" padding="none">
                <MenuRow
                  icon={<MessageCircle className="w-4 h-4" strokeWidth={1.5} />}
                  label="고객센터 문의"
                  onClick={() => handleOpenSheet('contact')}
                />
                <div className="mx-5 border-b border-hyundai-gray-100" />
                <MenuRow
                  icon={<FileText className="w-4 h-4" strokeWidth={1.5} />}
                  label="이용약관"
                  onClick={() => handleOpenSheet('terms')}
                />
                <div className="mx-5 border-b border-hyundai-gray-100" />
                <MenuRow
                  icon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                  label="개인정보처리방침"
                  onClick={() => handleOpenSheet('privacy')}
                />
              </Card>
            </div>

            <p className="text-center text-[11px] text-hyundai-gray-300 py-2">
              앱 버전 1.0.0
            </p>
          </div>
        </Container>
      </main>

      <BottomSheet isOpen={openSheet !== null} onClose={handleCloseSheet} title={sheetTitle}>
        {openSheet === 'terms' && (
          <div className="space-y-3 text-sm text-hyundai-gray-700 leading-relaxed">
            <p className="font-semibold text-hyundai-gray-900">제1조 (목적)</p>
            <p>
              본 약관은 사용자가 정비 견적 검증 서비스(이하 &quot;서비스&quot;)를 이용함에 있어
              서비스와 사용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
            </p>
            <p className="font-semibold text-hyundai-gray-900">제2조 (서비스 이용)</p>
            <p>
              사용자는 본 약관 및 관련 법령을 준수하는 범위 내에서 서비스가 제공하는 기능을
              자유롭게 이용할 수 있습니다. 서비스는 견적 검증 결과를 참고 정보로 제공하며, 실제
              정비·수리 결정의 책임은 사용자에게 있습니다.
            </p>
          </div>
        )}
        {openSheet === 'privacy' && (
          <div className="space-y-3 text-sm text-hyundai-gray-700 leading-relaxed">
            <p className="font-semibold text-hyundai-gray-900">제1조 (개인정보의 수집 및 이용 목적)</p>
            <p>
              서비스는 견적 검증 제공, 이용 이력 관리, 고객 문의 응대 등을 위하여 최소한의
              개인정보를 수집·이용합니다.
            </p>
            <p className="font-semibold text-hyundai-gray-900">제2조 (보유 및 이용 기간)</p>
            <p>
              개인정보는 관련 법령에서 정한 기간 또는 서비스 이용 목적 달성 시까지 보유·이용되며,
              이후에는 지체 없이 파기됩니다.
            </p>
          </div>
        )}
        {openSheet === 'contact' && !contactDone && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">제목</span>
              <Input
                placeholder="문의 제목을 입력해주세요"
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                className="text-base"
                fullWidth
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">내용</span>
              <textarea
                placeholder="문의 내용을 자세히 작성해주세요"
                value={contactContent}
                onChange={(e) => setContactContent(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-hyundai-gray-200 text-base text-hyundai-gray-900 placeholder:text-hyundai-gray-300 focus:outline-none focus:ring-2 focus:ring-hyundai-gray-900 focus:border-transparent resize-none"
              />
            </label>
            <button
              type="button"
              onClick={handleContactSubmit}
              disabled={!contactTitle.trim() || !contactContent.trim() || contactSubmitting}
              className="w-full py-3.5 rounded-2xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {contactSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />접수 중...</>
              ) : '문의하기'}
            </button>
          </div>
        )}
        {openSheet === 'contact' && contactDone && (
          <div className="flex flex-col items-center py-6">
            <div className="w-14 h-14 rounded-full bg-semantic-success-light flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-semantic-success-main" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-hyundai-gray-900 mb-1">
              문의가 접수되었어요!
            </p>
            <p className="text-sm text-hyundai-gray-500 text-center">
              빠르게 확인 후 답변 드릴게요.
            </p>
            <button
              type="button"
              onClick={handleCloseSheet}
              className="mt-6 w-full py-3.5 rounded-2xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              확인
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
};

/* ===== 서브 컴포넌트 ===== */

function MenuRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-hyundai-gray-400">{icon}</span>
        <span className="text-sm text-hyundai-gray-900">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
    </button>
  );
}

function ToggleRow({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue: boolean;
}) {
  const [checked, setChecked] = useState(defaultValue);

  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-hyundai-gray-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors ${
          checked ? 'bg-hyundai-gray-900' : 'bg-hyundai-gray-200'
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform shadow-sm ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default SettingsPage;
