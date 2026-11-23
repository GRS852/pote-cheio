// Textos dos Termos de Uso e da Política de Privacidade (LGPD, Lei 13.709/2018).
//
// Ao mudar o texto de forma relevante, atualize LEGAL_UPDATED_AT aqui e a
// TERMS_VERSION na API (src/services/terms.ts): quem aceitou a versão
// anterior verá o pedido de aceite de novo no próximo acesso.

export const LEGAL_UPDATED_AT = 'novembro de 2026';
export const CONTROLLER_NAME = 'Equipe Pote Cheio';
export const CONTACT_EMAIL = 'ajuda@potecheio.site';
export const MIN_AGE = 18;

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  after?: string[];
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Sobre o Pote Cheio',
    paragraphs: [
      `O Pote Cheio é uma plataforma gratuita, mantida pela ${CONTROLLER_NAME}, que conecta pessoas que desejam doar itens para pets a pessoas interessadas em recebê-los. Ao criar uma conta ou usar a plataforma, você concorda com estes Termos de Uso e com a Política de Privacidade.`,
    ],
  },
  {
    title: '2. Quem pode usar',
    bullets: [
      `Ter ${MIN_AGE} anos ou mais. As doações envolvem combinar entregas com pessoas desconhecidas, por isso a plataforma não é destinada a menores de idade.`,
      'Informar dados verdadeiros no cadastro e manter apenas uma conta por pessoa.',
      'Guardar sua senha em segurança. Você é responsável pelo que for feito com a sua conta.',
    ],
  },
  {
    title: '3. Papel da plataforma',
    paragraphs: [
      'O Pote Cheio apenas intermedia o contato entre doadores e interessados. A combinação de local, forma e data de entrega ou retirada dos itens é de responsabilidade exclusiva das partes envolvidas.',
    ],
  },
  {
    title: '4. Responsabilidade sobre a entrega',
    paragraphs: [
      'A plataforma não se responsabiliza pela entrega, transporte, qualidade ou integridade dos itens, nem pelo não comparecimento de qualquer uma das partes. Prefira locais públicos e movimentados para a entrega e compartilhe pelo chat apenas os dados necessários.',
    ],
  },
  {
    title: '5. Conduta dos usuários',
    paragraphs: ['Ao usar o Pote Cheio, você se compromete a:'],
    bullets: [
      'Publicar informações verdadeiras sobre os itens oferecidos, com fotos do próprio item.',
      'Doar de forma gratuita: é proibido cobrar, vender ou trocar os itens publicados.',
      'Não publicar itens vencidos, estragados, proibidos por lei ou que coloquem animais em risco.',
      'Agir de boa-fé ao demonstrar interesse e respeitar as outras pessoas no chat: sem ofensas, assédio, golpes ou propaganda.',
    ],
  },
  {
    title: '6. Denúncias e moderação',
    paragraphs: [
      'Qualquer pessoa pode denunciar uma publicação ou uma conversa. A equipe de administração analisa as denúncias e, para isso, pode ler a conversa denunciada. Conforme a gravidade, a equipe pode:',
    ],
    bullets: [
      'Enviar uma advertência.',
      'Suspender a conta temporariamente.',
      'Remover a publicação que violou as regras.',
      'Desativar a conta. Contas desativadas são apagadas definitivamente após 30 dias.',
    ],
  },
  {
    title: '7. Exclusão da conta',
    paragraphs: [
      'Você pode excluir a sua conta a qualquer momento em Perfil › Excluir minha conta. As doações e entregas em andamento são canceladas, as outras pessoas envolvidas são avisadas e os seus dados são apagados, como descrito na Política de Privacidade.',
    ],
  },
  {
    title: '8. Privacidade',
    paragraphs: [
      'O tratamento dos seus dados pessoais segue a Lei Geral de Proteção de Dados (Lei 13.709/2018) e está descrito na Política de Privacidade.',
    ],
  },
  {
    title: '9. Alterações destes termos',
    paragraphs: [
      'Estes termos podem ser atualizados. Quando houver mudança relevante, pediremos o seu aceite da nova versão no próximo acesso.',
    ],
  },
  {
    title: '10. Contato',
    paragraphs: [`Dúvidas sobre estes termos: ${CONTACT_EMAIL}. Estes termos são regidos pelas leis do Brasil.`],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Quem é responsável pelos seus dados',
    paragraphs: [
      `A ${CONTROLLER_NAME} é a controladora dos dados pessoais tratados no site potecheio.site, ou seja, quem decide como e para que eles são usados. Para qualquer assunto sobre os seus dados, inclusive para exercer os seus direitos, fale conosco pelo e-mail ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: '2. Quais dados coletamos',
    bullets: [
      'Cadastro: nome completo, e-mail, data de nascimento e senha. A senha é guardada apenas de forma criptografada (hash bcrypt): nem a equipe consegue vê-la.',
      'Login com Google (se você escolher): nome, e-mail, foto de perfil e o identificador da sua conta Google. Não recebemos a sua senha do Google.',
      'Uso da plataforma: foto de perfil, doações publicadas (fotos, título, descrição e categoria), interesses e favoritos, mensagens do chat, reservas e entregas, avaliações, comentários, denúncias e notificações.',
      'Registro do aceite: data e versão dos Termos de Uso e desta Política que você aceitou.',
      'Dados técnicos: o servidor pode registrar dados de acesso, como endereço IP, data e hora, para segurança e correção de erros.',
    ],
    after: [
      'Não pedimos CPF, telefone nem endereço. Se você enviar dados como o seu endereço pelo chat para combinar uma entrega, eles ficam guardados na conversa: compartilhe apenas o necessário.',
    ],
  },
  {
    title: '3. Para que usamos os dados e com qual base legal',
    bullets: [
      'Criar e manter a sua conta, permitir o login, publicar doações, o chat, as reservas, as entregas, as notificações e a recuperação de senha por e-mail. Base legal: execução de contrato (art. 7º, V da LGPD), pois são necessários para prestar o serviço que você pediu.',
      `Verificar a idade mínima de ${MIN_AGE} anos pela data de nascimento. Base legal: execução de contrato (art. 7º, V).`,
      'Analisar denúncias, aplicar as regras de moderação e proteger a plataforma contra golpes e abusos. Base legal: legítimo interesse (art. 7º, IX), sempre limitado ao necessário.',
      'Guardar o registro do seu aceite, para comprovar que ele aconteceu (art. 8º, §2º).',
    ],
    after: ['Não vendemos os seus dados e não os usamos para publicidade.'],
  },
  {
    title: '4. O que outras pessoas podem ver',
    bullets: [
      'Ficam visíveis para outros usuários: o seu nome, a foto de perfil, as doações que você publicar, as avaliações e os comentários sobre as suas doações e os números do seu perfil (doações feitas e recebidas).',
      'O seu e-mail e a sua data de nascimento não aparecem para outros usuários.',
      'As mensagens do chat são vistas apenas pelas duas pessoas da conversa e, se a conversa for denunciada, pela equipe de administração.',
    ],
  },
  {
    title: '5. Com quem compartilhamos',
    paragraphs: ['Para funcionar, o Pote Cheio usa serviços de terceiros que tratam dados em nosso nome (operadores):'],
    bullets: [
      'Supabase: banco de dados e armazenamento das imagens.',
      'Hostinger: hospedagem do servidor e envio dos e-mails de recuperação de senha.',
      'Google: login com a conta Google, apenas se você escolher essa opção.',
    ],
    after: [
      'Esses serviços podem guardar os dados em servidores fora do Brasil. Essa transferência internacional é feita apenas para prestar o serviço (art. 33 da LGPD). Os dados também podem ser fornecidos a autoridades, quando houver ordem judicial ou obrigação legal.',
    ],
  },
  {
    title: '6. Por quanto tempo guardamos',
    bullets: [
      'Enquanto a sua conta existir.',
      'Ao excluir a conta, apagamos na hora: nome, e-mail, data de nascimento, foto de perfil, doações e suas fotos, mensagens, favoritos, avaliações e notificações. No histórico de doações da outra pessoa, você passa a aparecer como "Usuário excluído".',
      'Contas desativadas pela moderação são apagadas definitivamente após 30 dias.',
      'Cópias de segurança automáticas do banco de dados podem manter dados por um curto período, até serem substituídas.',
    ],
  },
  {
    title: '7. Seus direitos',
    paragraphs: ['Pelo art. 18 da LGPD, você pode pedir a qualquer momento:'],
    bullets: [
      'Confirmação de que tratamos os seus dados e acesso a eles.',
      'Correção de dados incompletos ou errados. Nome e foto você mesmo altera no Perfil.',
      'Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei.',
      'Portabilidade dos dados para outro serviço.',
      'Eliminação dos dados e exclusão da conta. Você mesmo faz isso em Perfil › Excluir minha conta.',
      'Informação sobre com quem compartilhamos os seus dados.',
      'Revisão ou oposição a um tratamento baseado em legítimo interesse.',
    ],
    after: [
      `Para os demais pedidos, escreva para ${CONTACT_EMAIL}. Respondemos em até 15 dias. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).`,
    ],
  },
  {
    title: '8. Segurança',
    paragraphs: [
      'Usamos conexão criptografada (HTTPS), senhas guardadas com hash bcrypt, sessões com token assinado que expira em 7 dias e acesso restrito ao painel de administração. Nenhum sistema é totalmente imune a falhas. Se ocorrer um incidente de segurança que possa trazer risco a você, avisaremos você e a ANPD (art. 48).',
    ],
  },
  {
    title: '9. Armazenamento no navegador',
    paragraphs: [
      'Para manter você conectado, guardamos o token da sua sessão no armazenamento local do navegador. Ele é apagado quando você sai da conta. Não usamos cookies de publicidade nem de rastreamento. Ao entrar com o Google, a janela de login é do Google e segue a política de privacidade dele.',
    ],
  },
  {
    title: '10. Menores de idade',
    paragraphs: [
      `O Pote Cheio é destinado a pessoas com ${MIN_AGE} anos ou mais. Se identificarmos uma conta de menor de idade, ela será removida.`,
    ],
  },
  {
    title: '11. Alterações desta política',
    paragraphs: [
      'Esta política pode ser atualizada. Quando houver mudança relevante, pediremos o seu aceite da nova versão no próximo acesso.',
    ],
  },
];
