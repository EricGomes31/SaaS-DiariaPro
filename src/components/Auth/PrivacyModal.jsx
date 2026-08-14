import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, FileText, Cookie } from 'lucide-react'

const TABS = [
  { id: 'privacy',  label: 'Política de Privacidade', icon: Shield },
  { id: 'terms',    label: 'Termos de Uso',            icon: FileText },
  { id: 'cookies',  label: 'Cookies',                  icon: Cookie },
]

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(129,140,248,1)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </h3>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  )
}

function PrivacyContent() {
  return (
    <>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>
        Última atualização: 28 de maio de 2026. Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </p>

      <Section title="1. Quem somos">
        O <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Diária Pro</strong> é um sistema SaaS para gestão de diaristas, desenvolvido e operado por Eric Pereira de Souza. Para dúvidas sobre privacidade, entre em contato pelo e-mail <strong style={{ color: 'rgba(255,255,255,0.85)' }}>diarias.pro@gmail.com</strong>.
      </Section>

      <Section title="2. Dados que coletamos">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li style={{ marginBottom: 6 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Dados da conta:</strong> nome e e-mail do usuário administrador, necessários para autenticação.</li>
          <li style={{ marginBottom: 6 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Dados dos diaristas:</strong> nome, foto (opcional), dias trabalhados, valores de pagamento e locais de trabalho — inseridos pelo próprio usuário.</li>
          <li style={{ marginBottom: 6 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Dados de uso:</strong> log de ações no sistema (login, cadastros, pagamentos) para fins de auditoria interna.</li>
          <li><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Dados técnicos:</strong> preferências de tema e idioma, armazenados localmente no navegador.</li>
        </ul>
      </Section>

      <Section title="3. Finalidade do tratamento">
        Os dados são utilizados exclusivamente para:
        <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
          <li style={{ marginBottom: 4 }}>Autenticar o acesso ao sistema;</li>
          <li style={{ marginBottom: 4 }}>Permitir o controle de frequência e pagamentos dos diaristas;</li>
          <li style={{ marginBottom: 4 }}>Gerar relatórios para uso interno do contratante;</li>
          <li>Registrar auditoria de ações para segurança da conta.</li>
        </ul>
      </Section>

      <Section title="4. Base legal (LGPD)">
        O tratamento se baseia em:
        <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
          <li style={{ marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Execução de contrato</strong> — Art. 7º, V: necessário para prestação do serviço contratado.</li>
          <li><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Legítimo interesse</strong> — Art. 7º, IX: logs de auditoria e segurança da plataforma.</li>
        </ul>
      </Section>

      <Section title="5. Armazenamento e segurança">
        Os dados são armazenados na plataforma <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Supabase</strong> (PostgreSQL na nuvem), com criptografia em repouso e em trânsito (TLS 1.2+). O acesso é protegido por autenticação e políticas de Row-Level Security (RLS), garantindo que cada usuário acesse apenas seus próprios dados.
      </Section>

      <Section title="6. Compartilhamento de dados">
        Não compartilhamos dados com terceiros para fins comerciais. Os dados trafegam exclusivamente entre o navegador do usuário e os servidores do Supabase. Não utilizamos serviços de analytics ou publicidade.
      </Section>

      <Section title="7. Retenção">
        Os dados são mantidos enquanto a conta estiver ativa. Após o encerramento, os dados podem ser excluídos mediante solicitação.
      </Section>

      <Section title="8. Seus direitos (LGPD)">
        Como titular de dados, você tem direito a:
        <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
          <li style={{ marginBottom: 4 }}>Confirmar a existência de tratamento e acessar seus dados;</li>
          <li style={{ marginBottom: 4 }}>Corrigir dados incompletos ou desatualizados;</li>
          <li style={{ marginBottom: 4 }}>Solicitar a anonimização, bloqueio ou eliminação dos dados;</li>
          <li style={{ marginBottom: 4 }}>Portabilidade dos dados a outro fornecedor;</li>
          <li>Revogar o consentimento, quando aplicável.</li>
        </ul>
        <br />
        Para exercer esses direitos, entre em contato: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>diarias.pro@gmail.com</strong>
      </Section>
    </>
  )
}

function TermsContent() {
  return (
    <>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>
        Última atualização: 28 de maio de 2026. Ao acessar o Diária Pro, você concorda com estes termos.
      </p>

      <Section title="1. Definições">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li style={{ marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Plataforma:</strong> o sistema web Diária Pro, acessado via navegador.</li>
          <li style={{ marginBottom: 4 }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Usuário:</strong> pessoa física ou jurídica que acessa a plataforma mediante convite.</li>
          <li><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Diarista:</strong> trabalhador cujos dados são gerenciados pelo Usuário dentro da plataforma.</li>
        </ul>
      </Section>

      <Section title="2. Acesso e conta">
        O acesso é concedido por convite do administrador. Você é responsável por manter sua senha em sigilo e por todas as ações realizadas com sua conta. Em caso de uso não autorizado, notifique imediatamente o administrador do sistema.
      </Section>

      <Section title="3. Uso permitido">
        A plataforma destina-se exclusivamente à gestão de diaristas contratados pelo Usuário. É permitido:
        <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
          <li style={{ marginBottom: 4 }}>Registrar dias trabalhados e pagamentos;</li>
          <li style={{ marginBottom: 4 }}>Gerar relatórios para controle interno;</li>
          <li>Exportar dados em formato CSV ou PDF para uso pessoal.</li>
        </ul>
      </Section>

      <Section title="4. Uso proibido">
        É expressamente proibido:
        <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
          <li style={{ marginBottom: 4 }}>Utilizar a plataforma para fins ilegais ou fraudulentos;</li>
          <li style={{ marginBottom: 4 }}>Inserir dados falsos ou de terceiros sem autorização;</li>
          <li style={{ marginBottom: 4 }}>Tentar acessar dados de outros usuários;</li>
          <li>Fazer engenharia reversa ou modificar o sistema.</li>
        </ul>
      </Section>

      <Section title="5. Responsabilidade sobre os dados">
        O Usuário é o controlador dos dados dos diaristas que inserir na plataforma, sendo responsável pela legalidade da coleta e pelo cumprimento da LGPD perante esses trabalhadores. O Diária Pro atua como operador, processando os dados conforme instruções do Usuário.
      </Section>

      <Section title="6. Disponibilidade">
        Buscamos manter a plataforma disponível 24/7, mas não garantimos uptime ininterrupto. Manutenções programadas serão comunicadas com antecedência quando possível. Não somos responsáveis por perdas decorrentes de indisponibilidade temporária.
      </Section>

      <Section title="7. Limitação de responsabilidade">
        O Diária Pro não se responsabiliza por danos indiretos, lucros cessantes ou perda de dados causados por uso inadequado da plataforma, falhas de conexão do usuário ou eventos fora do nosso controle.
      </Section>

      <Section title="8. Alterações nos termos">
        Podemos atualizar estes termos a qualquer momento. A versão vigente estará sempre disponível na tela de login. O uso continuado da plataforma após alterações implica aceitação dos novos termos.
      </Section>

      <Section title="9. Foro">
        Fica eleito o foro da comarca de domicílio do Usuário para dirimir quaisquer controvérsias decorrentes destes termos, com renúncia a qualquer outro, por mais privilegiado que seja.
      </Section>
    </>
  )
}

function CookiesContent() {
  return (
    <>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>
        O Diária Pro utiliza armazenamento local do navegador para funcionar corretamente. Não utilizamos cookies de rastreamento ou publicidade.
      </p>

      <Section title="1. O que usamos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              name: 'Sessão de autenticação (Supabase)',
              type: 'Essencial',
              where: 'localStorage',
              purpose: 'Mantém você logado entre recarregamentos da página. Sem esse dado, você precisaria fazer login a cada visita.',
              duration: 'Expira automaticamente conforme configurado pelo Supabase (geralmente 1 hora de inatividade).',
            },
            {
              name: 'Preferência de tema',
              type: 'Funcional',
              where: 'localStorage',
              purpose: 'Lembra se você prefere o tema escuro ou claro.',
              duration: 'Permanente até você alterar manualmente.',
            },
            {
              name: 'Flag de convite pendente',
              type: 'Essencial',
              where: 'localStorage',
              purpose: 'Garante que novos usuários convidados completem o cadastro antes de acessar o sistema.',
              duration: 'Apagado automaticamente após conclusão do cadastro.',
            },
          ].map(item => (
            <div key={item.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{item.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: item.type === 'Essencial' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.15)',
                  color: item.type === 'Essencial' ? 'rgba(129,140,248,1)' : 'rgba(251,191,36,1)',
                }}>
                  {item.type}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{item.where}</span>
              </div>
              <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{item.purpose}</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Duração: {item.duration}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="2. Cookies de terceiros">
        Não utilizamos Google Analytics, Facebook Pixel, nem qualquer outra ferramenta de rastreamento de terceiros. As únicas requisições externas são feitas aos servidores do <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Supabase</strong> para autenticação e sincronização de dados.
      </Section>

      <Section title="3. Como gerenciar">
        Você pode limpar os dados do localStorage a qualquer momento pelas ferramentas do desenvolvedor do seu navegador (F12 → Application → Local Storage). Isso irá deslogar você do sistema.
      </Section>
    </>
  )
}

const CONTENT = { privacy: PrivacyContent, terms: TermsContent, cookies: CookiesContent }

export default function PrivacyModal({ initialTab = 'privacy', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const Content = CONTENT[activeTab]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 16px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #131325 0%, #0f0f1e 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            width: '100%', maxWidth: 600,
            maxHeight: '88vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={15} color="white" />
                </div>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#f1f5f9' }}>Diária Pro</span>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} color="rgba(255,255,255,0.5)" />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    transition: 'all 0.18s ease',
                    background: activeTab === id ? 'rgba(99,102,241,0.25)' : 'transparent',
                    color: activeTab === id ? 'rgba(129,140,248,1)' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  <Icon size={13} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 28px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <Content />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
