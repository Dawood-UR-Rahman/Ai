import QRCode from 'qrcode';

export async function generateQRCode(text: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
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
