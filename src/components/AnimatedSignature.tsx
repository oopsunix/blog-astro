import signaturePng from '@/assets/signature.png'

export function AnimatedSignature() {
  return (
    <div className="animated-signature">
      <img 
        src={signaturePng.src} 
        alt="Signature" 
        className="signature-image"
      />
    </div>
  )
}
