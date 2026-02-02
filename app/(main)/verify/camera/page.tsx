'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Image, PenTool, RotateCcw, X, Crop, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui';
import ImageCropOverlay from '@/components/verification/ImageCropOverlay';

const CameraPage: React.FC = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
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
      {showCrop && capturedImage && (
        <ImageCropOverlay
          imageSrc={capturedImage}
          onApply={(cropped) => {
            setCapturedImage(cropped);
            setShowCrop(false);
          }}
          onCancel={() => setShowCrop(false)}
        />
      )}
      <Header title="견적서 촬영" showBackButton onBack={handleBack} />

      <main className="flex flex-col h-[calc(100dvh-56px)] bg-hyundai-gray-900 overflow-hidden">
        {/* 뷰파인더 - 화면 가득 채움 */}
        <div className="relative flex-1">
          {capturedImage ? (
            <div className="absolute inset-0">
              <img
                src={capturedImage}
                alt="촬영된 견적서"
                className="w-full h-full object-contain bg-black"
              />
              <button
                onClick={retakePhoto}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="absolute inset-0">
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
                    } catch {
                      console.log('비디오 재생 대기 중...');
                    }
                  }
                }}
              />

              {/* 로딩 */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                      <Camera className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-white/70">카메라 준비 중...</p>
                  </div>
                </div>
              )}

              {/* 에러 */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-white text-center px-8">
                    <p className="text-sm mb-4 text-white/80">{error}</p>
                    <button
                      onClick={startCamera}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-hyundai-gray-900 text-sm font-medium active:bg-hyundai-gray-100 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                      다시 시도
                    </button>
                  </div>
                </div>
              )}

              {/* 가이드 프레임 — 코너만 표시 */}
              {!isLoading && !error && (
                <div className="absolute inset-6 pointer-events-none">
                  {/* 좌상 */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-md" />
                  {/* 우상 */}
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-md" />
                  {/* 좌하 */}
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-md" />
                  {/* 우하 */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-md" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 숨겨진 캔버스 (촬영용) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 하단 컨트롤 */}
        <div className="relative z-10 shrink-0 bg-white rounded-t-2xl px-5 pt-5 pb-8">
          {capturedImage ? (
            <>
              <p className="text-center text-sm text-hyundai-gray-400 mb-4">
                사진을 확인하고 다음 단계로 진행하세요
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={retakePhoto}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                  재촬영
                </button>
                <button
                  onClick={() => setShowCrop(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
                >
                  <Crop className="w-4 h-4" strokeWidth={1.5} />
                  자르기
                </button>
                <button
                  onClick={handleUsePhoto}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-hyundai-gray-900 text-sm font-medium text-white active:bg-hyundai-gray-800 transition-colors"
                >
                  분석하기
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-hyundai-gray-400 mb-4">
                견적서 전체가 보이도록 촬영해주세요
              </p>

              {/* 촬영 버튼 (메인) */}
              <div className="flex items-center justify-center mb-5">
                <button
                  onClick={capturePhoto}
                  disabled={isLoading || !!error || !stream}
                  className="w-16 h-16 rounded-full border-[3px] border-hyundai-gray-900 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30 disabled:active:scale-100"
                >
                  <div className="w-12 h-12 rounded-full bg-hyundai-gray-900" />
                </button>
              </div>

              {/* 보조 액션 */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    stopCamera();
                    router.push('/verify/album');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
                >
                  <Image className="w-4 h-4" strokeWidth={1.5} />
                  앨범에서 선택
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    router.push('/verify/manual');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
                >
                  <PenTool className="w-4 h-4" strokeWidth={1.5} />
                  직접 입력
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default CameraPage;
