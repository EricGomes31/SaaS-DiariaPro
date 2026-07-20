import { forwardRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

// Site key PÚBLICO. Configure VITE_HCAPTCHA_SITE_KEY no .env com a sua chave real do hCaptcha.
// Fallback = site key de teste do hCaptcha (sempre passa) — evita quebrar o dev antes de configurar.
const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001'

// Wrapper do hCaptcha já com tema e centralização. Encaminha a ref para dar reset()
// no widget (o token é de uso único: após cada tentativa é preciso gerar um novo).
const Captcha = forwardRef(function Captcha({ theme = 'dark', onVerify, onExpire }, ref) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <HCaptcha
        ref={ref}
        sitekey={SITE_KEY}
        theme={theme === 'light' ? 'light' : 'dark'}
        onVerify={onVerify}
        onExpire={onExpire}
        onError={onExpire}
      />
    </div>
  )
})

export default Captcha
