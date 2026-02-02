import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui';

const VerificationCTA: React.FC = () => {
  return (
    <Link href="/verify/camera" className="block">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="h-14 rounded-2xl text-base font-semibold shadow-card"
      >
        <div className="flex items-center justify-center gap-2.5">
          <FileText className="w-5 h-5" strokeWidth={2} />
          <span>견적서 검증하기</span>
        </div>
      </Button>
    </Link>
  );
};

export default VerificationCTA;
