import QRCode from 'qrcode';
export async function GET() {
  const svg = await QRCode.toString('https://cardashdetailing.com/gift-cards', {type:'svg',errorCorrectionLevel:'M',margin:4,width:600});
  return new Response(svg,{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=86400','Content-Disposition':'inline; filename="car-dash-gift-card-qr.svg"'}});
}
