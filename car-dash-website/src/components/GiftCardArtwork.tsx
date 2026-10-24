import { displayGiftCode } from '@/lib/gift-cards';
export default function GiftCardArtwork({code}:{code:string}) {
  const face: React.CSSProperties = { width:'3.5in',height:'2in',boxSizing:'border-box',padding:'.16in',background:'#141414',color:'#f5f0e6',border:'1px solid #b99a5c',position:'relative',flexShrink:0,overflow:'hidden',fontFamily:'Arial, sans-serif',printColorAdjust:'exact',WebkitPrintColorAdjust:'exact' };
  return <>
    <div style={face}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:13,fontWeight:700,letterSpacing:3}}>CAR DASH<div style={{fontSize:6,letterSpacing:2.5,color:'#cbb078',marginTop:5}}>MOBILE DETAILING</div></div><span style={{fontSize:7,letterSpacing:1.8,border:'1px solid #cbb078',padding:'6px 8px',color:'#d6b779'}}>GIFT CARD</span></div>
      <div style={{fontFamily:'Georgia, serif',fontSize:29,lineHeight:1.08,marginTop:23}}>The gift of<br/><em style={{color:'#d6b779'}}>a fresh start.</em></div>
      <div style={{position:'absolute',bottom:15,fontSize:7,letterSpacing:.5,color:'#c6c1b8'}}>cardashdetailing.com · (224) 344-3451</div>
    </div>
    <div style={face}>
      <div style={{fontSize:8,letterSpacing:1.8,color:'#d6b779'}}>CAR DASH · GIFT CARD</div>
      <div style={{display:'flex',gap:14,marginTop:12,alignItems:'center'}}>
        <div style={{flex:1,minWidth:0}}><div style={{fontFamily:'Georgia, serif',fontSize:19,lineHeight:1.15}}>Care, on your terms.</div><p style={{fontSize:8,lineHeight:1.6,color:'#d1ccc3',margin:'8px 0'}}>Scan, then enter your card number to check its balance. Present this card when paying for your detail.</p></div>
        {/* The QR is deliberately identical on every physical card. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gift-cards/qr" alt="Scan to enter your gift-card number" width={91} height={91} style={{background:'white',width:'.95in',height:'.95in'}}/>
      </div>
      <div style={{borderTop:'1px solid #ffffff30',marginTop:10,paddingTop:8}}><span style={{fontSize:6,color:'#cbb078',letterSpacing:1}}>CARD NUMBER</span><div style={{fontFamily:'monospace',fontSize:10,letterSpacing:.4,marginTop:4}}>{displayGiftCode(code)}</div></div>
    </div>
  </>;
}
