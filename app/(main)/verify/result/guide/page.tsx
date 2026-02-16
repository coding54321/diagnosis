'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Copy, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { mockVerificationResult } from '@/lib/mockData';

const QuestionGuidePage: React.FC = () => {
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  // 확인이 필요한 항목들 (목업)
  const reviewNeededItems = mockVerificationResult.items.filter(
    (item) => item.status === 'review_needed'
  );

  // 질문 템플릿 (항목별)
  const questionTemplates: Record<string, Array<{ id: string; question: string; explanation: string }>> = {
    'item-1': [
      {
        id: 'q1',
        question: '4기통 전부 클리닝하는 건가요?',
        explanation:
          '일부 정비소는 전체 기통이 아닌 문제 있는 기통만 작업하기도 해요. 전체 작업이 맞는지 확인해보세요.',
      },
      {
        id: 'q2',
        question: '어떤 세척제를 사용하나요?',
        explanation:
          '세척제 종류(일반/고급/수입)에 따라 가격이 달라질 수 있어요. 고급 세척제라면 가격이 높을 수 있어요.',
      },
      {
        id: 'q3',
        question: '꼭 지금 해야 하나요?',
        explanation:
          '긴급한 수리인지, 예방 차원인지 확인해보세요. 급하지 않다면 다음 정기 점검 때 해도 될 수 있어요.',
      },
    ],
    default: [
      {
        id: 'q1',
        question: '이 작업의 표준 공임 시간이 얼마인가요?',
        explanation:
          '표준정비시간을 확인하여 공임비 산정이 적정한지 확인할 수 있어요.',
      },
      {
        id: 'q2',
        question: '부품을 순정 대신 OEM 제품으로 사용 가능한가요?',
        explanation:
          'OEM 호환 부품 사용 시 비용을 절감할 수 있어요. 차량 보증에 영향이 없는지 확인해보세요.',
      },
      {
        id: 'q3',
        question: '이 작업을 지금 하지 않으면 어떤 문제가 생기나요?',
        explanation:
          '긴급도에 따라 작업 시기를 조절할 수 있어요. 안전 관련이 아니라면 다음 정기 점검 때 해도 될 수 있어요.',
      },
    ],
  };

  const handleCopyQuestion = async (question: string) => {
    try {
      await navigator.clipboard.writeText(question);
      alert('질문이 복사되었습니다!');
    } catch (err) {
      console.error('복사 실패:', err);
      alert('복사에 실패했습니다. 직접 입력해주세요.');
    }
  };

  const toggleCheck = (itemId: string) => {
    setCheckedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <>
      <Header title="정비사 상담 가이드" showBackButton onBack={() => router.back()} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-6 animate-fade-in-up">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-6 h-6 text-hyundai-gray-600" />
                <h2 className="text-h2 text-hyundai-gray-900">
                  이런 질문을 해보세요
                </h2>
              </div>
              <p className="text-body-2 text-hyundai-gray-600">
                정비사분께 확인하면 좋을 내용을 정리했어요. 부담 없이 질문해보세요!
              </p>
            </div>

            {reviewNeededItems.length > 0 ? (
              reviewNeededItems.map((item) => {
                const questions =
                  questionTemplates[item.itemId] || questionTemplates.default;

                return (
                  <div key={item.itemId} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" size="md" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        평균보다 높음
                      </Badge>
                      <span className="text-body-1 text-hyundai-gray-700">
                        인젝터 클리닝
                      </span>
                    </div>

                    <div className="space-y-3">
                      {questions.map((q, index) => (
                        <Card key={q.id} variant="default" padding="md">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-caption text-hyundai-gray-500 mb-1">
                                  Q{index + 1}.
                                </p>
                                <p className="text-body-1 text-hyundai-gray-900 font-medium mb-2">
                                  "{q.question}"
                                </p>
                                <p className="text-body-2 text-hyundai-gray-600 leading-relaxed">
                                  → {q.explanation}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              onClick={() => handleCopyQuestion(q.question)}
                              className="flex items-center justify-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              복사하기
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <Card variant="default" padding="md" className="text-center">
                <p className="text-body-1 text-hyundai-gray-700">
                  확인이 필요한 항목이 없습니다.
                </p>
              </Card>
            )}

            {/* 확인 완료 체크리스트 */}
            <Card variant="highlighted" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-semantic-success-main" />
                <h3 className="text-h4 text-hyundai-gray-900">확인 완료!</h3>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'check1', label: '정비사 설명을 들었어요' },
                  { id: 'check2', label: '가격 조정이 있었어요' },
                  { id: 'check3', label: '일부 항목을 빼기로 했어요' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 cursor-pointer touch-target"
                  >
                    <input
                      type="checkbox"
                      checked={checkedItems.includes(item.id)}
                      onChange={() => toggleCheck(item.id)}
                      className="w-5 h-5 text-hyundai-blue-500 border-hyundai-gray-300 rounded focus:ring-hyundai-blue-500"
                    />
                    <span className="text-body-1 text-hyundai-gray-900">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            {/* 검증 결과로 돌아가기 */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push('/verify/result')}
            >
              검증 결과로 돌아가기
            </Button>
          </div>
        </Container>
      </main>
    </>
  );
};

export default QuestionGuidePage;
