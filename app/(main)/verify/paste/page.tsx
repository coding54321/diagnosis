'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import { analyzeEstimateFromText } from '@/lib/openai/vision';

const PastePage: React.FC = () => {
  const router = useRouter();
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setError('견적서 텍스트를 붙여넣어 주세요.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeEstimateFromText(trimmed);

      if (!result.success) {
        if (result.status === 'NOT_ESTIMATE') {
          setError('견적서가 아닌 것으로 보입니다. 정비소 견적서 내용을 붙여넣어 주세요.');
        } else {
          setError(result.error || '분석 중 오류가 발생했습니다.');
        }
        setIsAnalyzing(false);
        return;
      }

      sessionStorage.removeItem('capturedEstimateImage');
      sessionStorage.setItem('ocrResult', JSON.stringify(result));
      router.push('/verify/review');
    } catch (e) {
      setError('분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-white pb-8">
      <div className="flex items-center px-4 pt-[env(safe-area-inset-top,0px)] pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-12 flex items-center text-hyundai-gray-700"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-4 max-w-lg mx-auto">
        <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
          견적서 텍스트 붙여넣기
        </h1>
        <p className="text-sm text-hyundai-gray-400 mt-1.5">
          견적서나 명세서에서 복사한 텍스트를 붙여넣으면 항목과 금액을 자동으로 인식해요
        </p>

        <div className="mt-6">
          <textarea
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              setError(null);
            }}
            placeholder="예:&#10;정비소명: ○○자동차정비&#10;엔진오일 교환 50,000원&#10;오일필터 교환 15,000원&#10;..."
            className="w-full min-h-[240px] px-4 py-3 rounded-2xl border border-hyundai-gray-200 text-sm text-hyundai-gray-900 placeholder:text-hyundai-gray-300 focus:outline-none focus:ring-2 focus:ring-hyundai-gray-900/20 focus:border-hyundai-gray-300 resize-y"
            disabled={isAnalyzing}
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !pastedText.trim()}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              분석 중...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" strokeWidth={1.5} />
              분석하기
            </>
          )}
        </button>
      </div>
    </main>
  );
};

export default PastePage;
