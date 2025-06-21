
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, X } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { toast } from '@/hooks/use-toast';

interface QRCodeScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          setIsScanning(false);
          onScanSuccess(result.data);
          scanner.stop();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      setQrScanner(scanner);
      
      scanner.start().then(() => {
        setIsScanning(true);
      }).catch((error) => {
        console.error('Failed to start QR scanner:', error);
        toast({
          title: "Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive",
        });
      });

      return () => {
        scanner.stop();
        scanner.destroy();
      };
    }
  }, [onScanSuccess]);

  const handleClose = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
    }
    onClose();
  };

  return (
    <Card className="fixed inset-4 z-50 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Scan Gym QR Code
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="relative w-full max-w-md">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-lg"
            style={{ objectFit: 'cover' }}
          />
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-green-500 w-48 h-48 rounded-lg animate-pulse"></div>
            </div>
          )}
        </div>
        <p className="text-center text-gray-600 mt-4">
          Position the QR code within the frame to mark your attendance
        </p>
      </CardContent>
    </Card>
  );
};
