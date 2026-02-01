'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Image, PenTool, Lightbulb, RotateCcw, X } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Button } from '@/components/ui';

const CameraPage: React.FC = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 카메라 시작
  useEffect(() => {
    let isMounted = true;
    
    const initCamera = async () => {
      if (isMounted) {
        await startCamera();
      }
    };
    
    initCamera();
    
    return () => {
      isMounted = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 기존 스트림 정리
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // 모바일에서는 후면 카메라 우선, 데스크톱에서는 기본 카메라
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // 후면 카메라 (모바일)
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        // 비디오가 로드될 때까지 기다린 후 재생
        const handleLoadedMetadata = async () => {
          try {
            await video.play();
          } catch (playError) {
            // play() 에러는 무시 (사용자가 아직 상호작용하지 않았을 수 있음)
            console.log('비디오 재생 대기 중...', playError);
          }
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        // 이미 로드된 경우 즉시 재생 시도
        if (video.readyState >= 2) {
          handleLoadedMetadata();
        }
      }
    } catch (err) {
      console.error('카메라 접근 오류:', err);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      const video = videoRef.current;
      video.pause();
      video.srcObject = null;
      video.load(); // 비디오 요소 리셋
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 비디오 크기에 맞춰 캔버스 크기 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 캔버스를 이미지로 변환
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      
      // 카메라 중지
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      // sessionStorage에 이미지 저장
      sessionStorage.setItem('capturedEstimateImage', capturedImage);
      router.push('/verify/review');
    }
  };

  const handleBack = () => {
    stopCamera();
    router.back();
  };

  return (
    <>
      <Header title="견적서 촬영" showBackButton onBack={handleBack} />
      
      <main className="min-h-screen bg-black pb-20">
        <Container>
          <div className="py-6 space-y-4">
            {/* 카메라 뷰파인더 또는 촬영된 이미지 */}
            <div className="relative aspect-[3/4] bg-hyundai-gray-900 rounded-lg overflow-hidden mb-4">
              {capturedImage ? (
                // 촬영된 이미지 미리보기
                <div className="relative w-full h-full">
                  <img
                    src={capturedImage}
                    alt="촬영된 견적서"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={retakePhoto}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                // 카메라 뷰파인더
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={async () => {
                      if (videoRef.current) {
                        try {
                          await videoRef.current.play();
                        } catch (err) {
                          // play() 에러는 무시
                          console.log('비디오 재생 대기 중...');
                        }
                      }
                    }}
                  />
                  
                  {/* 로딩 상태 */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-body-2">카메라 준비 중...</p>
                      </div>
                    </div>
                  )}

                  {/* 에러 상태 */}
                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="text-white text-center p-6">
                        <p className="text-body-1 mb-4">{error}</p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={startCamera}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          다시 시도
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 가이드 프레임 */}
                  {!isLoading && !error && (
                    <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50 pointer-events-none" />
                  )}
                </>
              )}
            </div>

            {/* 숨겨진 캔버스 (촬영용) */}
            <canvas ref={canvasRef} className="hidden" />

            <Card variant="default" padding="md" className="bg-white/90 backdrop-blur">
              {capturedImage ? (
                // 촬영 완료 후 버튼
                <div className="space-y-3">
                  <div className="text-center space-y-2 mb-4">
                    <p className="text-body-1 text-hyundai-gray-900 font-medium">
                      촬영이 완료되었습니다
                    </p>
                    <p className="text-body-2 text-hyundai-gray-600">
                      사진을 확인하고 다음 단계로 진행하세요
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={retakePhoto}
                      className="flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      다시 촬영
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleUsePhoto}
                      className="flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      이 사진 사용
                    </Button>
                  </div>
                </div>
              ) : (
                // 촬영 전 버튼
                <>
                  <div className="text-center space-y-2 mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <Lightbulb className="w-5 h-5 text-hyundai-blue-500" />
                      <p className="text-body-1 text-hyundai-gray-900 font-medium">
                        견적서 전체가 보이도록 촬영해주세요
                      </p>
                    </div>
                    <p className="text-body-2 text-hyundai-gray-600">
                      글씨가 선명하게 나오면 인식률이 높아져요
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        stopCamera();
                        router.push('/verify/album');
                      }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Image className="w-4 h-4" />
                      앨범
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={capturePhoto}
                      disabled={isLoading || !!error || !stream}
                      className="flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      촬영
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        stopCamera();
                        router.push('/verify/manual');
                      }}
                      className="flex items-center justify-center gap-2"
                    >
                      <PenTool className="w-4 h-4" />
                      직접입력
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </Container>
      </main>
    </>
  );
};

export default CameraPage;
