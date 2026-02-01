'use client';

import React, { useState } from 'react';
import { BookOpen, DollarSign, AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card } from '@/components/ui';

const GuidePage: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = [
    {
      id: 'basic',
      title: '기본 정비 상식',
      Icon: BookOpen,
      items: [
        {
          title: '엔진오일 교환 주기',
          content:
            '일반적으로 5,000~10,000km 또는 6개월마다 교환을 권장합니다. 차종과 사용 환경에 따라 달라질 수 있어요.',
        },
        {
          title: '브레이크 패드 교체 시기',
          content:
            '주행거리 30,000~50,000km 또는 2~3년마다 교체가 필요합니다. 제동 시 소음이나 거리 증가가 느껴지면 점검해보세요.',
        },
        {
          title: '타이어 교체 기준',
          content:
            '마모도가 1.6mm 이하가 되면 교체가 필요합니다. 보통 40,000~60,000km 주행 시 교체 시기가 됩니다.',
        },
      ],
    },
    {
      id: 'cost',
      title: '비용 관련',
      Icon: DollarSign,
      items: [
        {
          title: '부품비 vs 공임비',
          content:
            '부품비는 교체할 부품의 가격이고, 공임비는 정비사가 작업하는 비용입니다. 견적서에서 두 항목이 분리되어 있어요.',
        },
        {
          title: '순정부품 vs OEM 부품',
          content:
            '순정부품은 제조사 공식 부품이고, OEM은 호환 부품입니다. OEM 부품 사용 시 비용을 절감할 수 있지만 보증 범위를 확인해야 해요.',
        },
        {
          title: '표준정비시간',
          content:
            '제조사에서 정한 작업별 표준 시간입니다. 공임비는 표준정비시간 × 시간당 공임으로 계산됩니다.',
        },
      ],
    },
    {
      id: 'safety',
      title: '안전 관련',
      Icon: AlertTriangle,
      items: [
        {
          title: '즉시 수리가 필요한 증상',
          content:
            '브레이크 이상, 타이어 펑크, 엔진 경고등 점등 등은 즉시 정비소를 방문해야 합니다. 안전과 직결된 문제예요.',
        },
        {
          title: '예방 정비의 중요성',
          content:
            '정기 점검을 통해 작은 문제를 미리 발견하면 큰 수리비를 절감할 수 있어요. 권장 주기를 지키는 것이 중요합니다.',
        },
      ],
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <>
      <Header title="정비 상식" />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-4">
            <div className="mb-4">
              <h2 className="text-h2 text-hyundai-gray-900 mb-2">
                정비 상식 알아보기
              </h2>
              <p className="text-body-2 text-hyundai-gray-600">
                자동차 정비에 대한 기본 지식을 알아보세요
              </p>
            </div>

            <div className="space-y-3">
              {categories.map((category) => {
                const CategoryIcon = category.Icon;
                return (
                  <Card key={category.id} variant="default" padding="none" className="overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-hyundai-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-hyundai-gray-100 flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-hyundai-gray-600" />
                        </div>
                        <h3 className="text-h4 text-hyundai-gray-900">{category.title}</h3>
                      </div>
                      {expandedCategory === category.id ? (
                        <ChevronUp className="w-5 h-5 text-hyundai-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-hyundai-gray-400" />
                      )}
                    </button>

                  {expandedCategory === category.id && (
                    <div className="px-6 pb-4 space-y-3 border-t border-hyundai-gray-200 pt-4">
                      {category.items.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="text-body-1 font-semibold text-hyundai-gray-900">
                            {item.title}
                          </h4>
                          <p className="text-body-2 text-hyundai-gray-600 leading-relaxed">
                            {item.content}
                          </p>
                          {index < category.items.length - 1 && (
                            <div className="border-b border-hyundai-gray-100 pt-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                );
              })}
            </div>

            {/* 추가 정보 */}
            <Card variant="highlighted" padding="md">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-hyundai-gray-600" />
                <h3 className="text-h4 text-hyundai-gray-900">더 알아보기</h3>
              </div>
              <p className="text-body-2 text-hyundai-gray-600">
                정비 관련 궁금한 점이 있으시면 정비소에 직접 문의하시거나, 공식 서비스센터를
                방문해보세요.
              </p>
            </Card>
          </div>
        </Container>
      </main>
    </>
  );
};

export default GuidePage;
