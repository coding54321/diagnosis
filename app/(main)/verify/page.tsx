'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Image, PenTool, ChevronRight } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card } from '@/components/ui';

const InputMethodPage: React.FC = () => {
  const router = useRouter();

  const inputMethods = [
    {
      id: 'camera',
      title: '사진 촬영',
      description: '견적서를 카메라로 찍어주세요',
      Icon: Camera,
      href: '/verify/camera',
      primary: true,
    },
    {
      id: 'album',
      title: '앨범에서 선택',
      description: '이미 촬영한 사진이 있다면',
      Icon: Image,
      href: '/verify/album',
      primary: false,
    },
    {
      id: 'manual',
      title: '직접 입력',
      description: '항목을 직접 입력할게요',
      Icon: PenTool,
      href: '/verify/manual',
      primary: false,
    },
  ];

  return (
    <>
      <Header title="견적서 입력" showBackButton onBack={() => router.back()} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-4">
            <div className="mb-6">
              <h2 className="text-h2 text-hyundai-gray-900 mb-2">
                견적서를 어떻게 입력할까요?
              </h2>
              <p className="text-body-2 text-hyundai-gray-600">
                가장 빠른 방법은 사진 촬영입니다
              </p>
            </div>

            <div className="space-y-3">
              {inputMethods.map((method) => {
                const Icon = method.Icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => router.push(method.href)}
                    className="w-full text-left"
                  >
                    <Card
                      variant={method.primary ? 'highlighted' : 'default'}
                      padding="md"
                      className="hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          method.primary 
                            ? 'bg-hyundai-blue-500 text-white' 
                            : 'bg-hyundai-gray-100 text-hyundai-gray-600'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-h4 text-hyundai-gray-900 mb-1">
                            {method.title}
                          </h3>
                          <p className="text-body-2 text-hyundai-gray-600">
                            {method.description}
                          </p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-hyundai-gray-400" />
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        </Container>
      </main>
    </>
  );
};

export default InputMethodPage;
