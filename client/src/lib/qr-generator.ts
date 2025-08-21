import QRCode from 'qrcode';

export async function generateQRCode(text: string): Promise<string> {
  try {
    // Validate URL
    if (!text || !text.startsWith('http')) {
      throw new Error('Invalid URL for QR code');
    }
    
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Fallback to online QR code generator
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=${encodeURIComponent(text)}`;
    return fallbackUrl;
  }
}

export async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    const qrCodeSVG = await QRCode.toString(text, {
      type: 'svg',
      width: 200,
      margin: 2,
    });
    return qrCodeSVG;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code');
  }
}
