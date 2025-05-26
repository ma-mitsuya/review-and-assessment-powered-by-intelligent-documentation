import { useState, useEffect, useRef } from "react";
import { usePresignedDownloadUrl } from "../hooks/usePresignedDownloadUrl";
import Spinner from "./Spinner";
import Modal from "./Modal";
import Button from "./Button";
import { HiEye, HiZoomIn } from "react-icons/hi";

interface ImagePreviewProps {
  s3Key: string;
  filename: string;
  thumbnailHeight?: number;
  boundingBox?: {
    label: string;
    coordinates: [number, number, number, number]; // [x1, y1, x2, y2]
  };
}

export default function ImagePreview({
  s3Key,
  filename,
  thumbnailHeight = 100,
  boundingBox,
}: ImagePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const { getPresignedUrl, isLoading, error } = usePresignedDownloadUrl();
  const imageRef = useRef<HTMLImageElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const presignedUrl = await getPresignedUrl(s3Key);
        setUrl(presignedUrl);
      } catch (err) {
        console.error("Failed to get presigned URL", err);
      }
    };

    fetchUrl();
  }, [s3Key]);

  // モーダル内の画像がロードされたときにサイズを取得
  const handleModalImageLoad = () => {
    if (modalImageRef.current) {
      setImageSize({
        width: modalImageRef.current.naturalWidth,
        height: modalImageRef.current.naturalHeight,
      });
    }
  };

  // バウンディングボックスを描画する関数
  const renderBoundingBox = () => {
    if (!boundingBox || !imageSize) return null;

    const { coordinates, label } = boundingBox;
    const [x1, y1, x2, y2] = coordinates;

    // Nova の座標は 0-1000 のスケールなので、実際の画像サイズに変換
    const scaledX1 = (x1 / 1000) * imageSize.width;
    const scaledY1 = (y1 / 1000) * imageSize.height;
    const scaledX2 = (x2 / 1000) * imageSize.width;
    const scaledY2 = (y2 / 1000) * imageSize.height;

    // モーダル内の画像の表示サイズに合わせてスケーリング
    const modalImage = modalImageRef.current;
    if (!modalImage) return null;

    const displayRatio = modalImage.width / imageSize.width;

    const boxStyle = {
      position: "absolute" as const,
      left: `${scaledX1 * displayRatio}px`,
      top: `${scaledY1 * displayRatio}px`,
      width: `${(scaledX2 - scaledX1) * displayRatio}px`,
      height: `${(scaledY2 - scaledY1) * displayRatio}px`,
      border: "2px solid red",
      boxSizing: "border-box" as const,
      pointerEvents: "none" as const,
    };

    const labelStyle = {
      position: "absolute" as const,
      left: `${scaledX1 * displayRatio}px`,
      top: `${scaledY1 * displayRatio - 20}px`,
      backgroundColor: "rgba(255, 0, 0, 0.7)",
      color: "white",
      padding: "2px 4px",
      fontSize: "12px",
      borderRadius: "2px",
      pointerEvents: "none" as const,
    };

    return (
      <>
        <div style={boxStyle}></div>
        <div style={labelStyle}>{label}</div>
      </>
    );
  };

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  if (error) {
    return <div className="text-red-500">画像のURLの取得に失敗しました</div>;
  }

  if (!url) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col items-start">
        <div
          className="relative overflow-hidden rounded border border-light-gray"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => setIsModalOpen(true)}
        >
          <img
            ref={imageRef}
            src={url}
            alt={filename}
            style={{ height: thumbnailHeight }}
            className="object-contain cursor-pointer transition-opacity"
          />

          {/* Hover overlay with zoom icon */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center transition-opacity duration-200 ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <HiZoomIn className="text-white h-6 w-6" />
            <span className="text-white text-xs mt-1">拡大表示</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={filename}
          size="lg"
        >
          <div className="flex justify-center relative">
            <img
              ref={modalImageRef}
              src={url}
              alt={filename}
              className="max-w-full max-h-[70vh] object-contain"
              onLoad={handleModalImageLoad}
            />
            {boundingBox && imageSize && renderBoundingBox()}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>閉じる</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
