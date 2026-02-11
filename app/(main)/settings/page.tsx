'use client';

import React, { useState } from 'react';
import { ChevronRight, MessageCircle, FileText, Lock } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui';

const SettingsPage: React.FC = () => {
  return (
    <main className="flex-1 bg-hyundai-gray-50">
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
              <ToggleRow label="검증 완료 알림" defaultValue={true} />
              <div className="mx-5 border-b border-hyundai-gray-100" />
              <ToggleRow label="마케팅 알림" defaultValue={false} />
            </Card>
          </div>

          <div>
            <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">지원</p>
            <Card variant="default" padding="none">
              <MenuRow
                icon={<MessageCircle className="w-4 h-4" strokeWidth={1.5} />}
                label="고객센터 문의"
              />
              <div className="mx-5 border-b border-hyundai-gray-100" />
              <MenuRow
                icon={<FileText className="w-4 h-4" strokeWidth={1.5} />}
                label="이용약관"
              />
              <div className="mx-5 border-b border-hyundai-gray-100" />
              <MenuRow
                icon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                label="개인정보처리방침"
              />
            </Card>
          </div>

          <p className="text-center text-[11px] text-hyundai-gray-300 py-2">
            앱 버전 1.0.0
          </p>
        </div>
      </Container>
    </main>
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
