import { useState, useEffect } from 'react';
import { usePresignedDownloadUrl } from '../hooks/usePresignedDownloadUrl';
import Spinner from './Spinner';
import Modal from './Modal';
import Button from './Button';
import { HiEye, HiZoomIn } from 'react-icons/hi';

interface ImagePreviewProps {
  s3Key: string;
  filename: string;
  thumbnailHeight?: number;
}

export default function ImagePreview({ s3Key, filename, thumbnailHeight = 100 }: ImagePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { getPresignedUrl, isLoading, error } = usePresignedDownloadUrl();
  
  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const presignedUrl = await getPresignedUrl(s3Key);
        setUrl(presignedUrl);
      } catch (err) {
        console.error('Failed to get presigned URL', err);
      }
    };
    
    fetchUrl();
  }, [s3Key]);
  
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
            src={url} 
            alt={filename} 
            style={{ height: thumbnailHeight }} 
            className="object-contain cursor-pointer transition-opacity"
          />
          
          {/* Hover overlay with zoom icon */}
          <div 
            className={`absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center transition-opacity duration-200 ${
              isHovering ? 'opacity-100' : 'opacity-0'
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
          <div className="flex justify-center">
            <img 
              src={url} 
              alt={filename} 
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>閉じる</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
