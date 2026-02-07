'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Image, PenTool, RotateCcw, X, Crop, ChevronRight, Zap, ZapOff } from 'lucide-react';
import ImageCropOverlay from '@/components/verification/ImageCropOverlay';
import { compressImage, analyzeImageQuality, ImageQualityResult } from '@/lib/utils/image';

const CameraPage: React.FC = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [albumError, setAlbumError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [qualityWarning, setQualityWarning] = useState<{
    issues: ImageQualityResult['issues'];
    sharpness: number;
    brightness: number;
  } | null>(null);

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

      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack?.getCapabilities?.() as { torch?: boolean } | undefined;
      setFlashSupported(Boolean(capabilities?.torch));

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
    setFlashOn(false);
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        videoTrack.applyConstraints({ advanced: [{ torch: false }] as unknown as MediaTrackConstraintSet[] }).catch(() => {});
      }
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      const video = videoRef.current;
      video.pause();
      video.srcObject = null;
      video.load();
    }
  };

  const toggleFlash = async () => {
    if (!stream || !flashSupported) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack || !('applyConstraints' in videoTrack)) return;
    const next = !flashOn;
    try {
      await videoTrack.applyConstraints({ advanced: [{ torch: next }] as unknown as MediaTrackConstraintSet[] });
      setFlashOn(next);
    } catch {
      setFlashOn(false);
    }
  };

  const capturePhoto = async () => {
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

      // 캔버스를 이미지로 변환 (임시 고품질)
      const rawImageData = canvas.toDataURL('image/jpeg', 0.95);

      // 카메라 중지
      stopCamera();

      // 이미지 압축 (최대 1280px, 품질 0.7)
      try {
        const compressedImage = await compressImage(rawImageData, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.7,
        });
        setCapturedImage(compressedImage);

        // 촬영 직후 품질 검증
        const quality = await analyzeImageQuality(compressedImage);
        if (quality.issues.length > 0) {
          setQualityWarning({
            issues: quality.issues,
            sharpness: quality.sharpness,
            brightness: quality.brightness,
          });
        }
      } catch (err) {
        console.error('이미지 압축 실패:', err);
        // 압축 실패 시 원본 사용
        setCapturedImage(rawImageData);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setQualityWarning(null);
    startCamera();
  };

  const handleUsePhoto = async () => {
    if (!capturedImage) return;

    // 1단계: 로컬 품질 체크 (선택)
    try {
      const quality = await analyzeImageQuality(capturedImage);
      if (quality.issues.length > 0) {
        setQualityWarning({
          issues: quality.issues,
          sharpness: quality.sharpness,
          brightness: quality.brightness,
        });
        return;
      }
    } catch (e) {
      console.warn('[DEBUG] 로컬 이미지 품질 분석 실패, 진행:', e);
    }

    // 2단계: 이미지만 저장하고 review로 이동 → review 1단계에서 OCR 실행 및 로딩 표시
    sessionStorage.setItem('capturedEstimateImage', capturedImage);
    sessionStorage.setItem('pendingOcr', '1');
    router.push('/verify/review');
  };

  const handleBack = () => {
    stopCamera();
    router.back();
  };

  // 앨범에서 바로 선택하기
  const handleAlbumFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증 (HEIF/HEIC도 image/로 시작하지 않을 수 있으므로 확장자도 체크)
    const isImage = file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp|heif|heic)$/i.test(file.name);
    if (!isImage) {
      setAlbumError('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    // 파일 크기 검증 (20MB 제한 - 압축 전이므로 여유 있게)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setAlbumError('파일 크기는 20MB 이하여야 합니다.');
      return;
    }

    setAlbumError(null);

    // 카메라 중지
    stopCamera();

    try {
      // 이미지 압축 및 JPEG 변환 (HEIF/HEIC → JPEG 변환 포함)
      const compressedImage = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.7,
      });
      setCapturedImage(compressedImage);

      // 앨범 선택 직후 품질 검증
      const quality = await analyzeImageQuality(compressedImage);
      if (quality.issues.length > 0) {
        setQualityWarning({
          issues: quality.issues,
          sharpness: quality.sharpness,
          brightness: quality.brightness,
        });
      }
    } catch (err) {
      console.error('이미지 처리 실패:', err);
      setAlbumError('이미지를 처리하는 중 오류가 발생했습니다.');
    }
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
      <main className="flex flex-col h-[100dvh] bg-hyundai-gray-900 overflow-hidden">
        {/* 얇은 상단바: 왼쪽 플래시, 오른쪽 X 닫기 */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,12px),12px)] pb-3 min-h-[52px] bg-black/40 backdrop-blur-sm">
          <div className="w-10 h-10 flex items-center justify-center">
            {!capturedImage && (
              <button
                type="button"
                onClick={toggleFlash}
                disabled={!flashSupported}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  flashSupported
                    ? flashOn
                      ? 'bg-white/90 text-hyundai-gray-900'
                      : 'bg-white/20 text-white active:bg-white/30'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
                aria-label={flashOn ? '플래시 끄기' : '플래시 켜기'}
              >
                {flashOn ? (
                  <Zap className="w-5 h-5" strokeWidth={1.5} fill="currentColor" />
                ) : (
                  <ZapOff className="w-5 h-5" strokeWidth={1.5} />
                )}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center active:bg-white/30 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

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
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
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

        {/* 로컬 품질 경고 오버레이 */}
        {qualityWarning && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm">
              <p className="text-sm text-hyundai-gray-900 mb-3 font-medium">
                사진을 조금만 더 선명하게 찍어볼까요?
              </p>
              <p className="text-xs text-hyundai-gray-500 mb-4">
                {qualityWarning.issues.includes('blurry') && '사진이 살짝 흔들려 글자가 흐릿하게 보일 수 있어요. '}
                {qualityWarning.issues.includes('too_dark') && '화면이 어두워 글자를 제대로 읽기 어려울 수 있어요. '}
                {qualityWarning.issues.includes('too_bright') && '화면이 너무 밝아 글자가 날아갔을 수 있어요. '}
                견적서를 또렷하게 인식하기 위해 다시 한 번 촬영을 부탁드려요.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setQualityWarning(null);
                    retakePhoto();
                  }}
                  className="w-full py-2.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
                >
                  다시 촬영하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 숨겨진 캔버스 (촬영용) */}
        <canvas ref={canvasRef} className="hidden" />
        {/* 숨겨진 파일 입력 (앨범 선택용) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAlbumFileSelect}
        />

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
              <div className="space-y-2">
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      // 카메라 일시 정지 후 앨범에서 바로 선택
                      stopCamera();
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
                  >
                    <Image className="w-4 h-4" strokeWidth={1.5} />
                    앨범에서 선택
                  </button>
                  <button
                    onClick={() => {
                      stopCamera();
                      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('directInput', 'true');
                      router.push('/verify/review');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
                  >
                    <PenTool className="w-4 h-4" strokeWidth={1.5} />
                    직접 입력
                  </button>
                </div>
                {albumError && (
                  <p className="text-xs text-red-500 text-center">{albumError}</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default CameraPage;
